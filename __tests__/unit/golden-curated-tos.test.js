/**
 * @file golden-curated-tos.test.js
 * @description Golden tests against curated real-world ToS HTML files.
 * These tests assert the presence of robust, high-signal legal sections
 * and patterns using the enhanced summarizer. Assertions are tolerant
 * to formatting/noise and focus on headings and canonical phrases.
 */

const fs = require("fs");
const path = require("path");

const cheerio = require("cheerio");
const compromise = require("compromise");
const {
  createEnhancedSummarizer,
} = require("../../src/analysis/enhancedSummarizer");

describe("Curated ToS golden assertions (enhanced summarizer)", () => {
  const log = jest.fn();
  const logLevels = { DEBUG: "debug", INFO: "info", ERROR: "error" };

  const summarizer = createEnhancedSummarizer({
    compromise,
    cheerio,
    log,
    logLevels,
  });

  function readHtml(rel) {
    const abs = path.join(__dirname, "..", "fixtures", "curated", rel);
    const html = fs.readFileSync(abs, "utf-8");
    expect(typeof html).toBe("string");
    expect(html.length).toBeGreaterThan(1000);
    return html;
  }

  function findSection(sections, regex) {
    return sections.find((s) => {
      const heading = s.heading || "";
      const body = s.originalText || s.summary || "";
      return regex.test(heading) || regex.test(body);
    });
  }

  test("GitHub Terms of Service contains liability/disclaimer and governing law", () => {
    const html = readHtml("github-terms.html");
    const result = summarizer.summarizeTos(html);

    expect(result).toHaveProperty("sections");
  expect(result.sections.length).toBeGreaterThanOrEqual(4);

    const disclaimer = findSection(
      result.sections,
      /disclaimer of warranties/i,
    );
    const liability = findSection(result.sections, /limitation of liability/i);
    expect(disclaimer).toBeTruthy();
    expect(liability).toBeTruthy();

    // Hints should include liability for the liability section
    if (liability && Array.isArray(liability.categoryHints)) {
      expect(liability.categoryHints).toEqual(
        expect.arrayContaining(["LIABILITY_AND_REMEDIES"]),
      );
    }

    // Governing Law appears under Miscellaneous
    const governing = findSection(result.sections, /governing\s+law/i);
    expect(governing).toBeTruthy();

    expect(["unknown", null, undefined]).not.toContain(result.overallRisk);
  });

  test("Pinterest Terms includes Arbitration, class action waiver, and governing law", () => {
    const html = readHtml("pinterest-terms.html");
    const result = summarizer.summarizeTos(html);

    // Pinterest page uses heavy client-side rendering and cookie overlays; section count may be low in static HTML
    expect(result.sections.length).toBeGreaterThanOrEqual(2);

    const arbitration = findSection(result.sections, /arbitration/i);
    expect(arbitration).toBeTruthy();

    // The arbitration section should mention class action waiver
    if (arbitration) {
      const content = (
        arbitration.originalText ||
        arbitration.summary ||
        ""
      ).toLowerCase();
      expect(/class\s+action/i.test(content)).toBeTruthy();
      // Hints should reflect dispute resolution and class actions when detected
      if (Array.isArray(arbitration.categoryHints)) {
        expect(arbitration.categoryHints).toEqual(
          expect.arrayContaining(["DISPUTE_RESOLUTION"]),
        );
        expect(arbitration.categoryHints).toEqual(
          expect.arrayContaining(["CLASS_ACTIONS"]),
        );
      }
    }

    const governing = findSection(
      result.sections,
      /governing\s+law|jurisdiction/i,
    );
    expect(governing).toBeTruthy();
  });

  test("Khan Academy ToS exposes DMCA and warranty/liability sections", () => {
    const html = readHtml("khan-terms.html");
    const result = summarizer.summarizeTos(html);

  expect(result.sections.length).toBeGreaterThanOrEqual(4);

    // DMCA is a common, stable heading
    const dmca = findSection(
      result.sections,
      /digital millennium copyright act|dmca/i,
    );
    expect(dmca).toBeTruthy();

    // Expect either disclaimers/no warranties or limitation of liability headings
    const disclaimers = findSection(
      result.sections,
      /disclaimers?;?\s*no\s*warranties?/i,
    );
    const limitation = findSection(result.sections, /limitation of liability/i);
    expect(Boolean(disclaimers) || Boolean(limitation)).toBe(true);
  });

  test("Reddit User Agreement contains Disclaimers/Liability and Governing Law", () => {
    const html = readHtml("reddit-terms.html");
    const result = summarizer.summarizeTos(html);

  expect(result.sections.length).toBeGreaterThanOrEqual(3);

    const discLiab = findSection(
      result.sections,
      /disclaimers?.*limitation of liability|limitation of liability/i,
    );
    expect(discLiab).toBeTruthy();

    const governing = findSection(
      result.sections,
      /governing\s+law|venue|jurisdiction/i,
    );
    expect(governing).toBeTruthy();
  });
});
