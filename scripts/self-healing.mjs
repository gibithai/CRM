import { writeFileSync, readFileSync } from "fs";
import { execSync } from "child_process";
import {
  parseResults,
  findLocatorInPageObjects,
  findLocatorByTokens,
  shouldSkipAsTeardownFlake,
} from "./lib/locator-failures.mjs";
import { getTraceFailureContext } from "./lib/trace-utils.mjs";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PERSONAL_ACCESS_TOKEN = process.env.PERSONAL_ACCESS_TOKEN;
const GITHUB_RUN_ID = process.env.GITHUB_RUN_ID || "local";
const GITHUB_RUN_ATTEMPT = process.env.GITHUB_RUN_ATTEMPT || "1";
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || "";
const GITHUB_REF_NAME = process.env.GITHUB_REF_NAME || "main";
const PAGES_DIR = process.env.PAGES_DIR || "pages";
const TEST_RESULTS_DIR = process.env.TEST_RESULTS_DIR || "test-results";

// "high" | "medium" | "low" — minimum confidence Claude must return before we touch the file
const CONFIDENCE_THRESHOLD = process.env.SELF_HEAL_MIN_CONFIDENCE || "medium";
const CONFIDENCE_RANK = { low: 0, medium: 1, high: 2 };

/**
 * Layers trace.zip-derived context on top of the regex/directory-matched
 * fallback. `selector` is upgraded to the ground-truth value read directly
 * from the Playwright API call whenever a trace is available — this is what
 * actually finds the right Page Object line, since the old regex against the
 * stringified error message could mis-extract or miss selectors entirely.
 */
function enrichWithTrace(test) {
  const traceCtx = getTraceFailureContext(test.testDir);

  return {
    ...test,
    selector: traceCtx?.selector ?? test.selector,
    selectorTokens: traceCtx?.selectorTokens ?? [],
    screenshot: traceCtx?.screenshot ?? null,
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
      text: `You are a senior QA automation engineer performing an AUTOMATED locator repair inside a CI pipeline. Your output will be applied to the source file programmatically — it must be exact, runnable TypeScript, nothing else.

Test: ${test.classname} > ${test.name}
Old locator (${test.selectorSource === "trace" ? "read directly from the Playwright trace" : "extracted from error text"}): ${test.selector ?? "unknown"}

Playwright error:
\`\`\`
${test.error}
\`\`\`

The offending line lives in ${poInfo.file}:${poInfo.lineNumber}. Surrounding context:
\`\`\`typescript
${poInfo.context}
\`\`\`
${
  test.domSnapshot
    ? `\nDOM markup at the moment of failure (reconstructed from the Playwright trace) — use this as ground truth for what the element looks like now:\n\`\`\`html\n${test.domSnapshot}\n\`\`\``
    : ""
}
${test.screenshot ? "\nA screenshot of the failure moment is also attached." : ""}

Prefer getByRole/getByTestId/getByText/getByLabel over brittle CSS or nth-child selectors when the DOM markup or screenshot gives you enough information to do so. Keep the same statement shape, indentation and method signature as the original line — only change the locator expression itself.

Respond with ONLY raw JSON (no markdown fences, no commentary, no trailing text), in exactly this shape:
{"newLine": "<the full replacement line of TypeScript code, exactly as it should appear in the file>", "reasoning": "<max 20 words>", "confidence": "high|medium|low"}`,
    },
  ];

  if (test.screenshot) {
    content.push({ type: "image", source: { type: "base64", media_type: "image/png", data: test.screenshot } });
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
        max_tokens: 300,
        messages: [{ role: "user", content }],
      }),
    });
    const data = await res.json();
    const raw = (data.content?.[0]?.text ?? "")
      .trim()
      .replace(/^```json\s*|```$/g, "")
      .trim();
    const parsed = JSON.parse(raw);
    if (!parsed.newLine || !parsed.confidence) return null;
    return parsed;
  } catch (e) {
    console.error(`⚠️ Claude suggestion failed for "${test.name}": ${e.message}`);
    return null;
  }
}

function applyFix(poInfo, newLine) {
  const lines = readFileSync(poInfo.file, "utf-8").split("\n");
  if (lines[poInfo.lineNumber - 1] !== poInfo.originalLine) {
    console.warn(`⚠️ ${poInfo.file}:${poInfo.lineNumber} changed since it was read — skipping to avoid corrupting the file`);
    return false;
  }
  lines[poInfo.lineNumber - 1] = newLine;
  writeFileSync(poInfo.file, lines.join("\n"));
  return true;
}

function run(cmd, { redactedLabel } = {}) {
  try {
    return execSync(cmd, { stdio: "pipe" }).toString().trim();
  } catch (e) {
    // execSync embeds the full failing command (including any secrets in it) in
    // e.message. Never let that escape to the top-level catch/log — re-throw a
    // clean error instead.
    throw new Error(`Command failed${redactedLabel ? `: ${redactedLabel}` : ""}`);
  }
}

function setupGit(branchName) {
  run(`git config --global --add safe.directory ${process.cwd()}`);
  run(`git config user.name "self-healing-bot"`);
  run(`git config user.email "self-healing-bot@users.noreply.github.com"`);

  // actions/checkout injects an auth header for GITHUB_TOKEN that can shadow our PAT — drop it
  try {
    run(`git config --unset-all http.https://github.com/.extraheader`);
  } catch (_) {}

  run(`git remote set-url origin https://x-access-token:${PERSONAL_ACCESS_TOKEN}@github.com/${GITHUB_REPOSITORY}.git`, {
    redactedLabel: "git remote set-url origin",
  });
  run(`git checkout -b ${branchName}`);
}

