/**
 * @file test_actual_readability.js
 * @description Test the actual readability grader with complex-tos.html to get proper results
 */

const fs = require("fs");
const path = require("path");

// Import the actual readability grader
const { createReadabilityGrader } = require("./src/analysis/readabilityGrader");

// Import actual constants
const { EXT_CONSTANTS } = require("./src/utils/constants");

global.EXT_CONSTANTS = EXT_CONSTANTS;

const log = console.log;
const logLevels = {
  INFO: "info",
  ERROR: "error",
  WARN: "warn",
  DEBUG: "debug",
};

async function testActualReadability() {
  try {
    // Load the complex-tos.html content
    const htmlPath = path.join(
      __dirname,
      "__tests__",
      "fixtures",
      "complex-tos.html",
    );
    const htmlContent = fs.readFileSync(htmlPath, "utf8");

    // Extract clean text (same as textExtractor does)
    const cleanText = htmlContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    console.log("🎓 TESTING ACTUAL READABILITY GRADER");
    console.log("====================================");
    console.log(`📄 Text length: ${cleanText.length} characters`);

    // Create readability grader
    const readabilityGrader = createReadabilityGrader({ log, logLevels });

    // Run actual analysis
    console.log("🔄 Running readability analysis...");
    const readabilityResult =
      readabilityGrader.calculateReadabilityGrade(cleanText);

    console.log("\n📊 ACTUAL READABILITY RESULTS:");
    console.log("===============================");
    console.log(JSON.stringify(readabilityResult, null, 2));

    console.log("\n📋 FIELD MAPPING:");
    console.log("==================");
    console.log(
      "Properties returned by readabilityGrader.calculateReadabilityGrade():",
    );
    Object.keys(readabilityResult).forEach((key) => {
      const value = readabilityResult[key];
      const type = typeof value;
      console.log(`├─ ${key}: ${value} (${type})`);
    });

    console.log("\n🔍 COMPARISON WITH EXPECTED STRUCTURE:");
    console.log("======================================");

    const expectedFields = [
      "sentences",
      "words",
      "avgWordsPerSentence",
      "grade",
      "readingLevel",
      "difficulty",
    ];

    expectedFields.forEach((field) => {
      const actualFields = Object.keys(readabilityResult);
      const hasField = actualFields.includes(field);
      const alternativeField = getAlternativeField(field, actualFields);

      if (hasField) {
        console.log(`✅ ${field}: Found directly`);
      } else if (alternativeField) {
        console.log(
          `🔄 ${field}: Maps to '${alternativeField}' (${readabilityResult[alternativeField]})`,
        );
      } else {
        console.log(`❌ ${field}: Missing - needs to be calculated`);
      }
    });

    // Create corrected analysis with proper field mapping
    const correctedReadabilityAnalysis = {
      grade: readabilityResult.grade || readabilityResult.averageGrade,
      fleschKincaidScore: readabilityResult.kincaid,
      fleschReadingEase: readabilityResult.flesch,
      gunningFogIndex: readabilityResult.fogIndex,
      gradeLevel: readabilityResult.kincaid,
      readingLevel: determineReadingLevel(readabilityResult.kincaid),
      difficulty: determineDifficulty(readabilityResult.kincaid),
      sentences:
        readabilityResult.sentenceCount || readabilityResult.totalSentences,
      words: readabilityResult.wordCount || readabilityResult.totalWords,
      avgWordsPerSentence: readabilityResult.averageSentenceLength,
      avgSyllablesPerWord: readabilityResult.averageSyllablesPerWord,
      complexWordCount: readabilityResult.complexWordCount,
      syllableCount: readabilityResult.syllableCount,
      normalizedScore: readabilityResult.normalizedScore,
      confidence: readabilityResult.confidence,
    };

    console.log("\n🎯 CORRECTED READABILITY ANALYSIS:");
    console.log("===================================");
    console.log(JSON.stringify(correctedReadabilityAnalysis, null, 2));

    // Save corrected analysis
    const correctedFile = path.join(
      ".cache",
      "actual-readability-results.json",
    );
    fs.writeFileSync(
      correctedFile,
      JSON.stringify(
        {
          original: readabilityResult,
          corrected: correctedReadabilityAnalysis,
          textStats: {
            length: cleanText.length,
            extractedFromHTML: htmlContent.length,
          },
        },
        null,
        2,
      ),
    );

    console.log(`\n💾 Results saved to: ${correctedFile}`);
  } catch (error) {
    console.error("❌ Error:", error);
    console.error(error.stack);
  }
}

function getAlternativeField(field, actualFields) {
  const mapping = {
    sentences: ["sentenceCount", "totalSentences"],
    words: ["wordCount", "totalWords"],
    avgWordsPerSentence: ["averageSentenceLength"],
    grade: ["averageGrade"],
  };

  const alternatives = mapping[field] || [];
  return alternatives.find((alt) => actualFields.includes(alt));
}

function determineReadingLevel(gradeLevel) {
  if (gradeLevel >= 16) return "Graduate/Professional";
  if (gradeLevel >= 13) return "College";
  if (gradeLevel >= 9) return "High School";
  if (gradeLevel >= 6) return "Middle School";
  return "Elementary";
}

function determineDifficulty(gradeLevel) {
  if (gradeLevel >= 16) return "Very Difficult";
  if (gradeLevel >= 13) return "Difficult";
  if (gradeLevel >= 9) return "Moderately Difficult";
  if (gradeLevel >= 6) return "Fairly Easy";
  return "Very Easy";
}

testActualReadability();
