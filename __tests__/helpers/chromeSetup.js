// __tests__/helpers/chromeSetup.js
const { getMockChromeAPI, getMockAnalyzers } = require("./mockData");

/**
 * Sets up the Chrome environment with mock APIs and analyzers
 * @param {Object} customChromeAPI - Optional custom Chrome API implementation
 * @param {Object} customAnalyzers - Optional custom analyzers implementation
 */
const setupChromeEnvironment = (customChromeAPI = {}, customAnalyzers = {}) => {
  // Get the mock Chrome API
  const mockChromeAPI = getMockChromeAPI();

  // Set up Chrome API
  global.chrome = {
    ...mockChromeAPI,
    ...customChromeAPI,
    // Ensure extension ID is always available
    runtime: {
      ...mockChromeAPI.runtime,
      ...customChromeAPI?.runtime,
      id: "mock-extension-id",
    },
  };

  // Set up analyzers with both mock implementations and custom overrides
  const mockAnalyzers = getMockAnalyzers();
  const analyzers = {
    RightsAssessor: {
      ...mockAnalyzers.RightsAssessor,
      ...customAnalyzers?.RightsAssessor,
    },
    TosSummarizer: {
      ...mockAnalyzers.TosSummarizer,
      ...customAnalyzers?.TosSummarizer,
    },
    TextExtractor: {
      ...mockAnalyzers.TextExtractor,
      ...customAnalyzers?.TextExtractor,
    },
    UncommonWordsIdentifier: {
      ...mockAnalyzers.UncommonWordsIdentifier,
      ...customAnalyzers?.UncommonWordsIdentifier,
    },
  };

  // Attach analyzers to global object
  Object.assign(global, analyzers);

  // Return the setup objects for test reference
  return {
    chrome: global.chrome,
    analyzers,
  };
};

/**
 * Resets the Chrome environment and analyzers
 */
const resetChromeEnvironment = () => {
  delete global.chrome;
  delete global.RightsAssessor;
  delete global.TosSummarizer;
  delete global.TextExtractor;
  delete global.UncommonWordsIdentifier;
};

/**
 * Creates a mock Chrome message sender
 * @param {string} type - Type of sender (content_script, background, etc.)
 * @returns {Object} Message sender object
 */
const createMessageSender = (type = "content_script") => ({
  id: "mock-extension-id",
  tab: { id: 1, url: "https://example.com" },
  frameId: 0,
  url: "chrome-extension://mock-extension-id",
  origin: "chrome-extension://mock-extension-id",
  documentId: "mock-document-id",
  documentLifecycle: "active",
  contextId: 1,
  renderFrameId: 0,
  serviceWorker: {
    scriptURL: "chrome-extension://mock-extension-id/serviceWorker.js",
  },
  worker: { scriptURL: "chrome-extension://mock-extension-id/worker.js" },
});

/**
 * Simulates a Chrome runtime message
 * @param {Object} message - Message content
 * @param {Object} sender - Message sender
 * @returns {Promise} Promise that resolves with response
 */
const simulateChromeMessage = async (
  message,
  sender = createMessageSender(),
) => {
  const listeners = global.chrome.runtime.onMessage.addListener.mock.calls;
  const responses = await Promise.all(
    listeners.map(([listener]) => listener(message, sender)),
  );
  return responses[responses.length - 1];
};

/**
 * Creates a mock Chrome storage change object
 * @param {string} key - Storage key
 * @param {*} oldValue - Previous value
 * @param {*} newValue - New value
 * @returns {Object} Storage changes object
 */
const createStorageChanges = (key, oldValue, newValue) => ({
  [key]: { oldValue, newValue },
});

// Initialize chrome environment by default
setupChromeEnvironment();

module.exports = {
  setupChromeEnvironment,
  resetChromeEnvironment,
  createMessageSender,
  simulateChromeMessage,
  createStorageChanges,
};
