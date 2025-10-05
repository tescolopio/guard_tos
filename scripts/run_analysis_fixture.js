/*
  Run analysis pipeline on a local HTML fixture (for smoke/debug).
  Usage: node scripts/run_analysis_fixture.js [pathToHtml]
*/
const fs = require("fs");
const path = require("path");

const cheerio = require("cheerio");
const nlp = require("compromise");

// Local imports mirroring content script wiring
const { EXT_CONSTANTS } = require("../src/utils/constants");
const { createRightsAssessor } = require("../src/analysis/rightsAssessor");
const {
  createReadabilityGrader,
} = require("../src/analysis/readabilityGrader");
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

const log = () => {};
const logLevels = EXT_CONSTANTS.DEBUG.LEVELS;

function createPipeline() {
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
  let identifierPromise = null;

  function ensureIdentifier() {
    if (!identifierPromise) {
      identifierPromise = createUncommonWordsIdentifier({
        log,
        logLevels,
        commonWords,
        legalTermsDefinitions,
      });
    }
    return identifierPromise;
  }
  const uri = createUserRightsIndex({ log, logLevels });

  async function analyzeHtml(html, { source } = {}) {
    const extracted = await extractor.extract(html, "html");
    const text =
      extracted && extracted.text
        ? extracted.text
        : html.replace(/<[^>]*>/g, " ");

    const rightsDetails = await assessor.analyzeContent(text);
    const readabilityResult =
      await readability.calculateReadabilityGrade(text);
  const enhanced = await enhancedSummarizer.summarizeTos(html);
  const legacy = await summarizer.summarizeTos(html);
  const identifier = await ensureIdentifier();
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
      /indemn(ify|ity)/i,
      /dispute/i,
      /jurisdiction/i,
      /binding/i,
      /warranty/i,
    ];
    const keywordMatches = sentences.filter((sentence) =>
      keywords.some((regex) => regex.test(sentence)),
    );
    const excerpts = keywordMatches.length > 0 ? keywordMatches : sentences;

    const sections = (enhanced.sections || []).map((section) => ({
      heading: section.heading,
      type: section.type,
      riskLevel: section.riskLevel,
      summary:
        typeof section.summary === "string"
          ? section.summary.slice(0, 300)
          : undefined,
      categoryHints: section.categoryHints,
    }));

    const keyFindings = sections
      .filter((section) => section.summary)
      .slice(0, 5)
      .map((section) => ({
        title: section.heading,
        summary: section.summary,
        riskLevel: section.riskLevel,
        categoryHints: section.categoryHints,
      }));

    const riskLevels = sections
      .map((section) => section.riskLevel)
      .filter(Boolean);
    const riskLevel = riskLevels.includes("high")
      ? "high"
      : riskLevels.includes("medium")
        ? "medium"
        : riskLevels.includes("low")
          ? "low"
          : undefined;

    const words = text
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean).length;

    return {
      metadata: {
        source: source || null,
        words,
        sentences: sentences.length,
        analyzedAt: new Date().toISOString(),
      },
      readability: {
        grade: readabilityResult.grade,
        scores: {
          flesch: readabilityResult.flesch,
          kincaid: readabilityResult.kincaid,
          fogIndex: readabilityResult.fogIndex,
        },
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
      summaries: {
        enhanced: {
          overview: enhanced.overview || enhanced.summary,
          sections,
        },
        legacy,
      },
      riskLevel,
      keyFindings,
      excerpts: excerpts.slice(0, 8),
      uncommonTerms: uncommon.slice(0, 20),
    };
  }

  async function analyzeFile(filePath) {
    const abs = path.resolve(filePath);
    const html = fs.readFileSync(abs, "utf8");
    return analyzeHtml(html, { source: abs });
  }

  return { analyzeHtml, analyzeFile };
}

const pipeline = createPipeline();

async function run(filePath) {
  return pipeline.analyzeFile(filePath);
}

module.exports = {
  run,
  analyzeHtml: pipeline.analyzeHtml,
};

if (require.main === module) {
  const input =
    process.argv[2] ||
    path.resolve(__dirname, "../__tests__/fixtures/simple-tos.html");
  run(input)
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
    })
    .catch((err) => {
      console.error("Analysis run failed:", err);
      process.exit(1);
    });
}
