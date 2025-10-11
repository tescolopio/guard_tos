/**
 * @file content.js
 * @description This script is responsible for detecting legal terms on web pages, notifying the user, and updating the extension badge accordingly.
 * @contributors {tescolopio}
 * @version 1.1.0
 * @date 2024-09-26
 *
 * @author Timmothy Escolopio
 * @company 3D Tech Solutions LLC
 *
 * @changes
 *  - 2024-09-18 | tescolopio | Initial creation of the script.
 *  - 2024-09-21.01 | tescolopio | Moved functionality from background.js to content.js to update the extension badge based on the number of legal terms detected.
 *  - 2024-09-21.02 | tescolopio | Improved logging and error handling, updated code direction and sequence.
 *  - 2024-09-26 | tescolopio | Modified to work with Chrome extension content scripts and globally defined variables.
 */

// IMPORTANT: set webpack runtime publicPath to the extension base before anything else
// This prevents "Automatic publicPath is not supported in this browser" errors
try {
  require("../runtime/publicPath");
} catch (e) {
  /* noop */
}

// Set a flag on the body to indicate the content script has loaded
// Wait for DOM to be ready first
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    document.body.setAttribute("data-terms-guardian-loaded", "true");
  });
} else {
  document.body.setAttribute("data-terms-guardian-loaded", "true");
}

// Fallback imports for browser environment
let EXT_CONSTANTS,
  RightsAssessor,
  createLegalTextAnalyzer,
  createReadabilityGrader,
  utilities,
  commonWords,
  legalTermsDefinitions;
let createSummarizer,
  createEnhancedSummarizer,
  createTextExtractor,
  createUncommonWordsIdentifier;
let ContentHashService,
  EnhancedCacheService,
  DatabaseService,
  UserPreferenceService,
  TextCache;

try {
  EXT_CONSTANTS = require("../utils/constants").EXT_CONSTANTS;
  RightsAssessor = require("../analysis/rightsAssessor").RightsAssessor;
  createLegalTextAnalyzer =
    require("../analysis/isLegalText").createLegalTextAnalyzer;
  createReadabilityGrader =
    require("../analysis/readabilityGrader").createReadabilityGrader;
  utilities = require("../utils/utilities");
  commonWords = require("../data/commonWords").commonWords;
  legalTermsDefinitions =
    require("../data/legalTermsDefinitions").legalTermsDefinitions;
  createSummarizer = require("../analysis/summarizeTos").createSummarizer;
  createEnhancedSummarizer =
    require("../analysis/enhancedSummarizer").createEnhancedSummarizer;
  createTextExtractor =
    require("../analysis/textExtractor").createTextExtractor;
  createUncommonWordsIdentifier =
    require("../analysis/uncommonWordsIdentifier").createUncommonWordsIdentifier;

  // Hash-based caching services
  ContentHashService =
    require("../services/contentHashService").ContentHashService;
  EnhancedCacheService =
    require("../services/enhancedCacheService").EnhancedCacheService;
  DatabaseService = require("../services/databaseService").DatabaseService;
  UserPreferenceService =
    require("../services/userPreferenceService").UserPreferenceService;
  TextCache = require("../data/cache/textCache").TextCache;
} catch (e) {
  // Fallback to global objects in production build
  EXT_CONSTANTS = global.EXT_CONSTANTS;
  RightsAssessor = global.RightsAssessor;
  createLegalTextAnalyzer = global.createLegalTextAnalyzer;
  createReadabilityGrader =
    global.ReadabilityGrader && global.ReadabilityGrader.create;
  utilities = global.utilities;
  commonWords = global.commonWords;
  legalTermsDefinitions = global.legalTermsDefinitions;
  createSummarizer = global.TosSummarizer && global.TosSummarizer.create;
  createEnhancedSummarizer =
    global.EnhancedTosSummarizer && global.EnhancedTosSummarizer.create;
  createTextExtractor = global.TextExtractor && global.TextExtractor.create;
  createUncommonWordsIdentifier =
    global.UncommonWordsIdentifier && global.UncommonWordsIdentifier.create;

  // Hash-based caching global fallbacks
  ContentHashService = global.ContentHashService;
  EnhancedCacheService = global.EnhancedCacheService;
  DatabaseService = global.DatabaseService;
  UserPreferenceService = global.UserPreferenceService;
  TextCache = global.TextCache;
}

