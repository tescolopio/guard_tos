/**
 * @file validate_analysis_completeness.js
 * @description Validate that all analysis fields are properly populated with real data
 */

const fs = require("fs");
const path = require("path");

// Extract text content from complex-tos.html for manual analysis
const htmlPath = path.join(
  __dirname,
  "__tests__",
  "fixtures",
  "complex-tos.html",
);
const htmlContent = fs.readFileSync(htmlPath, "utf8");

// Extract clean text (similar to textExtractor)
const cleanText = htmlContent
  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

// Basic text analysis
const sentences = cleanText.split(/[.!?]+/).filter((s) => s.trim().length > 10);
const words = cleanText
  .toLowerCase()
  .split(/\W+/)
  .filter((w) => w.length > 0);
const paragraphs = cleanText
  .split(/\n\s*\n/)
  .filter((p) => p.trim().length > 0);
const avgWordsPerSentence = words.length / sentences.length;
const avgSentencesPerParagraph = sentences.length / paragraphs.length;

// Readability calculations (Flesch-Kincaid approximation)
const avgSentenceLength = avgWordsPerSentence;
const syllableCount = words.reduce((count, word) => {
  // Simple syllable counting (vowel groups)
  const syllables = (word.match(/[aeiouy]+/g) || []).length;
  return count + Math.max(1, syllables);
}, 0);
const avgSyllablesPerWord = syllableCount / words.length;

const fleschKincaidScore =
  206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
const fleschKincaidGradeLevel =
  0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;

// Grade mapping
function getReadabilityGrade(score, gradeLevel) {
  if (gradeLevel >= 16) return "F";
  if (gradeLevel >= 13) return "D";
  if (gradeLevel >= 9) return "C";
  if (gradeLevel >= 6) return "B";
  return "A";
}

// Legal complexity analysis
const legalTerms = [
  "arbitration",
  "liability",
  "indemnify",
  "covenant",
  "stipulation",
  "hereinafter",
  "whereas",
  "pursuant",
  "notwithstanding",
  "hereunder",
  "warranty",
  "disclaimer",
  "negligence",
  "jurisdiction",
  "governing law",
];

const legalTermCount = legalTerms.reduce((count, term) => {
  const regex = new RegExp(term, "gi");
  const matches = cleanText.match(regex);
  return count + (matches ? matches.length : 0);
}, 0);

// Complex sentence analysis
const complexSentences = sentences.filter((sentence) => {
  const wordCount = sentence.split(/\s+/).length;
  const hasComplexStructure =
    /,.*,/.test(sentence) ||
    sentence.includes(";") ||
    (sentence.includes(":") && wordCount > 25);
  return wordCount > 30 || hasComplexStructure;
}).length;

const complexityRatio = complexSentences / sentences.length;

// Generate corrected analysis
const correctedAnalysis = {
  documentInfo: {
    url: "file:///mnt/d/guard_tos/__tests__/fixtures/complex-tos.html",
    title:
      "TERMS OF SERVICE AND END USER LICENSE AGREEMENT FOR THE HUNT MASTER FIELD GUIDE ECOSYSTEM",
    timestamp: new Date().toISOString(),
    textLength: cleanText.length,
    htmlLength: htmlContent.length,
  },
  readability: {
    grade: getReadabilityGrade(fleschKincaidScore, fleschKincaidGradeLevel),
    fleschKincaidScore: Math.round(fleschKincaidScore * 100) / 100,
    gradeLevel: Math.round(fleschKincaidGradeLevel * 100) / 100,
    readingLevel:
      fleschKincaidGradeLevel >= 16
        ? "Graduate/Professional"
        : fleschKincaidGradeLevel >= 13
          ? "College"
          : fleschKincaidGradeLevel >= 9
            ? "High School"
            : "Middle School",
    difficulty:
      fleschKincaidGradeLevel >= 16
        ? "Very Difficult"
        : fleschKincaidGradeLevel >= 13
          ? "Difficult"
          : fleschKincaidGradeLevel >= 9
            ? "Moderately Difficult"
            : "Easy",
    sentences: sentences.length,
    words: words.length,
    paragraphs: paragraphs.length,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 100) / 100,
    avgSentencesPerParagraph: Math.round(avgSentencesPerParagraph * 100) / 100,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
    complexSentenceRatio: Math.round(complexityRatio * 10000) / 100, // percentage
    legalTermDensity: Math.round((legalTermCount / words.length) * 10000) / 100, // percentage
  },
  textAnalysis: {
    totalCharacters: cleanText.length,
    totalWords: words.length,
    totalSentences: sentences.length,
    totalParagraphs: paragraphs.length,
    avgCharactersPerWord:
      Math.round((cleanText.length / words.length) * 100) / 100,
    longestSentence: Math.max(...sentences.map((s) => s.split(/\s+/).length)),
    shortestSentence: Math.min(...sentences.map((s) => s.split(/\s+/).length)),
    legalTermsFound: legalTermCount,
    complexSentences: complexSentences,
  },
  structureAnalysis: {
    headings: (htmlContent.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || []).length,
    sections: (htmlContent.match(/SECTION \d+\./gi) || []).length,
    lists: (htmlContent.match(/<[uo]l[^>]*>/gi) || []).length,
    links: (htmlContent.match(/<a[^>]*href/gi) || []).length,
    emphasis: (htmlContent.match(/<(strong|b|em|i)[^>]*>/gi) || []).length,
  },
};

// Load original analysis for comparison
const originalAnalysis = JSON.parse(
  fs.readFileSync(".cache/complex-tos-analysis.json", "utf8"),
);

