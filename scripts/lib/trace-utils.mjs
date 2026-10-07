import AdmZip from "adm-zip";
import { existsSync } from "fs";
import { join } from "path";

/**
 * Ground-truth failure context (selector, DOM markup, screenshot) pulled
 * directly from a Playwright trace.zip, instead of regex-parsing the error
 * message or fuzzy-matching screenshot directories by test name.
 *
 * Playwright's trace.zip format is undocumented and version-dependent, so
 * everything here is defensive — missing/unparseable fields return null
 * rather than throw, and callers always keep a non-trace fallback.
 */

export function loadTraceEvents(traceZipPath) {
  const zip = new AdmZip(traceZipPath);
  const events = [];

  for (const entry of zip.getEntries()) {
    if (!entry.entryName.endsWith(".trace")) continue;
    const text = entry.getData().toString("utf-8");
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      try {
        events.push(JSON.parse(line));
      } catch {
        // Partial/corrupt line (can happen if the trace was flushed mid-write) — skip it.
      }
    }
  }

  return { zip, events };
}

/**
 * Pairs "before"/"after" action events by callId and returns the first action
 * whose "after" event carries an error — i.e. the action that actually failed.
 * This is the ground-truth equivalent of grepping the error string for a
 * locator: the selector comes straight from the Playwright API call itself.
 */
export function findFailingAction(events) {
  const beforeById = new Map();
  for (const ev of events) {
    if (ev.type === "before") beforeById.set(ev.callId, ev);
  }
  for (const ev of events) {
    if (ev.type === "after" && ev.error && beforeById.has(ev.callId)) {
      return { before: beforeById.get(ev.callId), after: ev };
    }
  }
  return null;
}

export function extractSelector(failingAction) {
  const params = failingAction?.before?.params;
  if (!params) return null;
  // Compiled internal selector syntax (e.g. `button >> internal:has-text="PrimeMode"i`),
  // not the literal source string — don't indexOf()-match this against .ts files,
  // use extractSelectorTokens() for that.
  return params.selector ?? params.css ?? null;
}

/**
 * Playwright's human-readable step description, e.g.
 * `Click locator('button').filter({ hasText: 'PrimeMode' })`. Mirrors the
 * literal JS call shape far more closely than params.selector does, which
 * makes it far more useful for locating the matching line in source.
 */
export function extractApiName(failingAction) {
  return failingAction?.before?.title ?? failingAction?.before?.method ?? null;
}

/**
 * Pulls literal quoted tokens out of the step title — e.g. "button" and
 * "PrimeMode" out of `Click locator('button').filter({ hasText: 'PrimeMode' })`.
 * These are the tokens actually likely to appear verbatim in a Page Object
 * file, unlike the compiled internal selector string.
 */
export function extractSelectorTokens(failingAction) {
  const title = failingAction?.before?.title;
  if (!title) return [];
  const matches = [...title.matchAll(/'([^']+)'/g)];
  return matches.map((m) => m[1]).filter(Boolean);
}

/**
 * Best-effort screenshot extraction: an explicit "screenshot"/image attachment
 * on the failing action, falling back to the largest image blob in resources/
 * (the failure frame is usually the largest one captured). Null if nothing
 * usable was found.
 */
export function extractScreenshot(zip, failingAction) {
  const resourceEntries = zip.getEntries().filter((e) => e.entryName.startsWith("resources/"));

  const attachedSha1 = failingAction?.after?.attachments?.find((a) => a.name === "screenshot" || a.contentType?.startsWith("image/"))?.sha1;

  if (attachedSha1) {
    const match = resourceEntries.find((e) => e.entryName.includes(attachedSha1));
    if (match) return match.getData().toString("base64");
  }

  let best = null;
  for (const entry of resourceEntries) {
    const data = entry.getData();
    if (!looksLikeImage(data)) continue;
    if (!best || data.length > best.length) best = data;
  }
  return best ? best.toString("base64") : null;
}

function looksLikeImage(buf) {
  if (buf.length < 8) return false;
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
  return isPng || isJpeg;
}

/**
 * Renders the DOM snapshot closest to the failing action as real HTML — can
 * reveal that the expected element never existed at all (a UI-flow bug),
 * which a screenshot or selector text alone can't tell you.
 *
 * FORMAT (reverse-engineered from real trace.zip files — undocumented and
 * version-dependent): `html` is a tree of `[TAG, attrs, ...children]` /
 * string-node shapes, except a bare number child is a back-reference into a
 * running per-frame cache of already-resolved nodes (Playwright dedupes
 * subtrees repeated across snapshots for the same frame). Resolving one
 * snapshot requires replaying every frame-snapshot event for that frameId in
 * chronological order to rebuild the cache — it can't be resolved in isolation.
 * If this breaks on a Playwright upgrade, re-derive it against a real
 * trace.zip rather than guessing (see checklist at the bottom of this file).
 */
