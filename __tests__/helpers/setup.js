// __tests__/helpers/setup.js

// Core imports
const { expect } = require("@jest/globals");
require("@testing-library/jest-dom");
const {
  setupChromeEnvironment,
  resetChromeEnvironment,
} = require("./chromeSetup");
const { setupMockAnalyzers } = require("./testUtils");

// Make expect globally available if not already
if (!global.expect) {
  global.expect = expect;
}

/**
 * Mock window.matchMedia
 * @returns {Object} Mock matchMedia implementation
 */
const createMatchMediaMock = () => {
  return jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

/**
 * Mock ResizeObserver
 */
class MockResizeObserver {
  observe() {
    jest.fn();
  }
  unobserve() {
    jest.fn();
  }
  disconnect() {
    jest.fn();
  }
}

/**
 * Mock console methods
 * @returns {Object} Mock console implementation
 */
const createConsoleMock = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  // Keep trace and time functions for debugging
  trace: console.trace,
  time: console.time,
  timeEnd: console.timeEnd,
});

/**
 * Mock Fetch API
 */
const mockFetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    headers: new Headers(),
    status: 200,
    statusText: "OK",
  }),
);

/**
 * Mock DOM Event
 */
class MockEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.bubbles = options.bubbles || false;
    this.cancelable = options.cancelable || false;
    this.composed = options.composed || false;
  }

  preventDefault() {
    jest.fn();
  }
  stopPropagation() {
    jest.fn();
  }
  stopImmediatePropagation() {
    jest.fn();
  }
}

/**
 * Setup all global mocks and test environment
 */
const setupGlobalMocks = () => {
  // Window mocks
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: createMatchMediaMock(),
  });

  // Global observers
  global.ResizeObserver = MockResizeObserver;
  global.fetch = mockFetch;
  global.Event = MockEvent;

  global.MutationObserver = class {
    constructor(callback) {
      this.callback = callback;
      this.observe = jest.fn();
      this.disconnect = jest.fn();
      this.takeRecords = jest.fn();
    }
  };

  global.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback;
      this.observe = jest.fn();
      this.unobserve = jest.fn();
      this.disconnect = jest.fn();
    }
  };

  // Mock clipboard
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: jest.fn().mockResolvedValue(undefined),
      readText: jest.fn().mockResolvedValue(""),
    },
    writable: true,
  });

  // Mock timing functions
  jest.useFakeTimers();

  // Mock console
  global.console = createConsoleMock();
};

// Setup test environment
beforeAll(() => {
  setupGlobalMocks();
  setupChromeEnvironment();
  setupMockAnalyzers();
});

// Reset mocks between tests
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  jest.clearAllTimers();

  // Clear storage
  localStorage.clear();
  sessionStorage.clear();

  // Reset DOM
  document.body.innerHTML = "";

  // Reset fetch mock
  global.fetch.mockClear();

  // Reset Chrome environment
  resetChromeEnvironment();
  setupChromeEnvironment();
});

// Cleanup after all tests
afterAll(() => {
  jest.useRealTimers();
  resetChromeEnvironment();
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  throw reason;
});

// Add custom matchers
expect.extend({
  /**
   * Custom matcher for checking if an element contains highlighted text
   */
  toHaveHighlightedText(received, expected) {
    const highlightedText = received.querySelector(".highlighted-text");
    const pass =
      highlightedText && highlightedText.textContent.includes(expected);

    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to contain highlighted text "${expected}"`
          : `Expected element to contain highlighted text "${expected}"`,
    };
  },

  /**
   * Custom matcher for checking Chrome message structure
   */
  toBeValidChromeMessage(received) {
    const hasType = typeof received.type === "string";
    const hasValidStructure = typeof received === "object" && received !== null;
    const pass = hasType && hasValidStructure;

    return {
      pass,
      message: () =>
        pass
          ? "Expected message not to be a valid Chrome message"
          : "Expected message to be a valid Chrome message with a type property",
    };
  },

  /**
   * Custom matcher for checking if an element contains legal terms
   */
  toHaveLegalTerms(received, expectedTerms) {
    const terms = received.querySelectorAll(".legal-term");
    const foundTerms = Array.from(terms).map((term) => term.textContent);
    const pass = expectedTerms.every((term) => foundTerms.includes(term));

    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to contain legal terms "${expectedTerms.join(", ")}"`
          : `Expected element to contain legal terms "${expectedTerms.join(", ")}"`,
    };
  },
});

// Export test utilities
module.exports = {
  createMatchMediaMock,
  MockResizeObserver,
  createConsoleMock,
  mockFetch,
  MockEvent,
  setupGlobalMocks,
};
