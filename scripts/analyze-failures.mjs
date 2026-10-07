import { XMLParser } from "fast-xml-parser";
import { readFileSync, existsSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL;
const GITHUB_RUN_ID = process.env.GITHUB_RUN_ID || "";
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || "";
const QASE_PROJECT = "FP";
// Written after posting so self-heal-locators.mjs (next step, same job/runner)
// can merge its suggestion into this message via chat.update instead of
// posting a separate one.
const SLACK_MAP_PATH = process.env.SLACK_ANALYSIS_MAP_PATH || "test-results/slack-analysis-map.json";

function parseResults(xmlPath) {
  if (!existsSync(xmlPath)) {
    console.error(`❌ results.xml not found at ${xmlPath}`);
    process.exit(0);
  }

  const xml = readFileSync(xmlPath, "utf-8");
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const parsed = parser.parse(xml);

  const suites = [parsed.testsuites?.testsuite ?? parsed.testsuite].flat().filter(Boolean);

  const failed = [];
  let passed = 0;
  let skipped = 0;
  let total = 0;

  for (const suite of suites) {
    const cases = [suite.testcase].flat().filter(Boolean);
    for (const tc of cases) {
      total++;
      if (tc.failure || tc.error) {
        const errorText = tc.failure?.["#text"] ?? tc.failure ?? tc.error?.["#text"] ?? tc.error ?? "";
        const screenshot = findScreenshot(tc["@_classname"], tc["@_name"]);
        failed.push({
          name: tc["@_name"] ?? "Unknown test",
          classname: tc["@_classname"] ?? "",
          duration: parseFloat(tc["@_time"] ?? "0"),
          error: String(errorText).slice(0, 3000),
          screenshot,
        });
      } else if (tc.skipped !== undefined) {
        skipped++;
      } else {
        passed++;
      }
    }
  }

  return { failed, passed, skipped, total };
}

function findScreenshot(classname = "", testname = "") {
  const base = "test-results";
  if (!existsSync(base)) return null;

  const normalized = testname
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 40);

  try {
    const dirs = readdirSync(base, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.toLowerCase().includes(normalized.slice(0, 15)))
      .map((d) => d.name);

    for (const dir of dirs) {
      const files = readdirSync(join(base, dir)).filter((f) => f.endsWith(".png"));
      if (files.length > 0) {
        const imgPath = join(base, dir, files[0]);
        return readFileSync(imgPath).toString("base64");
      }
    }
  } catch (_) {}
  return null;
}

async function analyzeWithClaude(test) {
  const content = [
    {
      type: "text",
      text: `You are a senior QA engineer. Analyze the failed Playwright e2e test.
Project: Playwright CRM (${QASE_PROJECT})
Test: ${test.classname} > ${test.name}
Duration: ${test.duration.toFixed(1)}s

Error:
\`\`\`
${test.error}
\`\`\`
${test.screenshot ? "\nScreenshot of the failure moment is attached." : ""}

Reply STRICTLY in this format (do not add anything extra):
🔎 *Cause:* <max 10 words>
🛠️ *Fix:* <max 15 words — file and line if possible>
📌 *Type:* <broken locator / UI changed / flaky test / env issue / real bug>`,
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
    return data.content?.[0]?.text ?? "Analysis unavailable";
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

async function postResults({ failed, analyses }) {
  if (failed.length === 0) {
    console.log("✅ No failures — skipping Slack notification");
    return;
  }

  const artifactsUrl = GITHUB_RUN_ID ? `https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}` : null;

  // Retry finding Qase message up to 6 times with 10s delay
  let threadTs;
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
    if (qaseMsg) {
      threadTs = qaseMsg.ts;
      break;
    }
  }

  const slackMap = {};

  for (let i = 0; i < failed.length; i++) {
    const test = failed[i];
    const analysis = analyses[i];

    const payload = {
      channel: SLACK_CHANNEL,
      text: `🔴 ${test.name}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🔴 *${test.name}*\n⏱ ${test.duration.toFixed(1)}s`,
          },
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: `*🧠 AI Analysis:*\n${analysis}` },
        },
      ],
    };

    if (artifactsUrl) {
      payload.blocks.push({
        type: "actions",
        elements: [{ type: "button", text: { type: "plain_text", text: "📎 GitHub Artifacts" }, url: artifactsUrl }],
      });
    }

    if (threadTs) payload.thread_ts = threadTs;

    const res = await slackPost(payload);
    if (res.ok) {
      const identityKey = `${test.classname}::${test.name}`;
      slackMap[identityKey] = { channel: SLACK_CHANNEL, ts: res.ts, blocks: payload.blocks };
    } else {
      console.warn(`⚠️ Failed to post Slack message for "${test.name}": ${res.error}`);
    }
  }

  writeFileSync(SLACK_MAP_PATH, JSON.stringify(slackMap, null, 2));
  console.log(`✅ Posted to Slack: ${failed.length} failures analyzed`);
}

async function main() {
  if (!ANTHROPIC_API_KEY || !SLACK_BOT_TOKEN) {
    console.error("❌ ANTHROPIC_API_KEY and SLACK_BOT_TOKEN are required");
    process.exit(1);
  }

  const { failed, passed, skipped, total } = parseResults("test-results/results.xml");

  console.log(`📊 Results: ${passed} passed, ${failed.length} failed, ${skipped} skipped`);

  if (failed.length === 0) {
    await postResults({ failed, analyses: [] });
    return;
  }

  console.log(`🤖 Analyzing ${failed.length} failure(s) with Claude...`);

  const analyses = [];
  for (let i = 0; i < failed.length; i += 3) {
    const batch = failed.slice(i, i + 3);
    const batchResults = await Promise.all(batch.map(analyzeWithClaude));
    analyses.push(...batchResults);
  }

  await postResults({ failed, analyses });
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
