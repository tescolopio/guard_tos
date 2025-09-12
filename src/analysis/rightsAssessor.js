/**
 * @file rightsAssessor.js
 * @description Implements rights assessment logic with placeholder functionality for future TensorFlow.js integration
 * @version 1.0.0
 * @date 2024-10-05
 */

const { LEGAL_PATTERNS } = require("../data/legalPatterns");
const { EXT_CONSTANTS } = require("../utils/constants");

(function (global) {
  "use strict";

  // Constants for rights assessment
  const { POSITIVE, NEGATIVE, OBLIGATIONS } = LEGAL_PATTERNS.RIGHTS;
  const RUBRIC = EXT_CONSTANTS.ANALYSIS.RIGHTS;

  function createRightsAssessor({
    log,
    logLevels,
    commonWords = [],
    legalTermsDefinitions = {},
  }) {
    /**
     * Chunks text into smaller segments
     * @param {string} text Text to chunk
     * @param {number} chunkSize Size of each chunk
     * @returns {Array<string>} Array of text chunks
     */
    function chunkText(text, chunkSize = 500) {
      try {
        log(logLevels.DEBUG, "Chunking text", { chunkSize });
        const chunks = [];
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

        let currentChunk = "";
        for (const sentence of sentences) {
          if ((currentChunk + sentence).length > chunkSize) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk += " " + sentence;
          }
        }
        if (currentChunk) chunks.push(currentChunk.trim());

        log(logLevels.DEBUG, `Created ${chunks.length} chunks`);
        return chunks;
      } catch (error) {
        log(logLevels.ERROR, "Error chunking text", { error });
        return [text];
      }
    }

    /**
     * Temporary function to analyze rights patterns until TensorFlow model is integrated
     * @param {string} text Text to analyze
     * @returns {object} Analysis results
     */
    // Mega-regex with named capture groups to reduce repeated scanning
    let megaRegex;
    let groupMap; // groupName -> { category, key }
    function buildMegaRegex() {
      if (megaRegex) return megaRegex;
      const categories = LEGAL_PATTERNS.CLAUSES || {};
      groupMap = {};
      const parts = [];
      ["HIGH_RISK", "MEDIUM_RISK", "POSITIVES"].forEach((cat) => {
        const patterns = categories[cat] || {};
        Object.entries(patterns).forEach(([key, regex]) => {
          const groupName = `${cat}__${key}`;
          groupMap[groupName] = { category: cat, key };
          parts.push(`(?<${groupName}>${regex.source})`);
        });
      });
      megaRegex = new RegExp(parts.join("|"), "gi");
      return megaRegex;
    }

    function analyzeRightsPatterns(text) {
      const lower = text.toLowerCase();
      const wordCount = lower.split(/\s+/).filter(Boolean).length || 1;
      const perN = RUBRIC.NORMALIZATION_PER_WORDS || 1000;
      const clauseCounts = { HIGH_RISK: {}, MEDIUM_RISK: {}, POSITIVES: {} };
      const rx = buildMegaRegex();
      // Test with a simple pattern first
      const testRegex = /waive/gi;
      const testMatches = (lower.match(testRegex) || []).length;
      if (testMatches > 0) {
      }

      rx.lastIndex = 0;
      let m;
      let matchCount = 0;
      while ((m = rx.exec(lower)) !== null) {
        matchCount++;
        const groups = m.groups || {};
        for (const g in groups) {
          if (groups[g] !== undefined) {
            const meta = groupMap[g];
            if (!meta) continue;
            const { category, key } = meta;
            clauseCounts[category][key] =
              (clauseCounts[category][key] || 0) + 1;
          }
        }
        if (m[0].length === 0) rx.lastIndex++; // safety
      }
      // Ensure zero for any missing patterns
      Object.values(groupMap).forEach(({ category, key }) => {
        if (clauseCounts[category][key] === undefined)
          clauseCounts[category][key] = 0;
      });

      // Weighted sum
      const weights = RUBRIC.WEIGHTS;
      let neg = 0;
      let pos = 0;
      Object.entries(clauseCounts.HIGH_RISK).forEach(([k, c]) => {
        neg += c * (weights.HIGH_RISK[k] || 0);
      });
      Object.entries(clauseCounts.MEDIUM_RISK).forEach(([k, c]) => {
        neg += c * (weights.MEDIUM_RISK[k] || 0);
      });
      Object.entries(clauseCounts.POSITIVES).forEach(([k, c]) => {
        pos += c * (weights.POSITIVES[k] || 0);
      });

      // Normalize by document length
      const normFactor = wordCount / perN; // >1 for long docs
      const adjNeg = neg / Math.max(1, normFactor);
      const adjPos = pos / Math.max(1, normFactor);

      // Apply caps
      const cappedNeg = Math.max(weights.CAPS.MAX_NEGATIVE, adjNeg);
      const cappedPos = Math.min(weights.CAPS.MAX_POSITIVE, adjPos);

      // No signals → neutral baseline (avoid perfect 100 with zero evidence)
      if (neg === 0 && pos === 0) {
        return {
          wordCount,
          perN,
          clauseCounts,
          raw: { neg, pos },
          adjusted: { adjNeg, adjPos, cappedNeg: 0, cappedPos: 0 },
          score: 80,
        };
      }

      // Convert to 0-100 score with adjustments
      let score = 100 + cappedNeg + cappedPos; // neg is negative, pos is positive
      score = Math.max(0, Math.min(100, score));

      return {
        wordCount,
        perN,
        clauseCounts,
        raw: { neg, pos },
        adjusted: { adjNeg, adjPos, cappedNeg, cappedPos },
        score,
      };
    }

    /**
     * Identifies uncommon words in text
     * @param {string} text Text to analyze
     * @returns {Promise<Array>} Array of uncommon words with definitions
     */
    async function identifyUncommonWords(text) {
      try {
        log(logLevels.DEBUG, "Identifying uncommon words");
        if (!text || typeof text !== "string") {
          throw new Error("Invalid input text");
        }

        const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
        const uncommonWords = [];

        for (const word of words) {
          if (!commonWords.includes(word)) {
            const definition =
              legalTermsDefinitions[word] || (await fetchDefinition(word));
            if (definition) {
              uncommonWords.push({ word, definition });
            }
          }
        }

        log(logLevels.DEBUG, `Found ${uncommonWords.length} uncommon words`);
        return uncommonWords;
      } catch (error) {
        log(logLevels.ERROR, "Error identifying uncommon words", { error });
        return [];
      }
    }

    /**
     * Placeholder for future API integration
     * @param {string} word Word to define
     * @returns {Promise<string|null>} Definition or null
     */
    async function fetchDefinition(word) {
      try {
        const {
          createLegalDictionaryService,
        } = require("../utils/legalDictionaryService");
        const service = await createLegalDictionaryService({ log, logLevels });
        const res = await service.getDefinition(word);
        if (!res) return null;
        // normalize to a simple string for existing API here
        return typeof res === "string" ? res : res.definition || null;
      } catch (e) {
        log(logLevels.WARN, "Dictionary lookup failed", {
          word,
          error: e && e.message,
        });
        return null;
      }
    }

    /**
     * Main analysis function
     * @param {string} text Text to analyze
     * @returns {Promise<object>} Analysis results
     */
    async function analyzeContent(text) {
      try {
        log(logLevels.INFO, "Starting rights analysis");

        const chunks = chunkText(text);
        let totalScore = 0;
        let totalWords = 0;
        let totalSignals = 0;
        // aggregate clause counts across chunks for diagnostics & testing
        const aggregateClauseCounts = {
          HIGH_RISK: {},
          MEDIUM_RISK: {},
          POSITIVES: {},
        };

        // Analyze each chunk
        for (const chunk of chunks) {
          const res = analyzeRightsPatterns(chunk);
          totalScore += res.score;
          totalWords += res.wordCount;
          // rough signal count = sum of all clause counts
          totalSignals += Object.values(res.clauseCounts).reduce(
            (acc, m) => acc + Object.values(m).reduce((a, b) => a + b, 0),
            0,
          );
          // accumulate per-clause counts
          ["HIGH_RISK", "MEDIUM_RISK", "POSITIVES"].forEach((cat) => {
            const m = res.clauseCounts[cat] || {};
            Object.entries(m).forEach(([k, v]) => {
              aggregateClauseCounts[cat][k] =
                (aggregateClauseCounts[cat][k] || 0) + v;
            });
          });
          log(logLevels.DEBUG, "Chunk analysis", { score: res.score });
        }

        const averageScore = totalScore / Math.max(1, chunks.length);
        const uncommonWords = await identifyUncommonWords(text);

        // Grade mapping
        const g = EXT_CONSTANTS.ANALYSIS.RIGHTS.GRADING;
        const grade =
          averageScore >= g.A.MIN
            ? "A"
            : averageScore >= g.B.MIN
              ? "B"
              : averageScore >= g.C.MIN
                ? "C"
                : averageScore >= g.D.MIN
                  ? "D"
                  : "F";

        // Confidence estimation
        const cov = Math.min(
          1,
          chunks.length /
            Math.ceil(totalWords / (RUBRIC.NORMALIZATION_PER_WORDS || 1000)),
        );
        const sig = Math.min(1, totalSignals / 10); // heuristic: 10+ signals => strong
        const type = LEGAL_PATTERNS.LEGAL_HEADERS.test(text) ? 1 : 0;
        const conf =
          RUBRIC.CONFIDENCE.COVERAGE_WEIGHT * cov +
          RUBRIC.CONFIDENCE.SIGNAL_WEIGHT * sig +
          RUBRIC.CONFIDENCE.TYPE_WEIGHT * type;

        // Optional dictionary term occurrences (lazy: only first call builds service)
        let dictionaryTerms = [];
        try {
          const {
            createLegalDictionaryService,
          } = require("../utils/legalDictionaryService");
          const dictService = await createLegalDictionaryService({
            log,
            logLevels,
          });
          // Limit to top 40 to keep payload small
          dictionaryTerms = await dictService.scanDictionaryTerms(text, {
            maxTerms: 40,
          });
        } catch (e) {
          log(logLevels.DEBUG, "Dictionary term scan skipped", {
            error: e && e.message,
          });
        }

        const result = {
          rightsScore: averageScore,
          grade,
          confidence: Number(conf.toFixed(2)),
          uncommonWords,
          details: {
            chunkCount: chunks.length,
            averageScore,
            clauseSignals: totalSignals,
            wordCount: totalWords,
            clauseCounts: aggregateClauseCounts, // exposed for diagnostics/testing
            dictionaryTerms,
          },
        };

        log(logLevels.INFO, "Analysis complete", result);
        return result;
      } catch (error) {
        log(logLevels.ERROR, "Error analyzing content", { error });
        return {
          rightsScore: 0.5,
          uncommonWords: [],
          details: {
            error: error.message,
            confidence: 0,
          },
        };
      }
    }

    return {
      analyzeContent,
    };
  }

  // Export for both Chrome extension and test environments
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createRightsAssessor };
  } else if (typeof window !== "undefined") {
    global.RightsAssessor = {
      create: createRightsAssessor,
    };
  }
})(typeof window !== "undefined" ? window : global);
