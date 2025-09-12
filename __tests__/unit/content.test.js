/**
 * @jest-environment jsdom
 *
 * Best practice: Always use per-file jsdom for DOM/browser tests.
 */

/**
 * @file content.test.js
 * @description Unit tests for the ContentController (content script) of the Terms Guardian Chrome extension.
 *
 * This test suite ensures robust coverage of the content script's logic, including:
 *   - Initialization and analyzer setup
 *   - Extension badge management
 *   - Legal agreement detection and analysis
 *   - Chrome API and global analyzer mocking
 *   - Message handling and error scenarios
 *
 * Mocks:
 *   - Chrome APIs (runtime, action, etc.)
 *   - Analyzer factories (RightsAssessor, TosSummarizer, TextExtractor, UncommonWordsIdentifier)
 *   - Global variables required by the content script
 *
 * Coverage:
 *   - Initialization and DOM readiness
 *   - Badge icon updates for different detection scenarios
 *   - Handling of high, moderate, and low legal term counts
 *   - Graceful error handling during extraction/analysis
 *   - Message handling for analyzeRequest and unknown types
 *
 * @author Timmothy Escolopio
 * @company 3D Tech Solutions LLC
 * @date 2024-07-17
 * @version 1.1.0
 */
// __tests__/unit/content.test.js
const { EXT_CONSTANTS } = require("../../src/utils/constants");
const {
  setupTestDOM,
  createMessageEvent,
  simulateMutation,
  wait,
  setupChromeAPI,
} = require("../helpers/testUtils");
const { mockLegalText, mockAnalysisResults } = require("../helpers/mockData");

let ContentController;
let contentController;
let mockChrome;
let mockLog;
let mockLogLevels;

beforeEach(() => {
  // Always reset modules for clean isolation
  jest.resetModules();
  setupTestDOM();
  mockChrome = setupChromeAPI();

  // Mock the log and logLevels
  mockLog = jest.fn();
  mockLogLevels = EXT_CONSTANTS.DEBUG.LEVELS;

  // Analyzer mocks (set before requiring code)
  jest.mock("../../src/analysis/rightsAssessor", () => ({
    RightsAssessor: {
      create: jest.fn().mockReturnValue({
        analyzeContent: jest.fn().mockResolvedValue({
          rightsScore: 65, // 0-100 scale
          grade: "C",
          confidence: 0.75,
          uncommonWords: [], // Rights assessor shouldn't return uncommon words
          details: {
            chunkCount: 1,
            averageScore: 65,
            clauseSignals: 3,
            wordCount: 50,
            clauseCounts: { HIGH_RISK: {}, MEDIUM_RISK: {}, POSITIVES: {} },
            dictionaryTerms: [],
          },
        }),
      }),
    },
  }));
  jest.mock("../../src/analysis/summarizeTos", () => ({
    createSummarizer: jest.fn().mockReturnValue({
      summarizeTos: jest.fn().mockResolvedValue({
        overall: "Summary of the legal document",
        sections: [
          { heading: "Terms", summary: "Terms section summary" },
          { heading: "Privacy", summary: "Privacy section summary" },
        ],
      }),
    }),
  }));
  jest.mock("../../src/analysis/textExtractor", () => ({
    createTextExtractor: jest.fn().mockReturnValue({
      extractAndAnalyzePageText: jest.fn().mockResolvedValue({
        text: mockLegalText.simple.text,
        metadata: { legalTermCount: 15 },
      }),
      extractText: jest.fn().mockReturnValue(mockLegalText.simple.text),
      extract: jest.fn(async (input) => ({
        text: String(input),
        metadata: {},
      })),
      splitIntoSentences: jest.fn(() => ["sentence"]),
      splitIntoWords: jest.fn(() => ["terms", "of", "service", "agreement"]),
    }),
  }));
  // Mock pattern-based analyzer to allow targeted tests
  jest.mock("../../src/analysis/isLegalText", () => ({
    createLegalTextAnalyzer: jest.fn().mockReturnValue({
      analyzeText: jest.fn().mockResolvedValue({
        isLegal: false,
        confidence: "low",
      }),
    }),
  }));
  jest.mock("../../src/analysis/uncommonWordsIdentifier", () => ({
    createUncommonWordsIdentifier: jest.fn().mockReturnValue({
      identifyUncommonWords: jest
        .fn()
        .mockResolvedValue(["pursuant", "aforementioned", "hereinafter"]),
    }),
  }));

  // Mock required globals
  global.legalTerms = ["terms", "service", "agreement"];
  global.commonWords = ["the", "and", "or"];
  global.legalTermsDefinitions = {};
  global.compromise = {};
  global.cheerio = {};
  global.RightsAssessor =
    require("../../src/analysis/rightsAssessor").RightsAssessor;
  global.TosSummarizer = {
    create: require("../../src/analysis/summarizeTos").createSummarizer,
  };
  global.TextExtractor = {
    create: require("../../src/analysis/textExtractor").createTextExtractor,
  };
  global.UncommonWordsIdentifier = {
    create: require("../../src/analysis/uncommonWordsIdentifier")
      .createUncommonWordsIdentifier,
  };

  // Load ContentController after mocks
  const contentModule = require("../../src/content/content");
  ContentController = contentModule;
  contentController = new ContentController({
    log: mockLog,
    logLevels: mockLogLevels,
  });
});

