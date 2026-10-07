import { XMLParser } from "fast-xml-parser";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

// Shared between self-heal-locators.mjs and self-healing.mjs so the two scripts
// can't drift out of sync with each other.
export const LOCATOR_ERROR_PATTERNS = [
  /waiting for locator/i,
  /toBeVisible.*failed/i,
  /toBeAttached.*failed/i,
  /strict mode violation/i,
  /element is not attached to the DOM/i,
  /exceeded while waiting for/i,
  // Assertions where the element was found but its content/state is wrong
  // (typical after UI changes: column shifts, reordered elements, renamed labels)
  /toHaveText.*failed/i,
  /toContainText.*failed/i,
  /toHaveValue.*failed/i,
  /toHaveCount.*failed/i,
  /expect.*toHaveText/i,
  /expect.*toContainText/i,
  // expect(x).toBe(...) with empty received text — typical broken cell/column selector
  /Received:\s*""/,
];

/**
 * Parses results.xml and returns locator-related failures. Each result includes
 * `testDir` — the matched Playwright output directory for that test, which
 * callers use to look for trace.zip / screenshots. `selector` here is the
 * regex-extracted fallback; callers should prefer a trace-derived selector
 * when one is available.
 */
export function parseResults(xmlPath, { testResultsDir = "test-results" } = {}) {
  if (!existsSync(xmlPath)) {
    console.error(`❌ results.xml not found at ${xmlPath}`);
    return [];
  }

  const xml = readFileSync(xmlPath, "utf-8");
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const parsed = parser.parse(xml);
  const suites = [parsed.testsuites?.testsuite ?? parsed.testsuite].flat().filter(Boolean);

  // Playwright's JUnit reporter writes one <testcase> per RETRY ATTEMPT, not
  // one per test — so a flaky test that fails twice before Playwright gives
  // up produces two <testcase> nodes with the same name/classname. We only
  // want to report on it once, using the LAST attempt (the final result
  // after retries are exhausted), so we key by test identity and overwrite
  // as we go — later entries in file order replace earlier ones.
  const byTestIdentity = new Map();

  for (const suite of suites) {
    const cases = [suite.testcase].flat().filter(Boolean);
    for (const tc of cases) {
      if (!tc.failure && !tc.error) continue;

      const errorText = tc.failure?.["#text"] ?? tc.failure ?? tc.error?.["#text"] ?? tc.error ?? "";
      const errorString = String(errorText);
      if (!LOCATOR_ERROR_PATTERNS.some((re) => re.test(errorString))) continue; // not locator-related — skip

      const name = tc["@_name"] ?? "Unknown test";
      const classname = tc["@_classname"] ?? "";
      const identityKey = `${classname}::${name}`;

      byTestIdentity.set(identityKey, {
        name,
        classname,
        error: errorString.slice(0, 3000),
        selector: extractSelectorFromError(errorString), // regex fallback only
        testDir: findTestOutputDir(testResultsDir, name),
        // A "page/context/browser closed" error can be a masked stale locator
        // (a prior test's timeout corrupted a shared page) rather than genuine
        // teardown flakiness — only tell apart once trace context is
        // available, so defer to shouldSkipAsTeardownFlake() below.
        looksLikeTeardownClose: /(page|context|browser)\s+(has been|was)\s+closed/i.test(errorString),
      });
    }
  }

  return [...byTestIdentity.values()];
}

/**
 * Locates the Playwright output directory for a given test (contains
 * trace.zip, screenshots, etc). Retry attempts get suffixed directory names
 * like `-retry1`, `-retry2` — when multiple candidates match, this prefers
 * the highest retry number (the final, most relevant attempt) rather than
 * whichever directory the filesystem happens to list first.
 */
export function findTestOutputDir(testResultsDir, testname = "") {
  if (!existsSync(testResultsDir)) return null;
  const normalized = testname
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 40);

  try {
    const dirs = readdirSync(testResultsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.toLowerCase().includes(normalized.slice(0, 15)))
      .map((d) => d.name);

    if (dirs.length === 0) return null;
    if (dirs.length === 1) return join(testResultsDir, dirs[0]);

    const retryNumber = (dirName) => {
      const m = dirName.match(/-retry(\d+)/i);
      return m ? parseInt(m[1], 10) : 0;
    };
    dirs.sort((a, b) => retryNumber(b) - retryNumber(a));
    return join(testResultsDir, dirs[0]);
  } catch {
    return null;
  }
}

/**
 * Call after trace enrichment has set `test.selector` (trace-derived or
 * regex-fallback). A "page/context/browser closed" error is only treated as
 * pure teardown flakiness — not worth a locator suggestion — when we truly
 * have no lead on what element was involved. If a selector was recovered
 * from either the trace or the regex fallback, there's enough to work with,
 * so it's treated as a genuine (if masked) locator failure instead.
 */