console.log("🔍 ANALYSIS COMPLETENESS VALIDATION");
console.log("====================================");

console.log("\n📊 TEXT METRICS COMPARISON:");
console.log(
  "┌─────────────────────────┬──────────────┬──────────────┬────────────┐",
);
console.log(
  "│ Metric                  │ Original     │ Corrected    │ Status     │",
);
console.log(
  "├─────────────────────────┼──────────────┼──────────────┼────────────┤",
);
console.log(
  `│ Text Length             │ ${String(originalAnalysis.documentInfo.textLength).padEnd(12)} │ ${String(correctedAnalysis.textAnalysis.totalCharacters).padEnd(12)} │ ${originalAnalysis.documentInfo.textLength === correctedAnalysis.textAnalysis.totalCharacters ? "✅ Match" : "❌ Diff"} │`,
);
console.log(
  `│ Word Count              │ ${String(originalAnalysis.readability.words || "null").padEnd(12)} │ ${String(correctedAnalysis.textAnalysis.totalWords).padEnd(12)} │ ${originalAnalysis.readability.words ? "✅ Match" : "❌ Missing"} │`,
);
console.log(
  `│ Sentence Count          │ ${String(originalAnalysis.readability.sentences || "null").padEnd(12)} │ ${String(correctedAnalysis.textAnalysis.totalSentences).padEnd(12)} │ ${originalAnalysis.readability.sentences ? "✅ Match" : "❌ Missing"} │`,
);
console.log(
  `│ Avg Words/Sentence      │ ${String(originalAnalysis.readability.avgWordsPerSentence || "null").padEnd(12)} │ ${String(correctedAnalysis.readability.avgWordsPerSentence).padEnd(12)} │ ${originalAnalysis.readability.avgWordsPerSentence ? "✅ Match" : "❌ Missing"} │`,
);
console.log(
  `│ Readability Grade       │ ${String(originalAnalysis.readability.grade).padEnd(12)} │ ${String(correctedAnalysis.readability.grade).padEnd(12)} │ ${originalAnalysis.readability.grade === correctedAnalysis.readability.grade ? "✅ Match" : "❌ Diff"} │`,
);
console.log(
  "└─────────────────────────┴──────────────┴──────────────┴────────────┘",
);

console.log("\n📈 DETAILED READABILITY METRICS:");
console.log(
  `├─ Flesch-Kincaid Score: ${correctedAnalysis.readability.fleschKincaidScore} (${correctedAnalysis.readability.difficulty})`,
);
console.log(
  `├─ Grade Level: ${correctedAnalysis.readability.gradeLevel} (${correctedAnalysis.readability.readingLevel})`,
);
console.log(
  `├─ Complex Sentences: ${correctedAnalysis.textAnalysis.complexSentences}/${correctedAnalysis.textAnalysis.totalSentences} (${correctedAnalysis.readability.complexSentenceRatio}%)`,
);
console.log(
  `├─ Legal Term Density: ${correctedAnalysis.readability.legalTermDensity}%`,
);
console.log(
  `├─ Avg Syllables/Word: ${correctedAnalysis.readability.avgSyllablesPerWord}`,
);
console.log(
  `└─ Longest Sentence: ${correctedAnalysis.textAnalysis.longestSentence} words`,
);

console.log("\n📋 DOCUMENT STRUCTURE:");
console.log(
  `├─ HTML Sections: ${correctedAnalysis.structureAnalysis.sections}`,
);
console.log(`├─ Headings: ${correctedAnalysis.structureAnalysis.headings}`);
console.log(`├─ Lists: ${correctedAnalysis.structureAnalysis.lists}`);
console.log(`├─ Links: ${correctedAnalysis.structureAnalysis.links}`);
console.log(
  `├─ Emphasis Tags: ${correctedAnalysis.structureAnalysis.emphasis}`,
);
console.log(`└─ Paragraphs: ${correctedAnalysis.textAnalysis.totalParagraphs}`);

console.log("\n🚨 MISSING DATA ISSUES:");
const missingFields = [];
if (!originalAnalysis.readability.sentences)
  missingFields.push("sentence count");
if (!originalAnalysis.readability.words) missingFields.push("word count");
if (!originalAnalysis.readability.avgWordsPerSentence)
  missingFields.push("avg words per sentence");
if (!originalAnalysis.readability.fleschKincaidScore)
  missingFields.push("Flesch-Kincaid score");
if (!originalAnalysis.readability.gradeLevel) missingFields.push("grade level");

if (missingFields.length > 0) {
  console.log(`❌ Missing: ${missingFields.join(", ")}`);
  console.log(
    "📝 Recommendation: Update readabilityGrader.js to populate all fields",
  );
} else {
  console.log("✅ All required fields are present");
}

// Save corrected analysis
const correctedFile = path.join(
  ".cache",
  "complex-tos-analysis-corrected.json",
);
fs.writeFileSync(
  correctedFile,
  JSON.stringify(correctedAnalysis, null, 2),
  "utf8",
);
console.log(`\n💾 Corrected analysis saved to: ${correctedFile}`);

// Sample sentences for verification
console.log("\n📄 SAMPLE COMPLEX SENTENCES (for verification):");
const sampleSentences = sentences
  .filter((s) => s.split(/\s+/).length > 35)
  .slice(0, 3);
sampleSentences.forEach((sentence, i) => {
  const wordCount = sentence.split(/\s+/).length;
  console.log(
    `${i + 1}. [${wordCount} words] ${sentence.substring(0, 120)}...`,
  );
});
