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

const { EXT_CONSTANTS } = require("../utils/constants");
const { RightsAssessor } = require("../analysis/rightsAssessor");
const { commonWords } = require("../data/commonWords");
const { legalTermsDefinitions } = require("../data/legalTermsDefinitions");

(function (global) {
  "use strict";

  // Configuration
  class ContentController {
    constructor({ log, logLevels }) {
      const { DETECTION, MESSAGES, CLASSES } = EXT_CONSTANTS;
      this.DETECTION_INTERVAL = DETECTION.INTERVAL;
      this.THRESHOLDS = DETECTION.THRESHOLDS;
      this.MESSAGES = MESSAGES;
      this.HIGHLIGHT_CLASS = CLASSES.HIGHLIGHT;
      this.log = log;
      this.logLevels = logLevels;
      this.lastDetectionTime = 0;
      this.observer = null;

      // Initialize analyzers
      this.initializeAnalyzers();
    }

    /**
     * Initializes all analysis modules
     */
    initializeAnalyzers() {
      try {
        this.assessor = RightsAssessor.create({
          log: this.log,
          logLevels: this.logLevels,
          commonWords: commonWords,
          legalTermsDefinitions: legalTermsDefinitions,
        });

        this.summarizer = global.TosSummarizer.create({
          compromise: global.compromise,
          cheerio: global.cheerio,
          log: this.log,
          logLevels: this.logLevels,
        });

        this.extractor = global.TextExtractor.create({
          log: this.log,
          logLevels: this.logLevels,
          config: {
            highlightThreshold: 20,
            sectionThreshold: 10,
          },
          legalTerms: global.legalTerms,
        });

        this.identifier = global.UncommonWordsIdentifier.create({
          log: this.log,
          logLevels: this.logLevels,
          commonWords: global.commonWords,
          legalTermsDefinitions: global.legalTermsDefinitions,
          config: {
            minWordLength: 3,
            maxDefinitionRetries: 3,
          },
        });

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
     * Detects legal agreements in the document
     */
    async detectLegalAgreements() {
      try {
        // 1. Extract and analyze the page text using TextExtractor
        const extractionResult =
          await this.extractor.extractAndAnalyzePageText();

        // 2. Handle potential errors from the extraction
        if (extractionResult.error) {
          this.log(this.logLevels.ERROR, extractionResult.error);
          return; // Exit if there's an error
        }

        // 3. Get the count of legal terms found
        const legalTermCount = extractionResult.metadata.legalTermCount;

        // 4. Determine the appropriate action based on the legal term count
        if (legalTermCount >= EXT_CONSTANTS.DETECTION.THRESHOLDS.AUTO_GRADE) {
          // If there are many legal terms, handle as a high count
          await this.handleHighLegalTermCount(extractionResult.text);
        } else if (legalTermCount > EXT_CONSTANTS.DETECTION.THRESHOLDS.NOTIFY) {
          // If there are a moderate number of legal terms, handle accordingly
          this.handleModerateLegalTermCount();
        } else {
          // If there are few legal terms, clear the extension icon
          this.updateExtensionIcon(false);
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
        showNotification(this.NOTIFICATIONS.AUTO_GRADE);

        const analysis = await this.performFullAnalysis(text);
        chrome.runtime.sendMessage({
          type: "tosDetected",
          text: text,
          analysis: analysis,
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
     * Handles moderate legal term count detection
     */
    handleModerateLegalTermCount() {
      this.updateExtensionIcon(true);
      showNotification(this.NOTIFICATIONS.SIGNIFICANT_TERMS);
    }

    /**
     * Performs full analysis of text
     * @param {string} text Text to analyze
     */
    async performFullAnalysis(text) {
      try {
        const [rightsAnalysis, uncommonWords] = await Promise.all([
          this.assessor.analyzeContent(text),
          this.identifier.identifyUncommonWords(text),
        ]);

        return {
          rights: rightsAnalysis,
          uncommonWords: uncommonWords,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        this.log(
          this.logLevels.ERROR,
          "Error performing full analysis:",
          error,
        );
        throw error;
      }
    }

    /**
     * Initializes the content script
     */
    initialize() {
      // Inject domManager.js
      injectScript(chrome.runtime.getURL("src/utils/domManager.js"));

      // Set up a message listener to receive the result from domManager.js
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "legalTextResult") {
          if (request.isLegalText) {
            this.updateExtensionIcon(true); // Set the badge to "!"

            // Instead of calling detectLegalAgreements directly,
            // use the cached text and pass it to detectLegalAgreements
            this.detectLegalAgreements(this.cachedText);
          } else {
            this.updateExtensionIcon(false); // Clear the badge
            // TODO: Handle the case where the page is not a legal text
          }
        }
      });

      // Cache the initial text content AFTER setting up the message listener
      this.cachedText = this.extractor.extractText(document.body);

      this.observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
            this.detectLegalAgreements();
          }
        });
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      this.setupMessageListeners();
      this.log(this.logLevels.INFO, "Content script initialized");
    }

    /**
     * Sets up message listeners
     */
    setupMessageListeners() {
      chrome.runtime.onMessage.addListener(
        async (request, sender, sendResponse) => {
          if (request.type === "gradeText") {
            await this.handleGradeTextRequest();
          }
        },
      );
    }

    /**
     * Handles grade text requests
     */
    async handleGradeTextRequest() {
      const selectedText = window.getSelection().toString();
      const hasEnoughLegalText = await this.detectLegalAgreements(selectedText);

      if (hasEnoughLegalText) {
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

  // Initialize the content controller
  const controller = new ContentController({
    log: console.log,
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
})(typeof window !== "undefined" ? window : global);
