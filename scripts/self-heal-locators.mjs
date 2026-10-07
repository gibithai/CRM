import { readFileSync, existsSync } from "fs";
import {
  parseResults,
  findScreenshotInDir,
  findLocatorInPageObjects,
  findLocatorByTokens,
  shouldSkipAsTeardownFlake,
} from "./lib/locator-failures.mjs";
import { getTraceFailureContext } from "./lib/trace-utils.mjs";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL;
const GITHUB_RUN_ID = process.env.GITHUB_RUN_ID || "";
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || "";
const PAGES_DIR = process.env.PAGES_DIR || "pages";
// Written by analyze-failures.mjs (previous step, same job/runner) — lets us
// merge our suggestion into its message instead of posting a separate one.
const SLACK_MAP_PATH = process.env.SLACK_ANALYSIS_MAP_PATH || "test-results/slack-analysis-map.json";
const TEST_RESULTS_DIR = process.env.TEST_RESULTS_DIR || "test-results";

/**
 * Layers trace.zip-derived context (ground-truth selector, DOM snapshot,
 * screenshot) on top of the regex/directory-matched fallback that parseResults()
 * already gathered. If no trace is available (or it fails to parse), everything
 * quietly falls back to the old behavior — nothing here is a hard requirement.
 */
function enrichWithTrace(test) {
  const traceCtx = getTraceFailureContext(test.testDir);

  return {
    ...test,
    selector: traceCtx?.selector ?? test.selector,
    selectorTokens: traceCtx?.selectorTokens ?? [],
    screenshot: traceCtx?.screenshot ?? findScreenshotInDir(test.testDir),
    domSnapshot: traceCtx?.domSnapshot ?? null,
    domSnapshotElementFound: traceCtx?.domSnapshotElementFound ?? null,
    selectorSource: traceCtx?.selector ? "trace" : "regex",
  };
}

/**
 * Trace-derived selectors are Playwright's compiled internal syntax and
 * won't literally appear in source — use token-based matching for those.
 * Regex-fallback selectors are closer to literal source text, so try an
 * exact match first and only fall back to tokens if that misses.
 */
function locatePageObject(test) {
  const exact = findLocatorInPageObjects(test.selector, test, PAGES_DIR);
  if (exact) return exact;
  return findLocatorByTokens(test.selectorTokens, test, PAGES_DIR);
}

async function suggestFixWithClaude(test, poInfo) {
  const content = [
    {
      type: "text",
      text: `You are a senior QA automation engineer. A Playwright locator broke, most likely because the UI changed.
Test: ${test.classname} > ${test.name}
Old locator: ${test.selector ?? "could not extract from error"} (source: ${test.selectorSource})

Error:
\`\`\`
${test.error}
\`\`\`
${
  poInfo
    ? `\nPage Object location: ${poInfo.file}:${poInfo.lineNumber}\n\`\`\`typescript\n${poInfo.context}\n\`\`\``
    : "\nCould not find this locator in Page Object files — it may be inline."
}
${test.domSnapshot ? `\nDOM markup at the moment of failure (reconstructed from the Playwright trace):\n\`\`\`html\n${test.domSnapshot}\n\`\`\`` : ""}
${test.screenshot ? "\nScreenshot of the failure moment is attached." : ""}

Suggest a replacement locator (prefer getByRole/getByTestId/getByText over brittle CSS/data-slot selectors) that most likely matches the same element${
        test.domSnapshot ? " in the DOM markup above" : " in the screenshot"
      }.

Reply STRICTLY in this format (do not add anything extra):
🛠️ *Suggested locator:* \`<locator>\`
💡 *Reasoning:* <max 15 words>`,
    },
  ];

  if (test.screenshot) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/png", data: test.screenshot },
    });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        messages: [{ role: "user", content }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text ?? "Suggestion unavailable";
  } catch (e) {
    return `⚠️ Analysis error: ${e.message}`;
  }
}