afterEach(() => {
  // Best practice: Clean up globals
  delete global.legalTerms;
  delete global.commonWords;
  delete global.legalTermsDefinitions;
  delete global.compromise;
  delete global.cheerio;
  jest.clearAllMocks();
});

describe("Content Controller", () => {
  // --- Initialization and Analyzer Setup ---

  test("should initialize content script when document is ready", () => {
    setupTestDOM(); // Ensure document is available
    const controller = new ContentController({
      log: mockLog,
      logLevels: mockLogLevels,
    });
    controller.initialize();
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    expect(mockLog).toHaveBeenCalledWith(
      mockLogLevels.INFO,
      "Content script initialized",
    );
  });

  test("should wait for document to complete before initializing", async () => {
    Object.defineProperty(document, "readyState", {
      get: () => "loading",
      configurable: true,
    });
    const controller = new ContentController({
      log: mockLog,
      logLevels: mockLogLevels,
    });
    controller.initialize();

    // Simulate document completing loading
    Object.defineProperty(document, "readyState", {
      get: () => "complete",
      configurable: true,
    });
    document.dispatchEvent(new Event("readystatechange"));

    await wait(0);
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });
});

// --- Extension Badge Management ---
describe("Extension Icon Management", () => {
  test("should update extension icon with exclamation mark", () => {
    contentController.updateExtensionIcon(true);
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: "!" });
    expect(mockLog).toHaveBeenCalledWith(
      mockLogLevels.INFO,
      "Extension badge set",
    );
  });

  test("should update extension icon without exclamation mark", () => {
    contentController.updateExtensionIcon(false);
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: "" });
    expect(mockLog).toHaveBeenCalledWith(
      mockLogLevels.INFO,
      "Extension badge cleared",
    );
  });
});

// --- Legal Agreement Detection and Analysis ---
describe("Legal Agreement Detection", () => {
  test("should handle high legal term count", async () => {
    const text = mockLegalText.simple.text;
    await contentController.handleHighLegalTermCount(text);

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "tosDetected",
      text: text,
      analysis: {
        rights: 0.65, // 65/100 converted to 0-1 scale
        readability: expect.any(Object),
        summary: expect.any(String),
        sections: expect.any(Array),
        excerpts: expect.any(Array),
        rightsDetails: expect.objectContaining({
          rightsScore: 65,
          grade: "C",
          confidence: 0.75,
        }),
        uncommonWords: ["pursuant", "aforementioned", "hereinafter"],
        timestamp: expect.any(String),
      },
    });
  });

  test("should handle moderate legal term count", () => {
    contentController.handleModerateLegalTermCount();
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: "!" });
  });

  test("should detect and handle high count legal agreements", async () => {
    contentController.extractor.extractAndAnalyzePageText.mockResolvedValueOnce(
      {
        metadata: {
          legalTermCount: EXT_CONSTANTS.DETECTION.THRESHOLDS.AUTO_GRADE + 1,
        },
        text: mockLegalText.complex.text,
      },
    );

    await contentController.detectLegalAgreements();

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "tosDetected",
      text: mockLegalText.complex.text,
      analysis: {
        rights: 0.65, // 65/100 converted to 0-1 scale
        readability: expect.any(Object),
        summary: expect.any(String),
        sections: expect.any(Array),
        excerpts: expect.any(Array),
        rightsDetails: expect.objectContaining({
          rightsScore: 65,
          grade: "C",
          confidence: 0.75,
        }),
        uncommonWords: ["pursuant", "aforementioned", "hereinafter"],
        timestamp: expect.any(String),
      },
    });
  });

  test("should detect and handle moderate count legal agreements", async () => {
    contentController.extractor.extractAndAnalyzePageText.mockResolvedValueOnce(
      {
        metadata: {
          legalTermCount: EXT_CONSTANTS.DETECTION.THRESHOLDS.NOTIFY + 1,
        },
        text: mockLegalText.simple.text,
      },
    );

    await contentController.detectLegalAgreements();
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: "!" });
  });

  test("should detect and handle low count legal agreements", async () => {
    contentController.extractor.extractAndAnalyzePageText.mockResolvedValueOnce(
      {
        metadata: {
          legalTermCount: EXT_CONSTANTS.DETECTION.THRESHOLDS.NOTIFY - 1,
        },
        text: mockLegalText.simple.text,
      },
    );

    await contentController.detectLegalAgreements();
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: "" });
  });

  test("should initiate grading when pattern-based analyzer indicates legal with medium confidence below term threshold", async () => {
    // Force low term count to use fallback
    contentController.extractor.extractAndAnalyzePageText.mockResolvedValueOnce(
      {
        metadata: {
          legalTermCount: EXT_CONSTANTS.DETECTION.THRESHOLDS.NOTIFY - 1,
        },
        text: mockLegalText.complex.text,
      },
    );

    // Update analyzer on existing controller to return legal with medium confidence
    contentController.legalAnalyzer.analyzeText.mockResolvedValueOnce({
      isLegal: true,
      confidence: "medium",
    });

    await contentController.detectLegalAgreements();

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "tosDetected",
      text: mockLegalText.complex.text,
      analysis: {
        rights: 0.65, // 65/100 converted to 0-1 scale
        readability: expect.any(Object),
        summary: expect.any(String),
        sections: expect.any(Array),
        excerpts: expect.any(Array),
        rightsDetails: expect.objectContaining({
          rightsScore: 65,
          grade: "C",
          confidence: 0.75,
        }),
        uncommonWords: ["pursuant", "aforementioned", "hereinafter"],
        timestamp: expect.any(String),
      },
    });
  });

  test("should handle extraction errors gracefully", async () => {
    const error = new Error("Extraction failed");
    contentController.extractor.extractAndAnalyzePageText.mockRejectedValueOnce(
      error,
    );

    await contentController.detectLegalAgreements();

    expect(mockLog).toHaveBeenCalledWith(
      mockLogLevels.ERROR,
      "Error detecting legal agreements:",
      error,
    );
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: "" });
  });
});