function commitAndPush(branchName, changedFiles) {
  for (const file of changedFiles) run(`git add -- "${file}"`);

  let staged = "";
  try {
    staged = run("git diff --cached --name-only");
  } catch (_) {}
  if (!staged) {
    console.log("ℹ️ Nothing staged — skipping commit/push");
    return false;
  }

  run(`git commit -m "fix(self-healing): auto-repair broken locators [run ${GITHUB_RUN_ID}]"`);
  run(`git push -u origin ${branchName}`, { redactedLabel: "git push" });
  return true;
}

async function createPullRequest(branchName, fixes) {
  const body = [
    `🧠 Automated locator repair generated by \`self-healing.mjs\` from run [${GITHUB_RUN_ID}](https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}).`,
    "",
    "**Please review carefully before merging — this was applied by an LLM, not a human.**",
    "",
    ...fixes.map(
      (f) =>
        `### ${f.test.name}\n` +
        `- File: \`${f.poInfo.file}:${f.poInfo.lineNumber}\`\n` +
        `- Old: \`${f.poInfo.originalLine.trim()}\`\n` +
        `- New: \`${f.newLine.trim()}\`\n` +
        `- Selector source: ${f.test.selectorSource === "trace" ? "Playwright trace (ground truth)" : "regex fallback"}\n` +
        `- Confidence: ${f.suggestion.confidence}\n` +
        `- Reasoning: ${f.suggestion.reasoning}\n`
    ),
  ].join("\n");

  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/pulls`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PERSONAL_ACCESS_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `🩹 Self-healing: repair ${fixes.length} broken locator(s) [run ${GITHUB_RUN_ID}]`,
      head: branchName,
      base: GITHUB_REF_NAME,
      body,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("❌ PR creation failed:", data);
    return null;
  }
  return data.html_url;
}

async function main() {
  if (!ANTHROPIC_API_KEY) {
    console.error("❌ ANTHROPIC_API_KEY is required");
    process.exit(1);
  }
  if (!PERSONAL_ACCESS_TOKEN || !GITHUB_REPOSITORY) {
    console.log("ℹ️ PERSONAL_ACCESS_TOKEN or GITHUB_REPOSITORY not set — skipping self-healing PR step");
    process.exit(0);
  }

  const parsed = parseResults("test-results/results.xml", { testResultsDir: TEST_RESULTS_DIR });
  if (parsed.length === 0) {
    console.log("✅ No locator-related failures — nothing to heal");
    return;
  }

  const enriched = parsed.map(enrichWithTrace);
  const teardownFlakes = enriched.filter(shouldSkipAsTeardownFlake).length;
  const failed = enriched.filter((t) => !shouldSkipAsTeardownFlake(t));

  if (teardownFlakes > 0) {
    console.log(`ℹ️ Skipped ${teardownFlakes} failure(s) that look like pure teardown flakiness (no selector lead)`);
  }
  if (failed.length === 0) {
    console.log("✅ No locator-related failures — nothing to heal");
    return;
  }

  const traceHits = failed.filter((t) => t.selectorSource === "trace").length;
  console.log(
    `🩹 Found ${failed.length} locator-related failure(s) (${traceHits} resolved via trace, ${
      failed.length - traceHits
    } via regex fallback), asking Claude for repairs...`
  );

  const candidates = [];
  for (const test of failed) {
    const poInfo = locatePageObject(test);
    if (!poInfo) {
      console.log(`ℹ️ Could not locate "${test.selector}" in ${PAGES_DIR}/ — skipping "${test.name}"`);
      continue;
    }
    candidates.push({ test, poInfo });
  }

  if (candidates.length === 0) {
    console.log("ℹ️ No matching Page Object locators found — nothing to heal");
    return;
  }

  const fixes = [];
  const seen = new Set(); // dedupe same file:line across multiple failing tests

  for (const { test, poInfo } of candidates) {
    const key = `${poInfo.file}:${poInfo.lineNumber}`;
    if (seen.has(key)) continue;

    // Ground truth from the trace says the expected element never rendered
    // anywhere on the page — that's a UI-flow bug, not a stale selector, and
    // no locator replacement can fix it. Don't even ask Claude to guess one;
    // this always needs a human, regardless of what confidence it might return.
    if (test.domSnapshotElementFound === false) {
      console.log(`⚠️ Skipping "${test.name}" — DOM snapshot shows none of the expected tokens ever rendered on the page. Needs manual investigation, not an auto-fix.`);
      continue;
    }

    const suggestion = await suggestFixWithClaude(test, poInfo);
    if (!suggestion) continue;

    if (CONFIDENCE_RANK[suggestion.confidence] < CONFIDENCE_RANK[CONFIDENCE_THRESHOLD]) {
      console.log(`ℹ️ Skipping "${test.name}" — confidence "${suggestion.confidence}" below threshold "${CONFIDENCE_THRESHOLD}"`);
      continue;
    }

    if (suggestion.newLine.trim() === poInfo.originalLine.trim()) {
      console.log(`ℹ️ Suggested line identical to original for "${test.name}" — skipping`);
      continue;
    }

    seen.add(key);
    fixes.push({ test, poInfo, suggestion, newLine: suggestion.newLine });
  }

  if (fixes.length === 0) {
    console.log("ℹ️ No fixes met the confidence threshold — nothing to commit");
    return;
  }

  const branchName = `fix/self-healing-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}`;
  setupGit(branchName);

  const changedFiles = new Set();
  const appliedFixes = [];
  for (const fix of fixes) {
    if (applyFix(fix.poInfo, fix.newLine)) {
      changedFiles.add(fix.poInfo.file);
      appliedFixes.push(fix);
    }
  }

  if (appliedFixes.length === 0) {
    console.log("ℹ️ No fixes could be applied — nothing to commit");
    return;
  }

  const pushed = commitAndPush(branchName, [...changedFiles]);
  if (!pushed) return;

  const prUrl = await createPullRequest(branchName, appliedFixes);
  if (prUrl) console.log(`✅ Self-healing PR created: ${prUrl}`);
}

main().catch((e) => {
  console.error("Fatal error:", e.message);
  process.exit(1);
});