export function extractDomSnapshot(events, failingAction, selectorTokens = [], maxLength = 4000) {
  const snapshots = events
    .filter((ev) => ev.type === "frame-snapshot")
    .map((ev) => ev.snapshot)
    .sort((a, b) => a.timestamp - b.timestamp);
  if (snapshots.length === 0) return null;

  const targetCallId = failingAction?.before?.callId;
  const targetStartTime = failingAction?.before?.startTime ?? Infinity;

  const cacheByFrame = new Map();
  let exactMatch = null;
  let closestBefore = null; // { resolved, timestamp } — most recent snapshot at/before the failing action started

  for (const snap of snapshots) {
    // Some snapshots' top-level `html` is a bare `[number, number]`
    // delta-pointer instead of a full tree (page unchanged since the last
    // snapshot for this frame) — not resolvable on its own, so skip to the
    // nearest full snapshot instead.
    const isFullSnapshot = Array.isArray(snap.html) && typeof snap.html[0] === "string";
    if (!isFullSnapshot) continue;

    if (!cacheByFrame.has(snap.frameId)) cacheByFrame.set(snap.frameId, []);
    const cache = cacheByFrame.get(snap.frameId);

    let resolved;
    try {
      resolved = resolveSnapshotNode(snap.html, cache);
    } catch {
      continue; // one malformed snapshot shouldn't break the cache chain for the rest
    }
    if (!resolved) continue;

    // Rarely hits — snapshot callIds use a different id scheme than action
    // before/after events in some Playwright versions. Timestamp fallback below is the reliable path.
    if (snap.callId === targetCallId) exactMatch = resolved;
    if (snap.timestamp <= targetStartTime && (!closestBefore || snap.timestamp > closestBefore.timestamp)) {
      closestBefore = { resolved, timestamp: snap.timestamp };
    }
  }

  const finalResolved = exactMatch ?? closestBefore?.resolved;
  if (!finalResolved) return null;

  try {
    const html = renderResolvedNode(finalResolved);
    return extractRelevantSnippet(html, selectorTokens, maxLength);
  } catch (e) {
    console.warn(`⚠️ DOM snapshot rendering failed, continuing without it: ${e.message}`);
    return null;
  }
}

/** Resolves one snapshot's compact tree, growing `cache` (that frame's node history) as it goes. */
function resolveSnapshotNode(node, cache) {
  if (typeof node === "number") return cache[node] ?? null; // back-reference to an earlier-cached node
  if (typeof node === "string") return node; // text node
  if (!Array.isArray(node)) return null;

  const tag = node[0];
  if (typeof tag !== "string") return null;

  let attrs = {};
  let childStart = 1;
  if (node[1] && typeof node[1] === "object" && !Array.isArray(node[1])) {
    attrs = node[1];
    childStart = 2;
  }

  const children = node.slice(childStart).map((c) => resolveSnapshotNode(c, cache));
  const resolved = { tag, attrs, children };
  cache.push(resolved); // register AFTER resolving children — matches the encounter order back-references index into
  return resolved;
}

const VOID_TAGS = new Set(["BASE", "LINK", "META", "BR", "HR", "IMG", "INPUT"]);
// Rendering these tags' children would dump raw CSS/JS into the prompt for zero
// locator-relevant signal — keep the tag (useful for context) but drop its content.
const CONTENT_STRIPPED_TAGS = new Set(["SCRIPT", "STYLE"]);

function renderResolvedNode(node) {
  if (typeof node === "string") return escapeText(node);
  if (!node || typeof node !== "object" || typeof node.tag !== "string") return "";

  const tagUpper = node.tag.toUpperCase();
  const attrString = Object.entries(node.attrs ?? {})
    .map(([k, v]) => ` ${k}="${escapeAttr(String(v))}"`)
    .join("");

  if (VOID_TAGS.has(tagUpper)) return `<${node.tag}${attrString}/>`;
  if (CONTENT_STRIPPED_TAGS.has(tagUpper)) return `<${node.tag}${attrString}></${node.tag}>`;

  const childHtml = (node.children ?? []).map(renderResolvedNode).join("");
  return `<${node.tag}${attrString}>${childHtml}</${node.tag}>`;
}

