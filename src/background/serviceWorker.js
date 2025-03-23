// src/background/serviceWorker.js

/**
 * @file service-worker.js
 * @description Service worker for the Chrome extension, handling all background operations
 * @version 1.2.0
 * @date 2024-09-28
 */

const { EXT_CONSTANTS } = require("../utils/constants");

function createServiceWorker({ log, logLevels }) {
  // Get constants
  const { STORAGE_KEYS, CONTEXT_MENU, MESSAGES, EXTENSION } = EXT_CONSTANTS;

  // State management
  const state = {
    notifiedDomains: new Map(),
    analysisInProgress: new Set(),
    initialized: false,
  };

  /**
   * Sets up the context menu
   */
  function setupContextMenu() {
    try {
      chrome.contextMenus.create(CONTEXT_MENU.GRADE_TEXT);
      log(logLevels.INFO, "Context menu created successfully");
    } catch (error) {
      log(logLevels.ERROR, "Error creating context menu:", error);
    }
  }

  /**
   * Shows a notification to the user
   * @param {string} message Notification message
   */
  function showNotification(message) {
    const notificationOptions = {
      type: "basic",
      title: EXTENSION.NAME,
      message: message,
      iconUrl: EXTENSION.ICON_PATHS.MEDIUM,
    };

    chrome.notifications.create(notificationOptions, (notificationId) => {
      log(logLevels.INFO, `Notification created with ID: ${notificationId}`);
    });
  }

  /**
   * Handles context menu clicks
   * @param {Object} data Click data
   * @param {Object} tab Current tab
   */
  async function handleContextMenuClick(data, tab) {
    try {
      // Validate input data
      if (!data || !tab || !data.selectionText || !tab.id) {
        log(logLevels.WARN, "Invalid context menu click data:", { data, tab });
        showNotification(MESSAGES.ERROR.GENERAL);
        return;
      }

      log(logLevels.INFO, "Context menu clicked", {
        selection: data.selectionText?.substring(0, 100),
        tabId: tab.id,
      });

      // Store selection and open side panel in parallel
      await Promise.all([
        storeAnalysisData(STORAGE_KEYS.LAST_WORD, data.selectionText),
        openSidePanel(tab.id),
      ]);

      log(logLevels.INFO, "Context menu actions completed successfully");
    } catch (error) {
      log(logLevels.ERROR, "Error handling context menu click:", error);
      showNotification(MESSAGES.ERROR.GENERAL);

      // TODO: Add more specific error handling or logging based on error type
    }
  }
  /**
   * Stores analysis data
   * @param {string} key Storage key
   * @param {any} data Data to store
   */
  async function storeAnalysisData(key, data) {
    try {
      await chrome.storage.local.set({ [key]: data });

      // Check for errors using chrome.runtime.lastError
      if (chrome.runtime.lastError) {
        log(logLevels.ERROR, "Error storing data:", chrome.runtime.lastError);
        // Optionally, show a user-facing error message here
        // or handle the error more gracefully
      } else {
        log(logLevels.INFO, `Data stored successfully for key: ${key}`);
      }
    } catch (error) {
      log(logLevels.ERROR, "Error storing data:", error);
      // Optionally, show a user-facing error message here
      // or handle the error more gracefully
    }
  }

  /**
   * Opens the side panel
   * @param {number} tabId Tab ID
   */
  async function openSidePanel(tabId) {
    try {
      // Check if a side panel is already open
      const window = await chrome.windows.getCurrent();
      if (window.sidePanel?.state === "open") {
        log(logLevels.INFO, "Side panel is already open");
        return; // No need to open another one
      }

      await chrome.sidePanel.open({ tabId });
      log(logLevels.INFO, "Side panel opened successfully");
    } catch (error) {
      log(logLevels.ERROR, "Error opening side panel:", error);
      // Consider showing a user-friendly error message here if appropriate
    }
  }

  /**
   * Handles message routing
   * @param {Object} message Message object
   * @param {Object} sender Sender information
   * @param {Function} sendResponse Response callback
   */
  async function handleMessage(message, sender, sendResponse) {
    log(logLevels.DEBUG, "Message received:", message);

    try {
      // Validate the message
      if (!message || !message.action) {
        log(logLevels.WARN, "Invalid message received:", message);
        sendResponse({ error: "Invalid message" });
        return;
      }

      switch (message.action) {
        case "getWord": {
          // Added block scope for cleaner variable handling
          const result = await chrome.storage.local.get(STORAGE_KEYS.LAST_WORD);
          sendResponse({ lastWord: result[STORAGE_KEYS.LAST_WORD] });
          break;
        }
        case "tosDetected": {
          // Added block scope
          await handleTosDetected(message, sender);
          sendResponse({ success: true });
          break;
        }
        case "checkNotification": {
          // Added block scope
          const response = await handleCheckNotification(sender.tab);
          sendResponse(response);
          break;
        }
        default:
          log(logLevels.WARN, "Unknown message action:", message.action);
          sendResponse({ error: MESSAGES.ERROR.UNKNOWN_ACTION });
      }
    } catch (error) {
      log(logLevels.ERROR, "Error handling message:", error);
      sendResponse({ error: error.message });
    }
  }

  /**
   * Handles ToS detection
   * @param {Object} message Message containing ToS data
   * @param {Object} sender Sender information
   */
  async function handleTosDetected(message, sender) {
    // Validate input
    if (!message || !sender || !sender.tab || !sender.tab.id || !message.text) {
      log(logLevels.WARN, "Invalid ToS detection data:", { message, sender });
      return;
    }

    const tabId = sender.tab.id;

    if (state.analysisInProgress.has(tabId)) {
      log(logLevels.INFO, "Analysis already in progress for tab:", tabId);
      return;
    }

    try {
      state.analysisInProgress.add(tabId);

      const results = await analyzeContent(message.text);

      // Store results
      await storeAnalysisData(`${STORAGE_KEYS.ANALYSIS_RESULTS}_${tabId}`, {
        ...results,
        timestamp: new Date().toISOString(),
      });

      // Show notification
      showNotification(MESSAGES.AUTO_GRADE);

      log(logLevels.INFO, "ToS analysis completed successfully");
    } catch (error) {
      log(logLevels.ERROR, "Error analyzing ToS:", error);

      // Show a generic error message to the user
      showNotification(EXT_CONSTANTS.MESSAGES.ERROR.ANALYSIS_FAILED);

      // Log more specific error details to the console for debugging
      if (error.message.includes("readability")) {
        console.error("Readability analysis failed:", error);
      } else if (error.message.includes("rights")) {
        console.error("Rights analysis failed:", error);
      } else {
        console.error("Unexpected analysis error:", error);
      }
    } finally {
      state.analysisInProgress.delete(tabId);
    }
  }

  /**
   * Handles check notification requests
   * @param {Object} tab Tab information
   * @returns {Object} Notification status
   */
  async function handleCheckNotification(tab) {
    try {
      // Validate the input
      if (!tab || !tab.url) {
        log(logLevels.WARN, "Invalid tab data for notification check:", tab);
        return { shouldShow: false, error: "Invalid tab data" };
      }

      const domain = new URL(tab.url).hostname;
      return {
        shouldShow: state.notifiedDomains.has(domain),
        domain: domain,
      };
    } catch (error) {
      log(logLevels.ERROR, "Error checking notification status:", error);
      return { shouldShow: false, error: error.message };
    }
  }

  /**
   * Analyzes content using available analyzers
   * @param {string} text Text to analyze
   */
  async function analyzeContent(text) {
    try {
      // Validate the input text
      if (!text || typeof text !== "string") {
        log(logLevels.WARN, "Invalid text provided for analysis:", text);
        throw new Error("Invalid text provided for analysis");
      }

      const results = await Promise.allSettled([
        global.ReadabilityGrader.create({
          log,
          logLevels,
        }).calculateReadabilityGrade(text),
        global.RightsAssessor.create({ log, logLevels }).analyzeContent(text),
        global.TosSummarizer.create({ log, logLevels }).summarizeTos(text),
        global.UncommonWordsIdentifier.create({
          log,
          logLevels,
        }).identifyUncommonWords(text),
      ]);

      // Process the results from Promise.allSettled
      const readability =
        results[0].status === "fulfilled"
          ? results[0].value
          : { error: "Readability analysis failed" };
      const rights =
        results[1].status === "fulfilled"
          ? results[1].value
          : { error: "Rights analysis failed" };
      const summary =
        results[2].status === "fulfilled"
          ? results[2].value
          : { error: "Summarization failed" };
      const uncommonWords =
        results[3].status === "fulfilled"
          ? results[3].value
          : { error: "Uncommon words identification failed" };

      return { readability, rights, summary, uncommonWords };
    } catch (error) {
      log(logLevels.ERROR, "Error in content analysis:", error);
      // Show a generic user-facing error message
      showNotification(EXT_CONSTANTS.MESSAGES.ERROR.ANALYSIS_FAILED);
      // Log more specific error details to the console for debugging
      console.error("Detailed analysis error:", error);
      throw error;
    }
  }

  /**
   * Initializes the service worker
   */
  function initialize() {
    if (state.initialized) {
      log(logLevels.WARN, "Service worker already initialized");
      return;
    }

    // Set up error handling
    self.addEventListener("error", (event) => {
      log(logLevels.ERROR, "Uncaught error:", event.error);
    });

    // Set up error handling for unhandled promise rejections
    self.addEventListener("unhandledrejection", (event) => {
      log(logLevels.ERROR, "Unhandled promise rejection:", event.reason);
    });

    // Set up event listeners
    chrome.runtime.onInstalled.addListener(() => {
      setupContextMenu();
      log(logLevels.INFO, "Extension installed successfully");
    });

    chrome.contextMenus.onClicked.addListener(handleContextMenuClick);
    // Add a listener for runtime messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      handleMessage(message, sender, sendResponse);

      // Always return true to indicate that you will respond asynchronously
      return true;
    });

    state.initialized = true;
    log(logLevels.INFO, "Service worker initialized successfully");
  }

  return {
    initialize,
    // Expose for testing
    _test: {
      handleMessage,
      handleContextMenuClick,
      handleTosDetected,
      analyzeContent,
      setupContextMenu,
      showNotification,
      storeAnalysisData,
      openSidePanel,
      handleCheckNotification,
    },
  };
}

// Export for CommonJS
module.exports = { createServiceWorker };

// Initialize if in service worker context
if (typeof chrome !== "undefined" && chrome.runtime?.id) {
  const serviceWorker = createServiceWorker({
    log: console.log,
    logLevels: EXT_CONSTANTS.DEBUG.LEVELS,
  });
  serviceWorker.initialize();
}