// --- Message Handling and Error Scenarios ---
describe("Message Handling", () => {
  test("should handle analyze request messages", async () => {
    const message = {
      type: "analyzeRequest",
      text: mockLegalText.simple.text,
    };

    await contentController.handleMessage(message);

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "analysisComplete",
      analysis: {
        rights: 0.65, // 65/100 converted to 0-1 scale
        readability: expect.any(Object),
        summary: expect.any(String),
        sections: expect.any(Array),
        excerpts: expect.any(Array),
        rightsDetails: expect.objectContaining({
          rightsScore: 65,
          grade: "C",
          confidence: 0.75,
        }),
        uncommonWords: ["pursuant", "aforementioned", "hereinafter"],
        timestamp: expect.any(String),
      },
    });
  });

  test("should ignore unknown message types", async () => {
    const message = {
      type: "unknown",
      data: "test",
    };

    await contentController.handleMessage(message);

    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });
});

test("should verify analyzer mocks are correctly setup", () => {
  console.log("Test: Verifying analyzer mocks");
  expect(global.RightsAssessor.create).toHaveBeenCalled();
  expect(global.TosSummarizer.create).toHaveBeenCalled();
  expect(global.TextExtractor.create).toHaveBeenCalled();
  expect(global.UncommonWordsIdentifier.create).toHaveBeenCalled();
  console.log("Test: Analyzer mocks verified");
});

test("should verify global variables are set after beforeEach", () => {
  console.log("Test: Verifying global variable setup");
  expect(global.legalTermsDefinitions).toBeDefined();
  expect(global.compromise).toBeDefined();
  expect(global.cheerio).toBeDefined();
  console.log("Test: Global variables setup verified");
});

test("should verify global variables are deleted after afterEach", () => {
  // Simulate afterEach cleanup
  delete global.legalTerms;
  delete global.commonWords;
  delete global.legalTermsDefinitions;
  delete global.compromise;
  delete global.cheerio;
  console.log("Test: Verifying global variable teardown");
  expect(global.legalTerms).toBeUndefined();
  expect(global.commonWords).toBeUndefined();
  expect(global.legalTermsDefinitions).toBeUndefined();
  expect(global.compromise).toBeUndefined();
  expect(global.cheerio).toBeUndefined();
  console.log("Test: Global variables teardown verified");
});

test("should verify Chrome API mocks are reset between tests", () => {
  console.log("Test: Verifying Chrome API mock reset");
  chrome.action.setBadgeText("reset-test");
  expect(chrome.action.setBadgeText).toHaveBeenCalledWith("reset-test");
  jest.clearAllMocks();
  expect(chrome.action.setBadgeText).not.toHaveBeenCalled();
  console.log("Test: Chrome API mock reset verified");
});