function escapeText(s) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
}
function escapeAttr(s) {
  return escapeText(s).replace(/"/g, "&quot;");
}

// Selector tokens mix the tag-name literal (e.g. "button") with the actually
// distinctive hasText/text value (e.g. "PrimeMode"). A generic tag name is
// present hundreds of times in any real page and matching on it first tells
// us nothing — it would silently mask the far more useful finding that the
// distinctive token isn't present anywhere at all.
const GENERIC_TAG_TOKENS = new Set([
  "a", "div", "span", "button", "input", "select", "option", "label", "form", "table", "thead", "tbody",
  "tr", "td", "th", "ul", "ol", "li", "p", "img", "svg", "path", "i", "b", "strong", "em", "section",
  "header", "footer", "nav", "h1", "h2", "h3", "h4", "h5", "h6",
]);

/**
 * Full rendered HTML is 20-50KB of mostly head boilerplate — too much for an
 * LLM prompt. Cut to <body>, then center a window on the most distinctive
 * selector token. `elementFound` is exposed as a structured signal (not just
 * text in the snippet) so callers can gate auto-fix behavior on it — a
 * confident-sounding locator suggestion is meaningless if the element never
 * rendered at all, and that shouldn't depend on Claude noticing a comment.
 */
function extractRelevantSnippet(html, tokens, maxLength) {
  const bodyIdx = html.search(/<body[\s>]/i);
  const body = bodyIdx === -1 ? html : html.slice(bodyIdx);

  const specific = tokens.filter((t) => t && !GENERIC_TAG_TOKENS.has(t.toLowerCase()));
  const candidateTokens = specific.length > 0 ? specific : tokens; // fall back to tag tokens only if nothing else was extracted

  const matchedToken = candidateTokens.find((t) => body.includes(t));
  if (!matchedToken) {
    const excerpt = body.slice(0, maxLength);
    const note = tokens.length
      ? `<!-- none of the expected tokens (${tokens.join(", ")}) were found anywhere in this DOM snapshot — the element may never have rendered, rather than the selector being stale -->\n`
      : "";
    return {
      snippet: note + excerpt + (body.length > maxLength ? "\n<!-- truncated -->" : ""),
      elementFound: tokens.length > 0 ? false : null, // null = nothing to check against, not a "not found" verdict
    };
  }

  const idx = body.indexOf(matchedToken);
  const start = Math.max(0, idx - Math.floor(maxLength / 3));
  const end = Math.min(body.length, idx + Math.ceil((maxLength * 2) / 3));
  const prefix = start > 0 ? "<!-- ...earlier DOM truncated... -->\n" : "";
  const suffix = end < body.length ? "\n<!-- ...later DOM truncated... -->" : "";
  return { snippet: prefix + body.slice(start, end) + suffix, elementFound: true };
}

/**
 * High-level entry point: given the directory Playwright wrote for a specific
 * test's output (the same directory the old code fuzzy-matched screenshots
 * in), find and parse trace.zip if it exists, and return everything we could
 * extract. Returns null (never throws) if there's no trace or nothing usable
 * in it — callers should treat that as "no upgrade available, use old path."
 */
export function getTraceFailureContext(testDir) {
  if (!testDir) return null;
  const traceZipPath = join(testDir, "trace.zip");
  if (!existsSync(traceZipPath)) return null;

  try {
    const { zip, events } = loadTraceEvents(traceZipPath);
    const failingAction = findFailingAction(events);
    if (!failingAction) return null;

    const selectorTokens = extractSelectorTokens(failingAction);
    const domResult = extractDomSnapshot(events, failingAction, selectorTokens);

    return {
      selector: extractSelector(failingAction),
      selectorTokens,
      apiName: extractApiName(failingAction),
      screenshot: extractScreenshot(zip, failingAction),
      domSnapshot: domResult?.snippet ?? null,
      // true/false only when selectorTokens gave us something to check against;
      // null means "couldn't determine" — treat that as "don't know", not "found".
      domSnapshotElementFound: domResult?.elementFound ?? null,
    };
  } catch (e) {
    console.warn(`⚠️ Failed to parse trace at ${traceZipPath}, falling back to non-trace data: ${e.message}`);
    return null;
  }
}

/**
 * If a future Playwright upgrade breaks this: run against a real trace.zip
 * (`node -e "import('./trace-utils.mjs').then(m => console.log(m.getTraceFailureContext('test-results/<dir>')))"`)
 * and check `domSnapshot` still produces real page content, not empty/garbled
 * output — if it does, re-derive resolveSnapshotNode()'s shape empirically
 * rather than guessing.
 */
