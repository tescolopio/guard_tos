/*
  Run analysis pipeline on a local HTML fixture (for smoke/debug).
  Usage: node scripts/run_analysis_fixture.js [pathToHtml]
*/
const fs = require("fs");
const path = require("path");

// Local imports mirroring content script wiring
const { EXT_CONSTANTS } = require("../src/utils/constants");
const { createRightsAssessor } = require("../src/analysis/rightsAssessor");
const {
  createReadabilityGrader,
} = require("../src/analysis/readabilityGrader");
const { createLegalTextAnalyzer } = require("../src/analysis/isLegalText");
const { createSummarizer } = require("../src/analysis/summarizeTos");
const {
  createEnhancedSummarizer,
} = require("../src/analysis/enhancedSummarizer");
const { createTextExtractor } = require("../src/analysis/textExtractor");
const {
  createUncommonWordsIdentifier,
} = require("../src/analysis/uncommonWordsIdentifier");
const { legalTermsDefinitions } = require("../src/data/legalTermsDefinitions");
const { commonWords } = require("../src/data/commonWords");
const { createUserRightsIndex } = require("../src/analysis/userRightsIndex");

const cheerio = require("cheerio");
const nlp = require("compromise");

const log = (...args) => {}; // quiet
const logLevels = EXT_CONSTANTS.DEBUG.LEVELS;

async function run(filePath) {
  const abs = path.resolve(filePath);
  const html = fs.readFileSync(abs, "utf8");

  // Initialize modules
  const extractor = createTextExtractor({
    log,
    logLevels,
    utilities: {},
    legalTerms: [],
  });
  const enhancedSummarizer = createEnhancedSummarizer({
    compromise: nlp,
    cheerio,
    log,
    logLevels,
  });
  const summarizer = createSummarizer({
    compromise: nlp,
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
  const identifier = createUncommonWordsIdentifier({
    log,
    logLevels,
    commonWords,
    legalTermsDefinitions,
  });
  const uri = createUserRightsIndex({ log, logLevels });

  // Extract text from HTML
  const extracted = await extractor.extract(html, "html");
  const text =
    extracted && extracted.text
      ? extracted.text
      : html.replace(/<[^>]*>/g, " ");

  // Run analyzers
  const rightsDetails = await assessor.analyzeContent(text);
  const readabilityResult = await readability.calculateReadabilityGrade(text);
  const enhanced = await enhancedSummarizer.summarizeTos(html);
  const legacy = await summarizer.summarizeTos(html);
  const uncommon = await identifier.identifyUncommonWords(text);

  // Compute URI combining readability and rights signals (sections from enhanced)
  const uriResult = uri.compute({
    readability: readabilityResult,
    rightsDetails,
    sections: enhanced.sections,
  });

  // Key excerpts: reuse content logic — fallback simple sentence pick
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
    file: abs,
    metadata: {
      words: (text.match(/\b\w+\b/g) || []).length,
      sentences: sentences.length,
      extractedSource:
        extracted && extracted.metadata ? extracted.metadata.source : "parsed",
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
      clauseCounts: rightsDetails.details && rightsDetails.details.clauseCounts,
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
      summary: s.summary && s.summary.slice(0, 300),
      categoryHints: s.categoryHints,
    })),
    excerpts: excerpts.slice(0, 8),
    uncommonTerms: uncommon.slice(0, 20),
  };

  // Print concise JSON output
  console.log(JSON.stringify(report, null, 2));
}

const input =
  process.argv[2] ||
  path.resolve(__dirname, "../__tests__/fixtures/simple-tos.html");
run(input).catch((err) => {
  console.error("Analysis run failed:", err);
  process.exit(1);
});