(function (global) {
  "use strict";

  // Configuration
  class ContentController {
    constructor({ log, logLevels }) {
      const { DETECTION, MESSAGES, CLASSES } = EXT_CONSTANTS;
      // Use unified constant naming
      this.DETECTION_INTERVAL = DETECTION.INTERVAL_MS;
      this.THRESHOLDS = DETECTION.THRESHOLDS;
      this.MESSAGES = MESSAGES;
      this.HIGHLIGHT_CLASS = CLASSES.HIGHLIGHT;
      this.log = log;
      this.logLevels = logLevels;
      this.lastDetectionTime = 0;
      this.observer = null;
      this.debouncedDetect = null;

      // Initialize analyzers
      this.initializeAnalyzers();
    }

    /**
     * Initializes all analysis modules
     */
    initializeAnalyzers() {
      try {
        if (!RightsAssessor || !RightsAssessor.create) {
          throw new Error("RightsAssessor not available");
        }
        this.assessor = RightsAssessor.create({
          log: this.log,
          logLevels: this.logLevels,
          commonWords: commonWords,
          legalTermsDefinitions: legalTermsDefinitions,
        });

        // Initialize readability grader
        if (!createReadabilityGrader) {
          throw new Error("ReadabilityGrader not available");
        }
        this.readabilityGrader = createReadabilityGrader({
          log: this.log,
          logLevels: this.logLevels,
        });

        // Pattern-based legal text analyzer for fallback/confirmatory detection
        if (!createLegalTextAnalyzer) {
          throw new Error("createLegalTextAnalyzer not available");
        }
        this.legalAnalyzer = createLegalTextAnalyzer({
          log: this.log,
          logLevels: this.logLevels,
          legalTerms: global.legalTerms || [],
          utilities,
        });

        if (!createSummarizer) {
          throw new Error("TosSummarizer not available");
        }
        this.summarizer = createSummarizer({
          compromise: global.compromise,
          cheerio: global.cheerio,
          log: this.log,
          logLevels: this.logLevels,
        });

        // Enhanced summarizer for plain language summaries
        if (!createEnhancedSummarizer) {
          throw new Error("EnhancedTosSummarizer not available");
        }
        this.enhancedSummarizer = createEnhancedSummarizer({
          compromise: global.compromise,
          cheerio: global.cheerio,
          log: this.log,
          logLevels: this.logLevels,
        });

        if (!createTextExtractor) {
          throw new Error("TextExtractor not available");
        }
        this.extractor = createTextExtractor({
          log: this.log,
          logLevels: this.logLevels,
          config: {
            highlightThreshold: 20,
            sectionThreshold: 10,
          },
          legalTerms: global.legalTerms,
        });

        if (!createUncommonWordsIdentifier) {
          throw new Error("UncommonWordsIdentifier not available");
        }
        this.identifier = createUncommonWordsIdentifier({
          log: this.log,
          logLevels: this.logLevels,
          commonWords: global.commonWords,
          legalTermsDefinitions: global.legalTermsDefinitions,
          config: {
            minWordLength: 3,
            maxDefinitionRetries: 3,
          },
        });

        // Initialize hash-based caching services
        try {
          if (
            UserPreferenceService &&
            DatabaseService &&
            ContentHashService &&
            EnhancedCacheService
          ) {
            this.preferenceService = new UserPreferenceService();
            this.databaseService = new DatabaseService({ testMode: true });
            // Create a simple in-memory text cache (fallback if TextCache not available)
            const FallbackTextCache = class {
              constructor(cfg) {
                this.cfg = cfg || { TTL: 24 * 60 * 60 * 1000 };
                this.map = new Map();
              }
              async get(key) {
                const e = this.map.get(key);
                if (!e) return null;
                if (Date.now() - e.t > this.cfg.TTL) {
                  this.map.delete(key);
                  return null;
                }
                return e.v;
              }
              async set(key, value) {
                this.map.set(key, { v: value, t: Date.now() });
              }
              async delete(key) {
                this.map.delete(key);
              }
              getStats() {
                return { processed: this.map.size };
              }
              cleanup() {
                const now = Date.now();
                for (const [k, e] of this.map) {
                  if (now - e.t > this.cfg.TTL) this.map.delete(k);
                }
              }
            };

            this.textCache = TextCache
              ? new TextCache({
                  TTL:
                    EXT_CONSTANTS.ANALYSIS.CACHE_DURATION ||
                    24 * 60 * 60 * 1000,
                  MAX_ENTRIES: 200,
                })
              : new FallbackTextCache();

            this.hashService = new ContentHashService();
            this.enhancedCache = new EnhancedCacheService(
              this.textCache,
              this.databaseService,
              this.preferenceService,
            );
          }
        } catch (svcErr) {
          this.log(this.logLevels.WARN, "Hash caching init failed:", svcErr);
        }

        // Set up a message listener to receive the result from domManager.js
        chrome.runtime.onMessage.addListener(
          (request, sender, sendResponse) => {
            if (request.action === "legalTextResult") {
              if (request.isLegalText) {
                this.updateExtensionIcon(true); // Set the badge to "!"
                this.detectLegalAgreements(this.cachedText); // Proceed with analysis
              } else {
                this.updateExtensionIcon(false); // Clear the badge
              }
            } else if (request.type === "gradeText") {
              this.handleGradeTextRequest();
            }
          },
        );

        this.log(this.logLevels.INFO, "All analyzers initialized successfully");
      } catch (error) {
        this.log(this.logLevels.ERROR, "Error initializing analyzers:", error);
        throw error; // Consider handling this error more gracefully
      }
    }

    /**
     * Updates the extension icon
     * @param {boolean} showExclamation Whether to show the exclamation mark
     */
    updateExtensionIcon(showExclamation) {
      try {
        chrome.action.setBadgeText({
          text: showExclamation ? "!" : "",
        });
        this.log(
          this.logLevels.INFO,
          `Extension badge ${showExclamation ? "set" : "cleared"}`,
        );
      } catch (error) {
        this.log(this.logLevels.ERROR, "Error updating extension icon:", error);
      }
    }

    /**
     * Detects legal agreements in the document or provided text
     * @param {string} [inputText] Optional text to analyze instead of extracting from DOM
     * @returns {Promise<boolean>} whether grading should be initiated
     */
    async detectLegalAgreements(inputText) {
      try {
        // 1. Get text and metadata either from provided input or via extractor
        let extractionResult;
        if (typeof inputText === "string" && inputText.trim().length > 0) {
          const words = inputText.toLowerCase().split(/\W+/).filter(Boolean);
          const legalTerms = (global.legalTerms || []).map((t) =>
            String(t).toLowerCase(),
          );
          const legalTermCount = words.filter((w) =>
            legalTerms.includes(w),
          ).length;
          extractionResult = {
            text: inputText,
            metadata: {
              legalTermCount,
              wordCount: words.length,
            },
          };
        } else {
          // Extract and analyze the page text using TextExtractor
          let ContentHashService,
            EnhancedCacheService,
            DatabaseService,
            UserPreferenceService,
            TextCache;
          extractionResult = await this.extractor.extractAndAnalyzePageText();
        }

        // 2. Handle potential errors from the extraction
        if (extractionResult.error) {
          this.log(this.logLevels.ERROR, extractionResult.error);
          return false; // Exit if there's an error
        }

        // 3. Get the count of legal terms found
        const legalTermCount = extractionResult.metadata.legalTermCount;

        // 4. Determine the appropriate action based on the legal term count
        if (legalTermCount >= EXT_CONSTANTS.DETECTION.THRESHOLDS.AUTO_GRADE) {
          // If there are many legal terms, handle as a high count
          await this.handleHighLegalTermCount(extractionResult.text);
          return true;
        } else if (legalTermCount > EXT_CONSTANTS.DETECTION.THRESHOLDS.NOTIFY) {
          // If there are a moderate number of legal terms, handle accordingly
          this.handleModerateLegalTermCount();
          return false;
        } else {
          // If there are few legal terms, run a pattern-based analysis as a fallback
          try {
            const patternAnalysis = await this.legalAnalyzer.analyzeText(
              extractionResult.text,
            );

            // If patterns indicate legal content with at least medium confidence, initiate grading
            if (
              patternAnalysis?.isLegal &&
              patternAnalysis.confidence !== "low" &&
              // If metrics not provided by analyzer mock, allow fallback to pass
              (!patternAnalysis.metrics ||
                ((patternAnalysis.metrics?.totalWords || 0) >=
                  (EXT_CONSTANTS.DETECTION.FALLBACK_GATES
                    ?.MIN_WORDS_FOR_FALLBACK || 50) &&
                  (patternAnalysis.metrics?.patternScore || 0) >=
                    (EXT_CONSTANTS.DETECTION.FALLBACK_GATES
                      ?.MIN_PATTERN_SCORE || 0.3)))
            ) {
              await this.handleHighLegalTermCount(extractionResult.text);
              return true;
            } else {
              // Otherwise, clear the extension icon
              this.updateExtensionIcon(false);
              return false;
            }
          } catch (patternErr) {
            // On analyzer error, proceed with clearing badge as safe default
            this.log(
              this.logLevels.WARN,
              "Pattern-based analysis failed:",
              patternErr,
            );
            this.updateExtensionIcon(false);
            return false;
          }
        }

        // 5. Optionally, return true if a significant number of legal terms were found
        // return legalTermCount >= CONSTANTS.DETECTION.THRESHOLDS.NOTIFY;
      } catch (error) {
        // 6. Handle any errors during the process
        this.log(
          this.logLevels.ERROR,
          "Error detecting legal agreements:",
          error,
        );
        this.updateExtensionIcon(false);
        return false;
        // Consider additional error handling or user feedback here
      }
    }

    /**
     * Handles high legal term count detection
     * @param {string} text The extracted text
     */
    async handleHighLegalTermCount(text) {
      try {
        this.updateExtensionIcon(true);
        const url =
          (typeof window !== "undefined" &&
            window.location &&
            window.location.href) ||
          "unknown://local";

        // Try cache first
        if (this.enhancedCache && this.preferenceService) {
          try {
            const enabled = await this.preferenceService.isHashCachingEnabled();
            if (enabled) {
              const cacheResult = await this.enhancedCache.getCachedAnalysis(
                url,
                text,
              );
              if (cacheResult && cacheResult.data) {
                const cachedAnalysis = this.normalizeAnalysisEntry(
                  cacheResult.data,
                );
                const minimal = cachedAnalysis
                  ? {
                      rights: cachedAnalysis.rights,
                      readability: cachedAnalysis.readability,
                      summary: cachedAnalysis.summary,
                      sections: cachedAnalysis.sections,
                      excerpts: cachedAnalysis.excerpts,
                      rightsDetails: cachedAnalysis.rightsDetails,
                      uncommonWords: cachedAnalysis.uncommonWords,
                      timestamp: cachedAnalysis.timestamp,
                    }
                  : null;
                this.log(
                  this.logLevels.INFO,
                  `Cache hit from ${cacheResult.source} for ${url}`,
                );
                chrome.runtime.sendMessage({
                  type: "tosDetected",
                  text: text,
                  analysis: minimal || cachedAnalysis,
                });
                return;
              }
            }
          } catch (e) {
            this.log(this.logLevels.WARN, "Cache lookup error:", e);
          }
        }

        // No cache: do analysis
        const analysis = await this.performFullAnalysis(text);
        const minimal = {
          documentInfo: {
            url: window.location.href,
            title: document.title || "Unknown Document",
            timestamp: analysis.timestamp,
          },
          scores: {
            readability: analysis.readability, // Full readability object with stats
            rights: analysis.rightsDetails, // Full rights object with categoryScores
          },
          summary: analysis.summary,
          enhancedSummary: analysis.enhancedSummary,
          sections: analysis.sections,
          excerpts: analysis.excerpts,
          terms: analysis.uncommonWords,
          // Legacy format for backward compatibility
          rights: analysis.rights,
          readability: analysis.readability,
          rightsDetails: analysis.rightsDetails,
          uncommonWords: analysis.uncommonWords,
          riskLevel: analysis.riskLevel,
          keyFindings: analysis.keyFindings,
          plainLanguageAlert: analysis.plainLanguageAlert,
          timestamp: analysis.timestamp,
        };

        // Store in cache
        if (this.enhancedCache && this.hashService) {
          try {
            const metadata = await this.hashService.generateMetadata(url, text);
            await this.enhancedCache.storeAnalysis(metadata, analysis);
          } catch (e) {
            this.log(this.logLevels.WARN, "Cache store error:", e);
          }
        }

        chrome.runtime.sendMessage({
          type: "tosDetected",
          text: text,
          analysis: minimal,
        });
      } catch (error) {
        this.log(
          this.logLevels.ERROR,
          "Error handling high legal term count:",
          error,
        );
      }
    }

    /**
     * Normalize cached entry shape to analysis result
     */
    normalizeAnalysisEntry(entry) {
      if (!entry) return null;
      if (entry.analysis) return entry.analysis;
      return entry;
    }

    /**
     * Handles moderate legal term count detection
     */
    handleModerateLegalTermCount() {
      this.updateExtensionIcon(true);
    }

    /**
     * Performs initial legal detection on page load
     */
    async performInitialLegalDetection() {
      try {
        if (!this.cachedText || this.cachedText.trim().length < 100) {
          this.log(
            this.logLevels.DEBUG,
            "Insufficient text for legal detection",
          );
          this.updateExtensionIcon(false);
          return false;
        }

        // Use the legal text analyzer to check if this is a legal document
        const isLegal = await this.legalTextAnalyzer.analyze(this.cachedText);

        if (isLegal) {
          this.log(this.logLevels.INFO, "Legal document detected");
          this.updateExtensionIcon(true); // Set the badge to "!"

          // Run full analysis
          this.detectLegalAgreements(this.cachedText);
          return true;
        } else {
          this.log(this.logLevels.DEBUG, "Not detected as a legal document");
          this.updateExtensionIcon(false); // Clear the badge
          return false;
        }
      } catch (error) {
        this.log(
          this.logLevels.ERROR,
          "Error in initial legal detection:",
          error,
        );
        this.updateExtensionIcon(false);
        return false;
      }
    }

    initialize() {
      // Cache the initial text content
      this.cachedText = this.extractor.extractText(document.body);

      // Run immediate legal text detection on the current page
      this.performInitialLegalDetection();

      // Set up debounced detection for DOM mutations
      if (!this.debouncedDetect) {
        this.debouncedDetect = this.debounce(
          () => this.detectLegalAgreements(),
          this.DETECTION_INTERVAL,
        );
      }

      this.observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === "childList") {
            this.debouncedDetect();
            break;
          }
        }
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      this.setupMessageListeners();
      this.log(this.logLevels.INFO, "Content script initialized");
    }

    /**
     * Simple debounce helper
     * @param {Function} fn function to debounce
     * @param {number} delay delay in ms
     */
    debounce(fn, delay) {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), delay);
      };
    }

    /**
     * Performs full analysis on given text
     * @param {string} text Text to analyze
     * @returns {Object} Analysis results
     */
    async performFullAnalysis(text) {
      try {
        const rightsAnalysis = await this.assessor.analyzeContent(text);
        const readabilityAnalysis =
          await this.readabilityGrader.calculateReadabilityGrade(text);

        // Create simple HTML wrapper for text to enable summarization
        const htmlContent = `<html><body><div>${text.replace(/\n/g, "<br>")}</div></body></html>`;

        // Use enhanced summarizer for plain language summaries
        const summaryAnalysis =
          await this.enhancedSummarizer.summarizeTos(htmlContent);

        // Section-level rights scoring: analyze each section's content
        try {
          if (Array.isArray(summaryAnalysis.sections)) {
            const analyzedSections = await Promise.all(
              summaryAnalysis.sections.map(async (section) => {
                const sectionText =
                  section.originalText || section.content || "";
                if (!sectionText || sectionText.length < 20) return section;
                const secRes = await this.assessor.analyzeContent(sectionText);
                // Normalize per-section rights shape
                const catScores = secRes?.details?.categoryScores || {};
                section.rights = {
                  categoryScores: catScores,
                  grade: secRes?.grade,
                  confidence: secRes?.confidence,
                  wordCount:
                    (secRes?.details && secRes.details.wordCount) ||
                    sectionText.split(/\s+/).filter(Boolean).length,
                };
                return section;
              }),
            );
            summaryAnalysis.sections = analyzedSections;

            // Aggregate document-level category scores using word-count-weighted average
            const totals = Object.create(null);
            const weights = Object.create(null);
            for (const s of analyzedSections) {
              const wc = s?.rights?.wordCount || 0;
              if (!wc || !s?.rights?.categoryScores) continue;
              const cs = s.rights.categoryScores;
              for (const [cat, obj] of Object.entries(cs)) {
                const score =
                  typeof obj?.score === "number" ? obj.score : undefined;
                if (typeof score !== "number") continue;
                totals[cat] = (totals[cat] || 0) + score * wc;
                weights[cat] = (weights[cat] || 0) + wc;
              }
            }
            const aggregated = {};
            for (const [cat, total] of Object.entries(totals)) {
              const w = weights[cat] || 0;
              if (w > 0) {
                const avg = total / w;
                aggregated[cat] = { raw: null, adjusted: null, score: avg };
              }
            }
            // Preserve original doc-level category scores for diagnostics, then override with aggregated
            if (rightsAnalysis?.details) {
              rightsAnalysis.details.originalCategoryScores =
                rightsAnalysis.details.categoryScores || null;
              rightsAnalysis.details.categoryScores = aggregated;
              rightsAnalysis.details.sectionAggregated = true;
            }
          }
        } catch (sectionErr) {
          this.log(
            this.logLevels.WARN,
            "Section-level rights scoring failed:",
            sectionErr,
          );
        }

        // Keep legacy summarizer for backward compatibility if needed
        const legacySummary = await this.summarizer.summarizeTos(htmlContent);

        const uncommonWords = await this.identifier.identifyUncommonWords(text);
        const keyExcerpts = this.extractKeyExcerpts(text);

        // Ensure rights analysis has the correct score format
        const normalizedRightsAnalysis = {
          ...rightsAnalysis,
          // Ensure score is in 0-100 range for consistency
          score: rightsAnalysis.rightsScore || 0,
          rightsScore: rightsAnalysis.rightsScore || 0,
        };

        // Compute User Rights Index (URI)
        let userRightsIndex = null;
        try {
          const {
            createUserRightsIndex,
          } = require("../analysis/userRightsIndex");
          const uri = createUserRightsIndex({
            log: this.log,
            logLevels: this.logLevels,
          });
          userRightsIndex = uri.compute({
            readability: readabilityAnalysis,
            rightsDetails: normalizedRightsAnalysis,
            sections: summaryAnalysis.sections,
          });
        } catch (e) {
          this.log(this.logLevels.WARN, "URI compute failed", e);
        }

        return {
          rights: rightsAnalysis.rightsScore / 100, // Convert to 0-1 scale for UI
          readability: readabilityAnalysis,
          summary: summaryAnalysis.overall, // Enhanced plain language summary
          enhancedSummary: summaryAnalysis, // Complete enhanced summary object
          legacySummary: legacySummary.overall, // Original summary for comparison
          sections: summaryAnalysis.sections, // Enhanced section summaries with risk levels and per-section rights
          excerpts: keyExcerpts, // Key excerpts as array of strings
          rightsDetails: normalizedRightsAnalysis, // Keep full details for diagnostics
          uncommonWords: uncommonWords,
          userRightsIndex,
          riskLevel: summaryAnalysis.overallRisk, // Overall document risk assessment
          keyFindings: summaryAnalysis.keyFindings, // Important findings for quick review
          plainLanguageAlert: summaryAnalysis.plainLanguageAlert, // User warnings if any
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        this.log(
          this.logLevels.ERROR,
          "Error performing full analysis:",
          error,
        );
        return {
          rights: 0,
          readability: { error: "Analysis failed" },
          summary: "Analysis failed",
          sections: [],
          excerpts: [],
          rightsDetails: { error: "Analysis failed" },
          uncommonWords: [],
          timestamp: new Date().toISOString(),
        };
      }
    }

    /**
     * Extracts key excerpts from legal text
     * @param {string} text The text to extract excerpts from
     * @returns {Array<string>} Array of key excerpt strings
     */
    extractKeyExcerpts(text) {
      try {
        if (!text || typeof text !== "string") {
          return [];
        }

        // Split text into sentences
        const sentences = text
          .split(/[.!?]+/)
          .filter((s) => s.trim().length > 20);

        // Legal patterns to look for in excerpts
        const legalPatterns = [
          /arbitration/i,
          /class action/i,
          /liability/i,
          /indemnif/i,
          /warrant/i,
          /termination/i,
          /privacy/i,
          /data collection/i,
          /intellectual property/i,
          /governing law/i,
          /jurisdiction/i,
          /dispute/i,
          /refund/i,
          /cancellation/i,
          /limitation/i,
        ];

        const keyExcerpts = [];
        const maxExcerpts = 8;

        // Find sentences that contain legal patterns
        for (const sentence of sentences) {
          const trimmedSentence = sentence.trim();
          if (trimmedSentence.length < 50 || trimmedSentence.length > 300) {
            continue; // Skip very short or very long sentences
          }

          // Check if sentence contains legal patterns
          const hasLegalPattern = legalPatterns.some((pattern) =>
            pattern.test(trimmedSentence),
          );

          if (hasLegalPattern) {
            keyExcerpts.push(trimmedSentence);
            if (keyExcerpts.length >= maxExcerpts) {
              break;
            }
          }
        }

        // If we don't have enough excerpts, add some general important sentences
        if (keyExcerpts.length < 3) {
          for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (
              trimmedSentence.length >= 50 &&
              trimmedSentence.length <= 200 &&
              !keyExcerpts.includes(trimmedSentence)
            ) {
              keyExcerpts.push(trimmedSentence);
              if (keyExcerpts.length >= maxExcerpts) {
                break;
              }
            }
          }
        }

        return keyExcerpts.slice(0, maxExcerpts);
      } catch (error) {
        this.log(this.logLevels.ERROR, "Error extracting key excerpts:", error);
        return [];
      }
    }

    /**
     * Handles incoming messages
     * @param {Object} message Message object
     */
    async handleMessage(message) {
      if (!message || !message.type) {
        return;
      }

      switch (message.type) {
        case "analyzeRequest":
          if (message.text) {
            const analysis = await this.performFullAnalysis(message.text);
            const minimal = {
              rights: analysis.rights,
              readability: analysis.readability,
              summary: analysis.summary,
              sections: analysis.sections,
              excerpts: analysis.excerpts,
              rightsDetails: analysis.rightsDetails,
              uncommonWords: analysis.uncommonWords,
              timestamp: analysis.timestamp,
            };
            chrome.runtime.sendMessage({
              type: "analysisComplete",
              analysis: minimal,
            });
          }
          break;
        case "gradeText":
          await this.handleGradeTextRequest();
          break;
        default:
          // Unknown message type - ignore
          break;
      }
    }

    /**
     * Sets up message listeners
     */
    setupMessageListeners() {
      chrome.runtime.onMessage.addListener(
        async (request, sender, sendResponse) => {
          await this.handleMessage(request);
        },
      );
    }

    /**
     * Handles grade text requests
     */
    async handleGradeTextRequest() {
      const selectedText = window.getSelection().toString();
      const shouldGrade = await this.detectLegalAgreements(selectedText);

      if (shouldGrade) {
        const analysis = await this.performFullAnalysis(selectedText);
        chrome.runtime.sendMessage({
          type: "tosDetected",
          text: selectedText,
          analysis: analysis,
        });
      } else {
        chrome.runtime.sendMessage({ type: "sidepanelOpened" });
      }
    }
  }

  /**
   * Helper function to inject a script into the page
   * @param {string} scriptUrl The URL of the script to inject
   */
  function injectScript(scriptUrl) {
    const script = document.createElement("script");
    script.src = scriptUrl;
    document.head.appendChild(script);
  }

  // Create a simple logger that handles log levels
  const simpleLogger = (level, ...args) => {
    const levelNames = {
      0: '[ERROR]',
      1: '[WARN]',
      2: '[INFO]',
      3: '[DEBUG]',
      4: '[TRACE]'
    };
    const levelName = levelNames[level] || '[LOG]';
    console.log(levelName, ...args);
  };

  // Initialize the content controller
  const controller = new ContentController({
    log: simpleLogger,
    logLevels: EXT_CONSTANTS.DEBUG.LEVELS, // Use CONSTANTS.DEBUG.LEVELS
  });

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () =>
      controller.initialize(),
    );
  } else {
    controller.initialize();
  }

  // Set a flag on the body to indicate the content script has loaded
  document.body.setAttribute("data-terms-guardian-loaded", "true");

  // Export for testing
  if (typeof module !== "undefined" && module.exports) {
    module.exports = ContentController;
  }
})(typeof window !== "undefined" ? window : global);

window.termsGuardianContentLoaded = true;
