// __tests__/helpers/testUtils.js
const mockData = require("./mockData");

/**
 * Sets up a clean DOM environment for testing
 * @param {string} innerHTML - Optional HTML to insert into body
 */
const setupTestDOM = (innerHTML = "") => {
  document.body.innerHTML = innerHTML;
};

/**
 * Resets all mocks and cleans up the testing environment
 */
const resetAllMocks = () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  document.body.innerHTML = "";
  delete global.chrome;
};

/**
 * Creates a mock Chrome API environment
 * @param {Object} customImplementation - Optional custom implementation
 * @returns {Object} Mock Chrome API
 */
const setupChromeAPI = (customImplementation = {}) => {
  const defaultImplementation = {
    runtime: {
      id: "mock-extension-id",
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
      getManifest: jest.fn(() => ({
        manifest_version: 3,
        version: "1.0.0",
      })),
    },
    storage: {
      local: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
        clear: jest.fn(),
      },
      sync: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
        clear: jest.fn(),
      },
    },
    tabs: {
      query: jest.fn(),
      sendMessage: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      onUpdated: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
    },
    sidePanel: {
      open: jest.fn(),
      setOptions: jest.fn(),
    },
    contextMenus: {
      create: jest.fn(),
      remove: jest.fn(),
      onClicked: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
    },
    scripting: {
      executeScript: jest.fn(),
      insertCSS: jest.fn(),
    },
    ...mockData.mockChromeAPI,
    ...customImplementation,
  };

  global.chrome = defaultImplementation;
  return global.chrome;
};

/**
 * Sets up mock analyzers with default implementations
 * @param {Object} customImplementation - Optional custom implementation
 */
const setupMockAnalyzers = (customImplementation = {}) => {
  const defaultAnalyzers = {
    analyzeReadability: jest.fn().mockResolvedValue({
      score: 75,
      grade: "Good",
      metrics: { words: 100, sentences: 10, complexity: "moderate" },
    }),
    analyzeRights: jest.fn().mockResolvedValue({
      score: 65,
      concerns: ["data_collection", "third_party_sharing"],
      recommendations: ["review_privacy_settings"],
    }),
    detectLegalTerms: jest.fn().mockResolvedValue({
      isLegal: true,
      confidence: 0.85,
      terms: ["privacy", "data", "consent"],
    }),
    ...mockData.mockAnalyzers,
    ...customImplementation,
  };

  Object.assign(global, defaultAnalyzers);
  return defaultAnalyzers;
};

/**
 * Helper to wait for promises to resolve
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after specified time
 */
const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper to wait for all promises to resolve
 * @returns {Promise} Promise that resolves when all microtasks are complete
 */
const flushPromises = () =>
  new Promise(jest.requireActual("timers").setImmediate);

/**
 * Creates a mock storage event
 * @param {string} key - Storage key
 * @param {*} newValue - New value
 * @param {*} oldValue - Old value
 * @returns {StorageEvent} Mock storage event
 */
const createStorageEvent = (key, newValue, oldValue = null) => {
  return new StorageEvent("storage", {
    key,
    newValue: JSON.stringify(newValue),
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    storageArea: localStorage,
    url: window.location.href,
  });
};

/**
 * Simulates a DOM mutation
 * @param {Element} target - Target element
 * @param {string} type - Mutation type
 * @returns {MutationObserver} The created observer
 */
const simulateMutation = (target, type = "childList") => {
  const observer = new MutationObserver(() => {});
  const config = {
    childList: type === "childList",
    attributes: type === "attributes",
    characterData: type === "characterData",
    subtree: true,
  };

  observer.observe(target, config);

  if (type === "childList") {
    const div = document.createElement("div");
    target.appendChild(div);
    target.removeChild(div);
  } else if (type === "attributes") {
    target.setAttribute("data-test", "value");
    target.removeAttribute("data-test");
  }

  return observer;
};

/**
 * Creates a mock message event
 * @param {Object} message - Message data
 * @param {string} source - Source of the message
 * @returns {MessageEvent} Mock message event
 */
const createMessageEvent = (message, source = "content-script") => {
  return new MessageEvent("message", {
    data: message,
    origin: "chrome-extension://mock-extension-id",
    source: {
      id: "mock-extension-id",
      type: source,
    },
  });
};

/**
 * Simulates script injection
 * @param {string} src - Script source
 * @param {Object} options - Additional script attributes
 * @returns {HTMLScriptElement} The injected script element
 */
const injectScript = (src, options = {}) => {
  const script = document.createElement("script");
  script.src = src;
  Object.assign(script, options);
  document.head.appendChild(script);

  // Simulate load event
  const loadEvent = new Event("load");
  script.dispatchEvent(loadEvent);

  return script;
};

/**
 * Creates a mock tab object
 * @param {Object} props - Tab properties
 * @returns {Object} Mock tab object
 */
const createMockTab = (props = {}) => ({
  id: 1,
  url: "https://example.com",
  active: true,
  index: 0,
  windowId: 1,
  status: "complete",
  ...props,
});

module.exports = {
  setupTestDOM,
  resetAllMocks,
  setupChromeAPI,
  setupMockAnalyzers,
  wait,
  flushPromises,
  createStorageEvent,
  simulateMutation,
  createMessageEvent,
  injectScript,
  createMockTab,
};
