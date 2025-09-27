const fs = require("fs");
const path = require("path");

const cheerio = require("cheerio");
const compromise = require("compromise");

const { EXT_CONSTANTS } = require("../../src/utils/constants");
const { createRightsAssessor } = require("../../src/analysis/rightsAssessor");
const {
  createReadabilityGrader,
} = require("../../src/analysis/readabilityGrader");
const { createSummarizer } = require("../../src/analysis/summarizeTos");
const {
  createEnhancedSummarizer,
} = require("../../src/analysis/enhancedSummarizer");
const { createTextExtractor } = require("../../src/analysis/textExtractor");
const {
  createUncommonWordsIdentifier,
} = require("../../src/analysis/uncommonWordsIdentifier");
const { createUserRightsIndex } = require("../../src/analysis/userRightsIndex");
const {
  legalTermsDefinitions,
} = require("../../src/data/legalTermsDefinitions");
const { commonWords } = require("../../src/data/commonWords");

describe("Run analysis on simple-tos.html fixture", () => {
  test("analysis report snapshot", async () => {
    const log = () => {};
    const logLevels = EXT_CONSTANTS.DEBUG.LEVELS;

    const fixturePath = path.resolve(__dirname, "../fixtures/simple-tos.html");
    const html = fs.readFileSync(fixturePath, "utf8");

    const utilitiesShim = {
      createUtilities: () => ({
        splitIntoWords: (t) =>
          String(t || "")
            .toLowerCase()
            .match(/\b[a-z][a-z0-9-]*\b/g) || [],
      }),
    };
    const extractor = createTextExtractor({
      log,
      logLevels,
      utilities: utilitiesShim,
      legalTerms: [],
    });
    const enhancedSummarizer = createEnhancedSummarizer({
      compromise,
      cheerio,
      log,
      logLevels,
    });
    const summarizer = createSummarizer({
      compromise,
      cheerio,
      log,
      logLevels,
    });
    const assessor = createRightsAssessor({
      log,
      logLevels,
      commonWords,
      legalTermsDefinitions,
    });
    const readability = createReadabilityGrader({ log, logLevels });
    const identifier = await createUncommonWordsIdentifier({
      log,
      logLevels,
      commonWords,
      legalTermsDefinitions,
      utilities: utilitiesShim,
    });
    const uri = createUserRightsIndex({ log, logLevels });

    const extracted = await extractor.extract(html, "html");
    const text =
      extracted && extracted.text
        ? extracted.text
        : html.replace(/<[^>]*>/g, " ");

    const rightsDetails = await assessor.analyzeContent(text);
    const readabilityResult = await readability.calculateReadabilityGrade(text);
    const enhanced = await enhancedSummarizer.summarizeTos(html);
    const legacy = await summarizer.summarizeTos(html);
    const uncommon = await identifier.identifyUncommonWords(text);
    const uriResult = uri.compute({
      readability: readabilityResult,
      rightsDetails,
      sections: enhanced.sections,
    });

    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);
    const keywords = [
      /arbitration/i,
      /class action/i,
      /liability/i,
      /refund/i,
      /termination/i,
      /privacy/i,
      /jurisdiction/i,
    ];
    const excerpts = [];
    for (const s of sentences) {
      if (keywords.some((k) => k.test(s))) excerpts.push(s);
      if (excerpts.length >= 8) break;
    }

    const report = {
      file: fixturePath,
      metadata: {
        words: (text.match(/\b\w+\b/g) || []).length,
        sentences: sentences.length,
        extractedSource:
          extracted && extracted.metadata
            ? extracted.metadata.source
            : "parsed",
      },
      overall: enhanced.overall || legacy.overall,
      riskLevel: enhanced.overallRisk || null,
      keyFindings: enhanced.keyFindings || [],
      plainLanguageAlert: enhanced.plainLanguageAlert || null,
      readability: {
        grade: readabilityResult.grade,
        normalizedScore: readabilityResult.normalizedScore,
        flesch: readabilityResult.flesch,
        kincaid: readabilityResult.kincaid,
        fogIndex: readabilityResult.fogIndex,
      },
      rights: {
        grade: rightsDetails.grade,
        score: rightsDetails.rightsScore,
        confidence: rightsDetails.confidence,
        categoryScores:
          rightsDetails.details && rightsDetails.details.categoryScores,
        clauseCounts:
          rightsDetails.details && rightsDetails.details.clauseCounts,
      },
      userRightsIndex: {
        grade: uriResult.grade,
        weightedScore: uriResult.weightedScore,
        categories: uriResult.categories,
      },
      sections: (enhanced.sections || []).map((s) => ({
        heading: s.heading,
        type: s.type,
        riskLevel: s.riskLevel,
        summary: s.summary && s.summary.slice(0, 200),
        categoryHints: s.categoryHints,
      })),
      excerpts: excerpts.slice(0, 8),
      uncommonTerms: uncommon.slice(0, 10),
    };

    // Print to console so user can inspect in CI/output
    // eslint-disable-next-line no-console
    console.log(
      "Simple ToS analysis report:\n",
      JSON.stringify(report, null, 2),
    );

    // Basic assertions to ensure non-empty processing
    expect(readabilityResult.grade).toBeDefined();
    expect(uriResult && uriResult.grade).toBeDefined();
  });
});
