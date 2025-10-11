/**
 * @file utilities.js
 * @description This script contains utility functions used by other scripts in the web browser extension.
 * @contributor {tescolopio}
 * @version 1.1.0
 * @date 2024-09-22
 *
 * @company 3D Tech Solutions LLC
 *
 * @changes
 *  - 2024-09-18 | tescolopio | Initial creation of the script.
 *  - 2024-09-22 | tescolopio | Modified to work with Chrome extension content scripts.
 */

(function (global) {
  "use strict";

  const { EXT_CONSTANTS } = require("./constants");

  function createUtilities({ log, logLevels, legalTerms }) {
    // Get constants
    const { MESSAGES, EXTENSION } = EXT_CONSTANTS;

    /**
     * Legal term detection functions
     */
    function containsLegalTerm(text) {
      log(
        logLevels.DEBUG,
        `Checking for exact legal term match in text: ${text}`,
      );
      const legalTermsSet = new Set(legalTerms);
      const words = text.split(/\s+/);
      const result = words.some((word) => legalTermsSet.has(word));
      log(logLevels.DEBUG, `Exact match result: ${result}`);
      return result;
    }

    function containsPartialMatch(text) {
      log(
        logLevels.DEBUG,
        `Checking for partial legal term match in text: ${text}`,
      );
      const legalTermsSet = new Set(legalTerms);
      const result = legalTermsSet.has(text);
      log(logLevels.DEBUG, `Partial match result: ${result}`);
      return result;
    }

    function containsProximityMatch(text, proximity = 5) {
      log(
        logLevels.DEBUG,
        `Checking for proximity legal term match in text: ${text}`,
      );
      const legalTermsSet = new Set(legalTerms);
      const words = text.split(/\s+/);
      for (let i = 0; i < words.length; i++) {
        if (legalTermsSet.has(words[i])) {
          for (let j = 1; j <= proximity; j++) {
            if (legalTermsSet.has(words[i + j])) {
              log(
                logLevels.DEBUG,
                `Proximity match found: ${words[i]} ${words[i + j]}`,
              );
              return true;
            }
          }
        }
      }
      log(logLevels.DEBUG, `No proximity match found`);
      return false;
    }

    /**
     * URL and domain handling
     */
    function extractDomain(url) {
      try {
        if (!url || typeof url !== "string") {
          return null;
        }

        const parsedUrl = new URL(url);
        const domain = parsedUrl.hostname;

        return domain.toLowerCase();
      } catch (error) {
        log(logLevels.ERROR, "Error extracting domain:", error);
        return null;
      }
    }

    /**
     * Updates the extension icon
     * @param {boolean} showExclamation Whether to show the exclamation mark
     */
    function updateExtensionIcon(showExclamation) {
      try {
        chrome.action.setBadgeText({
          text: showExclamation ? "!" : "",
        });
        chrome.action.setBadgeBackgroundColor({
          color: showExclamation ? "#FF0000" : EXTENSION.BADGE_COLOR,
        });
        log(
          logLevels.INFO,
          `Extension badge ${showExclamation ? "set" : "cleared"}`,
        );
      } catch (error) {
        log(logLevels.ERROR, "Error updating extension icon:", error);
      }
    }

    /**
     * Updates the sidePanel with content
     * @param {Object} content Content to update the sidePanel with
     */
    function updateSidePanel(content) {
      try {
        log(logLevels.INFO, "Updating sidePanel with content");

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            log(
              logLevels.ERROR,
              `Error querying tabs: ${chrome.runtime.lastError.message}`,
            );
            showNotification(MESSAGES.ERROR.GENERAL);
            return;
          }

          if (!tabs?.length) {
            log(logLevels.ERROR, "No active tab found");
            showNotification(MESSAGES.ERROR.GENERAL);
            return;
          }

          const activeTab = tabs[0];
          chrome.tabs.sendMessage(activeTab.id, {
            type: "updateSidePanel",
            content: content,
          });
        });
      } catch (error) {
        log(logLevels.ERROR, "Error updating sidePanel:", error);
      }
    }

    /**
     * Highlights legal terms in the document
     * @param {string} text Text to highlight
     * @returns {number} Count of highlighted terms
     */
    function highlightLegalTerms(text) {
      try {
        const legalTermsSet = new Set(legalTerms);
        const words = text.split(/\s+/);
        let count = 0;

        words.forEach((word) => {
          if (legalTermsSet.has(word)) {
            // Highlight the word in the document (implementation depends on your requirements)
            count++;
          }
        });

        log(logLevels.DEBUG, `Highlighted ${count} legal terms`);
        return count;
      } catch (error) {
        log(logLevels.ERROR, "Error highlighting legal terms:", error);
        return 0;
      }
    }

    /**
     * Fetches data with a timeout
     * @param {string} url URL to fetch
     * @param {Object} options Fetch options
     * @param {number} timeout Timeout in milliseconds
     * @returns {Promise<Response>} Fetch response
     */
    async function fetchWithTimeout(url, options = {}, timeout = 5000) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    }

    return {
      containsLegalTerm,
      containsPartialMatch,
      containsProximityMatch,
      extractDomain,
      updateExtensionIcon,
      updateSidePanel,
      highlightLegalTerms,
      fetchWithTimeout,
    };
  }

  global.createUtilities = {
    create: createUtilities,
  };

  // Create a default instance
  const defaultUtilities = createUtilities({});

  // Export for both Chrome extension and test environments
  if (typeof module !== "undefined" && module.exports) {
    module.exports = defaultUtilities; // Export default instance as main export
    module.exports.createUtilities = createUtilities; // Also export factory
  } else {
    const utils = createUtilities({
      log: global.log,
      logLevels: global.logLevels,
      legalTerms: global.legalTerms,
    });

    // Expose utilities globally
    Object.assign(global, utils);
  }
})(typeof window !== "undefined" ? window : global);