export function shouldSkipAsTeardownFlake(test) {
  return Boolean(test.looksLikeTeardownClose) && !test.selector;
}

export function findScreenshotInDir(testDir) {
  if (!testDir || !existsSync(testDir)) return null;
  try {
    const files = readdirSync(testDir).filter((f) => f.endsWith(".png"));
    if (files.length > 0) return readFileSync(join(testDir, files[0])).toString("base64");
  } catch {
    // ignore — caller treats null as "no screenshot available"
  }
  return null;
}

// Fallback only — prefer a trace-derived selector when trace-utils.getTraceFailureContext() has one.
export function extractSelectorFromError(errorText = "") {
  const locatorMatch = errorText.match(/locator\(['"`](.+?)['"`]\)/);
  if (locatorMatch) return locatorMatch[1];

  const handleMatch = errorText.match(/\.\$\$?\(\s*['"`](.+?)['"`]\s*\)/);
  if (handleMatch) return handleMatch[1];

  const locatorLineMatch = errorText.match(/Locator:\s*(.+)/);
  if (locatorLineMatch) return locatorLineMatch[1].trim();

  const getByMatch = errorText.match(/getBy(Role|Text|Label|Placeholder|TestId|AltText|Title)\((.+?)\)/);
  if (getByMatch) return `getBy${getByMatch[1]}(${getByMatch[2]})`;

  return null;
}

export function walkDir(dir) {
  let results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(walkDir(fullPath));
    else results.push(fullPath);
  }
  return results;
}

function normalize(s = "") {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Given a set of candidate matches in PO files, disambiguates using the
 * failing test's classname/name against the file path. Shared by both the
 * exact-selector and token-based lookups below so they behave consistently.
 */
function disambiguateMatches(matches, test, describeFor) {
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  const testTokens = normalize(`${test?.classname ?? ""} ${test?.name ?? ""}`);
  const scored = matches.map((m) => {
    const segments = m.file
      .split("/")
      .filter(Boolean)
      .map((seg) => normalize(seg.replace(/\.ts$/i, "").replace(/po$/i, "")));
    return { ...m, matchesKeyword: segments.some((seg) => seg.length >= 4 && testTokens.includes(seg)) };
  });

  const keywordMatches = scored.filter((m) => m.matchesKeyword);
  if (keywordMatches.length === 1) return keywordMatches[0];

  console.log(
    `⚠️ "${describeFor}" appears in ${matches.length} Page Object files and none uniquely matches "${test?.name}" — skipping to avoid patching/quoting the wrong file:\n` +
      matches.map((m) => `   - ${m.file}:${m.lineNumber}`).join("\n")
  );
  return null;
}

function buildMatch(file, content, idx) {
  const allLines = content.split("\n");
  const lineNumber = content.slice(0, idx).split("\n").length; // 1-based
  const contextStart = Math.max(lineNumber - 4, 0);
  const contextEnd = Math.min(lineNumber + 3, allLines.length);
  return {
    file,
    lineNumber,
    originalLine: allLines[lineNumber - 1],
    context: allLines.slice(contextStart, contextEnd).join("\n"),
  };
}

/**
 * Finds where a selector is declared in the Page Object files via an exact
 * substring match. Works for the regex-extracted fallback selector, but NOT
 * for a trace-derived selector — Playwright's trace records the *compiled
 * internal* selector syntax (e.g. `button >> internal:has-text="X"i`), which
 * never appears verbatim in source. Use findLocatorByTokens() for that case.
 */
export function findLocatorInPageObjects(selector, test, pagesDir = "pages") {
  if (!selector || !existsSync(pagesDir)) return null;
  const files = walkDir(pagesDir).filter((f) => f.endsWith(".ts"));

  const matches = [];
  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const idx = content.indexOf(selector);
    if (idx === -1) continue;
    matches.push(buildMatch(file, content, idx));
  }

  return disambiguateMatches(matches, test, selector);
}

/**
 * Finds where a selector is declared using literal tokens pulled from
 * Playwright's human-readable step title (e.g. ["button", "PrimeMode"] from
 * `locator('button').filter({ hasText: 'PrimeMode' })`). A line only counts
 * as a match if ALL tokens appear on it — this is the reliable path for
 * trace-derived selectors, since these tokens mirror the literal source call
 * far more closely than the compiled internal selector string does.
 */
export function findLocatorByTokens(tokens, test, pagesDir = "pages") {
  if (!tokens || tokens.length === 0 || !existsSync(pagesDir)) return null;
  const files = walkDir(pagesDir).filter((f) => f.endsWith(".ts"));

  const matches = [];
  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (tokens.every((tok) => lines[i].includes(tok))) {
        const idx = lines.slice(0, i).join("\n").length + (i > 0 ? 1 : 0);
        matches.push(buildMatch(file, content, idx));
        break; // one match per file is enough for disambiguation purposes
      }
    }
  }

  return disambiguateMatches(matches, test, tokens.join(", "));
}
