/**
 * @jest-environment node
 */

/**
 * @file test_readability_completeness.test.js
 * @description Test readability analysis completeness with proper Jest environment
 */

const fs = require("fs");
const path = require("path");

const {
  createReadabilityGrader,
} = require("../../src/analysis/readabilityGrader");

const log = () => {}; // Silent logging
const logLevels = {
  INFO: "info",
  ERROR: "error",
  WARN: "warn",
  DEBUG: "debug",
};

describe("Readability Analysis Completeness", () => {
  let readabilityGrader;

  beforeAll(() => {
    readabilityGrader = createReadabilityGrader({ log, logLevels });
  });

  test("should return complete readability analysis for complex-tos.html", async () => {
    // Load the complex-tos.html content
    const htmlPath = path.join(
      process.cwd(),
      "__tests__",
      "fixtures",
      "complex-tos.html",
    );
    const htmlContent = fs.readFileSync(htmlPath, "utf8");

    // Extract clean text
    const cleanText = htmlContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    console.log(`📄 Analyzing ${cleanText.length} characters of text...`);

    // Run readability analysis
    const result = readabilityGrader.calculateReadabilityGrade(cleanText);

    console.log("\n🎓 READABILITY ANALYSIS RESULTS:");
    console.log("================================");
    console.log("Raw result object:", JSON.stringify(result, null, 2));

    // Check that basic analysis completed
    expect(result).toBeDefined();
    expect(result.error).toBeUndefined();

    // Verify numeric scores
    expect(typeof result.flesch).toBe("number");
    expect(typeof result.kincaid).toBe("number");
    expect(typeof result.fogIndex).toBe("number");

    // Verify text statistics
    expect(result.wordCount).toBeDefined();
    expect(result.sentenceCount).toBeDefined();
    expect(result.averageSentenceLength).toBeDefined();

    console.log("\n📊 FIELD VERIFICATION:");
    console.log("=======================");
    console.log(`├─ Flesch Reading Ease: ${result.flesch}`);
    console.log(`├─ Flesch-Kincaid Grade: ${result.kincaid}`);
    console.log(`├─ Gunning Fog Index: ${result.fogIndex}`);
    console.log(`├─ Grade: ${result.grade || result.averageGrade}`);
    console.log(`├─ Word Count: ${result.wordCount || result.totalWords}`);
    console.log(
      `├─ Sentence Count: ${result.sentenceCount || result.totalSentences}`,
    );
    console.log(`├─ Avg Words/Sentence: ${result.averageSentenceLength}`);
    console.log(`├─ Avg Syllables/Word: ${result.averageSyllablesPerWord}`);
    console.log(`└─ Complex Words: ${result.complexWordCount}`);

    // Create standardized analysis object
    const standardizedAnalysis = {
      grade: result.grade || result.averageGrade,
      fleschReadingEase: result.flesch,
      fleschKincaidGrade: result.kincaid,
      gunningFogIndex: result.fogIndex,
      readingLevel: determineReadingLevel(result.kincaid),
      difficulty: determineDifficulty(result.kincaid),
      sentences: result.sentenceCount || result.totalSentences,
      words: result.wordCount || result.totalWords,
      avgWordsPerSentence: result.averageSentenceLength,
      avgSyllablesPerWord: result.averageSyllablesPerWord,
      complexWordCount: result.complexWordCount,
      syllableCount: result.syllableCount,
      normalizedScore: result.normalizedScore,
      confidence: result.confidence,
    };

    console.log("\n✅ STANDARDIZED READABILITY ANALYSIS:");
    console.log("=====================================");
    console.log(JSON.stringify(standardizedAnalysis, null, 2));

    // Save results
    const resultsFile = path.join(
      process.cwd(),
      ".cache",
      "readability-test-results.json",
    );
    fs.writeFileSync(
      resultsFile,
      JSON.stringify(
        {
          rawResult: result,
          standardized: standardizedAnalysis,
          textStats: {
            originalLength: htmlContent.length,
            cleanLength: cleanText.length,
          },
        },
        null,
        2,
      ),
    );

    console.log(`\n💾 Results saved to: ${resultsFile}`);

    // Basic assertions
    expect(result.wordCount || result.totalWords).toBeGreaterThan(1000);
    expect(result.sentenceCount || result.totalSentences).toBeGreaterThan(10);
    expect(result.kincaid).toBeGreaterThan(10); // Should be graduate level
  });
});

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
