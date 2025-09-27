/**
 * @file analyze_complex_tos.js
 * @description Run full analysis pipeline on complex-tos.html and display results
 */

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const compromise = require("compromise");

// Import analysis modules
const { createTextExtractor } = require("./src/analysis/textExtractor");
const { createReadabilityGrader } = require("./src/analysis/readabilityGrader");
const { createRightsAssessor } = require("./src/analysis/rightsAssessor");
const { createSummarizer } = require("./src/analysis/summarizeTos");
const {
  createEnhancedSummarizer,
} = require("./src/analysis/enhancedSummarizer");
const {
  createUncommonWordsIdentifier,
} = require("./src/analysis/uncommonWordsIdentifier");

// Load test data
const { commonWords } = require("./src/data/commonWords");
const { legalTermsDefinitions } = require("./src/data/legalTermsDefinitions");

const log = console.log;
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

async function analyzeComplexTos() {
  try {
    console.log("🔍 Loading complex-tos.html...");

    // Load the HTML file
    const htmlPath = path.join(
      __dirname,
      "__tests__",
      "fixtures",
      "complex-tos.html",
    );
    const html = fs.readFileSync(htmlPath, "utf8");

    // Setup global functions required by textExtractor
    global.extractFromPDF = async () => ({ text: "", metadata: {} });
    global.extractFromDOCX = async () => ({ text: "", metadata: {} });
    global.extractFromText = (txt) => ({ text: txt, metadata: {} });
    global.splitIntoSentences = (txt) =>
      txt ? txt.split(/[.!?]+/).filter(Boolean) : [];

    // Initialize analyzers
    console.log("⚙️  Initializing analysis modules...");

    const textExtractor = createTextExtractor({
      log,
      logLevels,
      utilities,
      config: { highlightThreshold: 20, sectionThreshold: 10 },
    });

    const readabilityGrader = createReadabilityGrader({ log, logLevels });

    const rightsAssessor = createRightsAssessor({
      log,
      logLevels,
      commonWords,
      legalTermsDefinitions,
    });

    const summarizer = createSummarizer({
      compromise,
      cheerio,
      log,
      logLevels,
    });

    const enhancedSummarizer = createEnhancedSummarizer({
      compromise,
      cheerio,
      log,
      logLevels,
    });

    const uncommonWordsIdentifier = createUncommonWordsIdentifier({
      log,
      logLevels,
      commonWords,
      legalTermsDefinitions,
      config: { minWordLength: 3, maxDefinitionRetries: 3 },
    });

    // Step 1: Extract text
    console.log("📄 Extracting text content...");
    const extraction = await textExtractor.extract(html, "html");
    const text =
      extraction.text ||
      html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    console.log(`📊 Extracted ${text.length} characters of text`);

    // Step 2: Readability Analysis
    console.log("🎓 Analyzing readability...");
    const readability = readabilityGrader.calculateReadabilityGrade(text);

    // Step 3: Rights Assessment
    console.log("⚖️  Assessing user rights...");
    const rights = await rightsAssessor.analyzeContent(text);

    // Step 4: Summarization
    console.log("📝 Generating summaries...");
    const summary = await summarizer.summarizeTos(html);
    const enhancedSummary = await enhancedSummarizer.summarizeTos(html);

    // Step 5: Uncommon Words Analysis
    console.log("🔤 Identifying uncommon words...");
    const uncommonWords =
      await uncommonWordsIdentifier.identifyUncommonWords(text);

    // Display Results
    console.log("\n" + "=".repeat(80));
    console.log("📋 ANALYSIS RESULTS FOR COMPLEX-TOS.HTML");
    console.log("=".repeat(80));

    console.log("\n🎯 READABILITY ANALYSIS:");
    console.log("├─ Grade:", readability.averageGrade || readability.grade);
    console.log("├─ Reading Level:", readability.readingLevel || "N/A");
    console.log("└─ Difficulty:", readability.difficulty || "N/A");

    console.log("\n⚖️  USER RIGHTS ASSESSMENT:");
    console.log("├─ Rights Score:", rights.rightsScore);
    console.log("├─ Grade:", rights.grade);
    console.log("├─ User Rights Index:", rights.userRightsIndex);
    console.log("└─ Risk Level:", rights.riskLevel || "N/A");

    if (rights.details && rights.details.categoryScores) {
      console.log("\n📊 CATEGORY BREAKDOWN:");
      Object.entries(rights.details.categoryScores).forEach(
        ([category, data]) => {
          console.log(
            `├─ ${category}: ${data.score}/100 (${data.grade || "N/A"})`,
          );
        },
      );
    }

    if (rights.details && rights.details.clauseCounts) {
      console.log("\n🚨 HIGH-RISK CLAUSES DETECTED:");
      const highRisk = rights.details.clauseCounts.HIGH_RISK || {};
      Object.entries(highRisk).forEach(([clause, count]) => {
        if (count > 0) {
          console.log(`├─ ${clause}: ${count} instances`);
        }
      });
    }

    console.log("\n📝 ENHANCED SUMMARY:");
    console.log("├─ Overall Risk:", enhancedSummary.overallRisk || "N/A");
    if (enhancedSummary.keyFindings && enhancedSummary.keyFindings.length > 0) {
      console.log("├─ Key Findings:");
      enhancedSummary.keyFindings.slice(0, 3).forEach((finding, i) => {
        console.log(`│  ${i + 1}. ${finding}`);
      });
    }

    if (enhancedSummary.sections && enhancedSummary.sections.length > 0) {
      console.log("└─ Section Count:", enhancedSummary.sections.length);
    }

    console.log("\n🔤 UNCOMMON WORDS (Top 10):");
    const topUncommon = uncommonWords.slice(0, 10);
    topUncommon.forEach((wordData, i) => {
      const word = typeof wordData === "string" ? wordData : wordData.word;
      console.log(`├─ ${i + 1}. ${word}`);
    });

    console.log("\n" + "=".repeat(80));
    console.log("✅ Analysis completed successfully!");
    console.log("=".repeat(80));
  } catch (error) {
    console.error("❌ Error during analysis:", error);
    console.error(error.stack);
  }
}

// Run the analysis
analyzeComplexTos();
