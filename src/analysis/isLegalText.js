/**
 * @file isLegalText.js
 * @description Advanced legal text analysis using pattern matching and term density
 * @version 2.0.0
 */

const { EXT_CONSTANTS } = require("../utils/constants");

(function (global) {
  "use strict";

  const { createTextExtractor } = require("./textExtractor");
  const { LEGAL_PATTERNS } = require("../data/legalPatterns");

  function createLegalTextAnalyzer({
    log,
    logLevels,
    legalTerms = [],
    utilities,
  }) {
    const { DETECTION, ANALYSIS } = EXT_CONSTANTS;

    const textExtractor = createTextExtractor({
      log,
      logLevels,
      utilities,
    });

    /**
     * Analyzes text to determine if it's legal content
     * @param {string} text Text to analyze
     * @returns {Object} Analysis results with detailed metrics
     */
    async function analyzeText(text) {
      try {
        // Extract and preprocess text
        const result = await textExtractor.extract(text, "text");
        const processedText = typeof result === 'string' ? result : result.text;

        if (!processedText || processedText.length < ANALYSIS.MIN_WORD_LENGTH) {
          return {
            isLegal: false,
            confidence: "low",
            reason: "insufficient_text",
            metrics: { termCount: 0, density: 0 },
          };
        }

        // Split into analyzable sections
        const sentences = textExtractor.splitIntoSentences(processedText);
        const words = textExtractor.splitIntoWords(processedText);

        // Calculate basic metrics
        const metrics = calculateTextMetrics(words, sentences);

        // Analyze patterns
        const patternMetrics = analyzePatterns(processedText);

        // Calculate final scores
        const { isLegal, confidence, score } = determineTextStatus(
          metrics,
          patternMetrics,
        );

        return {
          isLegal,
          confidence,
          score,
          metrics: {
            ...metrics,
            ...patternMetrics,
            totalWords: words.length,
            totalSentences: sentences.length,
          },
        };
      } catch (error) {
        log(logLevels.ERROR, "Error analyzing legal text:", error);
        return {
          isLegal: false,
          confidence: "low",
          reason: "analysis_error",
          error: error.message,
        };
      }
    }

    /**
     * Calculates basic text metrics
     * @param {string[]} words Array of words
     * @param {string[]} sentences Array of sentences
     * @returns {Object} Text metrics
     */
    function calculateTextMetrics(words, sentences) {
      const legalTermCounts = new Map();
      let totalTerms = 0;
      let proximityBonus = 0;
      let lastTermIndex = -1;

      words.forEach((word, index) => {
        const normalizedWord = word.toLowerCase();
        if (legalTerms.includes(normalizedWord)) {
          totalTerms++;
          legalTermCounts.set(
            normalizedWord,
            (legalTermCounts.get(normalizedWord) || 0) + 1,
          );

          // Calculate proximity bonus using constants
          if (
            lastTermIndex !== -1 &&
            index - lastTermIndex <= DETECTION.THRESHOLDS.PROXIMITY
          ) {
            proximityBonus +=
              1 - (index - lastTermIndex) / DETECTION.THRESHOLDS.PROXIMITY;
          }
          lastTermIndex = index;
        }
      });

      const density = words.length > 0 ? totalTerms / words.length : 0;
      const avgSentenceLength = words.length / sentences.length;

      return {
        termCount: totalTerms,
        uniqueTerms: legalTermCounts.size,
        density,
        proximityScore: proximityBonus / Math.max(1, totalTerms),
        avgSentenceLength,
        termDistribution: Object.fromEntries(legalTermCounts),
      };
    }

    /**
     * Analyzes legal patterns in text
     * @param {string} text Text to analyze
     * @returns {Object} Pattern analysis results
     */
    function analyzePatterns(text) {
      const patterns = {
        hasNumberedSections: LEGAL_PATTERNS.SECTION_NUMBERING.test(text),
        hasDefinitions: LEGAL_PATTERNS.DEFINITIONS.test(text),
        hasLegalHeaders: LEGAL_PATTERNS.LEGAL_HEADERS.test(text),
        hasCitations: LEGAL_PATTERNS.CITATIONS.test(text),
        hasLists: LEGAL_PATTERNS.LISTS.test(text),
      };

      const patternScore = Object.values(patterns).reduce(
        (score, hasPattern) => score + (hasPattern ? 0.2 : 0),
        0,
      );

      return {
        patterns,
        patternScore,
      };
    }

    /**
     * Determines if text is legal content
     * @param {Object} metrics Text metrics
     * @param {Object} patternMetrics Pattern metrics
     * @returns {Object} Legal text determination
     */
    function determineTextStatus(metrics, patternMetrics) {
      const { density, proximityScore, termCount } = metrics;
      const { patternScore } = patternMetrics;

      // Calculate weighted score
      const score = density * 0.4 + proximityScore * 0.3 + patternScore * 0.3;

      // Determine if text is legal based on term thresholds from constants
      const isLegal = termCount >= DETECTION.THRESHOLDS.SECTION && score >= 0.5;

      // Determine confidence level based on term count thresholds
      let confidence = "low";
      if (termCount >= DETECTION.THRESHOLDS.AUTO_GRADE) {
        confidence = "high";
      } else if (termCount >= DETECTION.THRESHOLDS.NOTIFY) {
        confidence = "medium";
      }

      return { isLegal, confidence, score };
    }

    return {
      analyzeText,
      // Backwards compatibility
      isLegalText: (text) => analyzeText(text).then((result) => result.isLegal),
      getLegalTermDensity: (text) => {
        const words = textExtractor.splitIntoWords(text);
        return words.length > 0
          ? words.filter((word) => legalTerms.includes(word)).length /
              words.length
          : 0;
      },
      // Exposed for testing
      _test: {
        calculateTextMetrics,
        analyzePatterns,
        determineTextStatus,
      },
    };
  }

  // Make it available globally
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createLegalTextAnalyzer };
  } else {
    global.LegalTextAnalyzer = { create: createLegalTextAnalyzer };
  }
})(typeof window !== "undefined" ? window : global);
