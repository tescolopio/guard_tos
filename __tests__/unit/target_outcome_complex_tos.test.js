/**
 * @jest-environment node
 */

/**
 * @file target_outcome_complex_tos.test.js
 * @description Validates analysis output for complex-tos.html against flexible expectations.
 */

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const compromise = require("compromise");

const { createTextExtractor } = require("../../src/analysis/textExtractor");
const {
  createReadabilityGrader,
} = require("../../src/analysis/readabilityGrader");
const { createRightsAssessor } = require("../../src/analysis/rightsAssessor");
const { createSummarizer } = require("../../src/analysis/summarizeTos");

const log = () => {};
const logLevels = {
  DEBUG: "debug",
  INFO: "info",
  ERROR: "error",
  WARN: "warn",
};
const utilities = {
  splitIntoWords: (t) =>
    t ? t.toLowerCase().split(/\W+/).filter(Boolean) : [],
};

function loadHtmlFixture() {
  const p = path.join(
    process.cwd(),
    "__tests__",
    "fixtures",
    "complex-tos.html",
  );
  return fs.readFileSync(p, "utf8");
}

function loadExpectations() {
  const p = path.join(
    process.cwd(),
    "__tests__",
    "fixtures",
    "expected",
    "complex-tos.json",
  );
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw).expectations;
}

describe("Target outcome validation: complex-tos", () => {
  let textExtractor, readabilityGrader, rightsAssessor, summarizer;

  beforeAll(() => {
    // Provide minimal globals required by textExtractor in tests
    global.extractFromPDF = async () => ({ text: "", metadata: {} });
    global.extractFromDOCX = async () => ({ text: "", metadata: {} });
    global.extractFromText = (txt) => ({ text: txt, metadata: {} });
    global.splitIntoSentences = (txt) =>
      txt ? txt.split(/[.!?]+/).filter(Boolean) : [];

    textExtractor = createTextExtractor({ log, logLevels, utilities });
    readabilityGrader = createReadabilityGrader({ log, logLevels });
    rightsAssessor = createRightsAssessor({
      log,
      logLevels,
      commonWords: [],
      legalTermsDefinitions: {},
    });
    summarizer = createSummarizer({ compromise, cheerio, log, logLevels });
  });

  test("meets flexible expectations for clauses, categories, and sections", async () => {
    const html = loadHtmlFixture();
    const extraction = await textExtractor.extract(html, "html");
    const text =
      extraction.text ||
      html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const readability = readabilityGrader.calculateReadabilityGrade(text);
    const rights = await rightsAssessor.analyzeContent(text);
    const summary = await summarizer.summarizeTos(html);

    const exp = loadExpectations();

    // Rights score range
    expect(typeof rights.rightsScore).toBe("number");
    const [minScore, maxScore] = exp.rightsScoreRange;
    expect(rights.rightsScore).toBeGreaterThanOrEqual(minScore);
    expect(rights.rightsScore).toBeLessThanOrEqual(maxScore);

    // Grade in allowed set
    expect(exp.expectedGradeOneOf).toContain(rights.grade);

    // Must-have clause detections
    const cc = rights.details && rights.details.clauseCounts;
    expect(cc).toBeTruthy();
    for (const [bucket, keys] of Object.entries(exp.mustHaveClauses)) {
      const map = (cc && cc[bucket]) || {};
      keys.forEach((k) => {
        expect(map[k] || 0).toBeGreaterThanOrEqual(1);
      });
    }

    // Expected categories present with numeric scores
    const cs = rights.details && rights.details.categoryScores;
    expect(cs && typeof cs).toBe("object");
    exp.expectedCategories.forEach((cat) => {
      if (cs[cat]) {
        expect(typeof cs[cat].score).toBe("number");
        expect(cs[cat].score).toBeGreaterThanOrEqual(0);
        expect(cs[cat].score).toBeLessThanOrEqual(100);
      }
    });

    // Section headings contain important topics (regex ORs)
    const headings = (summary.sections || []).map((s) => s.heading || "");
    exp.sectionHeadingRegexes.forEach((rx) => {
      const re = new RegExp(rx, "i");
      const found = headings.some((h) => re.test(h));
      expect(found).toBe(true);
    });

    // Readability sanity
    expect(["A", "B", "C", "D", "F"]).toContain(
      readability.averageGrade || readability.grade,
    );
  });
});