async function slackPost(payload) {
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function slackUpdate(payload) {
  const res = await fetch("https://slack.com/api/chat.update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

function loadSlackMap() {
  if (!existsSync(SLACK_MAP_PATH)) return {};
  try {
    return JSON.parse(readFileSync(SLACK_MAP_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function buildSuggestionBlock(test, suggestion) {
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text:
        `*🩹 Self-healing suggestion*\n` +
        `*Old locator:*\n\`${test.selector ?? "not extracted"}\`${test.selectorSource === "trace" ? " _(from trace)_" : ""}\n${suggestion}`,
    },
  };
}

async function findQaseThreadTs() {
  // Same trick as in analyze-failures.mjs — attach to the Qase report thread.
  // NOTE: this matches Qase's message text literally; if Qase changes that
  // copy, threading silently stops (messages post un-threaded) rather than erroring.
  for (let attempt = 0; attempt < 6; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    const historyRes = await fetch(`https://slack.com/api/conversations.history?channel=${SLACK_CHANNEL}&limit=10`, {
      headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
    });
    const history = await historyRes.json();
    const twoMinutesAgo = Date.now() / 1000 - 120;
    const qaseMsg = history.messages?.find(
      (m) => m.text?.includes("Test run was completed with status *Failed*") && parseFloat(m.ts) > twoMinutesAgo
    );
    if (qaseMsg) return qaseMsg.ts;
  }
  return undefined;
}

async function postSuggestions(failures, suggestions) {
  const artifactsUrl = GITHUB_RUN_ID ? `https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}` : null;
  const slackMap = loadSlackMap();

  // Dedupe: multiple failing tests can point at the same broken locator —
  // only post one suggestion per unique selector.
  const seen = new Set();
  let merged = 0;
  let posted = 0;
  let fallbackThreadTs; // only fetched if we actually need to post standalone

  for (let i = 0; i < failures.length; i++) {
    const test = failures[i];
    const suggestion = suggestions[i];

    const dedupeKey = test.selector ?? test.name;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const suggestionBlock = buildSuggestionBlock(test, suggestion);
    const existing = slackMap[`${test.classname}::${test.name}`];

    if (existing) {
      const blocks = [...existing.blocks];
      const actionsIdx = blocks.findIndex((b) => b.type === "actions");
      if (actionsIdx === -1) blocks.push(suggestionBlock);
      else blocks.splice(actionsIdx, 0, suggestionBlock);

      const res = await slackUpdate({ channel: existing.channel, ts: existing.ts, text: `🔴 ${test.name}`, blocks });
      if (res.ok) merged++;
      else console.warn(`⚠️ Failed to merge suggestion into Slack message for "${test.name}": ${res.error}`);
      continue;
    }

    // Fallback: no AI-analysis message found for this test (e.g. that step
    // didn't run or didn't post) — post a standalone message instead.
    if (fallbackThreadTs === undefined) fallbackThreadTs = await findQaseThreadTs();

    const payload = {
      channel: SLACK_CHANNEL,
      text: `🩹 Self-healing suggestion: ${test.name}`,
      blocks: [
        {
          type: "section",
          text: { type: "mrkdwn", text: `🔴 *${test.name}*` },
        },
        suggestionBlock,
      ],
    };

    if (artifactsUrl) {
      payload.blocks.push({
        type: "actions",
        elements: [{ type: "button", text: { type: "plain_text", text: "📎 GitHub Artifacts" }, url: artifactsUrl }],
      });
    }

    if (fallbackThreadTs) payload.thread_ts = fallbackThreadTs;

    await slackPost(payload);
    posted++;
  }

  console.log(
    `✅ Self-healing suggestions: merged into ${merged} existing message(s), posted ${posted} standalone (${failures.length} failure(s) considered)`
  );
}

async function main() {
  if (!ANTHROPIC_API_KEY || !SLACK_BOT_TOKEN) {
    console.error("❌ ANTHROPIC_API_KEY and SLACK_BOT_TOKEN are required");
    process.exit(1);
  }

  const parsed = parseResults("test-results/results.xml", { testResultsDir: TEST_RESULTS_DIR });
  if (parsed.length === 0) {
    console.log("✅ No locator-related failures — nothing to suggest");
    return;
  }

  const enriched = parsed.map(enrichWithTrace);
  const teardownFlakes = enriched.filter(shouldSkipAsTeardownFlake).length;
  const failed = enriched.filter((t) => !shouldSkipAsTeardownFlake(t));

  if (teardownFlakes > 0) {
    console.log(`ℹ️ Skipped ${teardownFlakes} failure(s) that look like pure teardown flakiness (no selector lead)`);
  }
  if (failed.length === 0) {
    console.log("✅ No locator-related failures — nothing to suggest");
    return;
  }

  const traceHits = failed.filter((t) => t.selectorSource === "trace").length;
  console.log(
    `🩹 Found ${failed.length} locator-related failure(s) (${traceHits} resolved via trace, ${
      failed.length - traceHits
    } via regex fallback), asking Claude for suggestions...`
  );

  const suggestions = [];
  for (let i = 0; i < failed.length; i += 3) {
    const batch = failed.slice(i, i + 3);
    const batchResults = await Promise.all(batch.map((test) => suggestFixWithClaude(test, locatePageObject(test))));
    suggestions.push(...batchResults);
  }

  await postSuggestions(failed, suggestions);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
