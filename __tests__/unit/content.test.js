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

describe("Content Controller", () => {
  /**
   * Sets up a fresh DOM, Chrome API mocks, analyzer mocks, and global variables before each test.
   * Loads the ContentController class for isolated testing.
   */
  let ContentController;
  let contentController;
  let mockChrome;
  let mockLog;
  let mockLogLevels;

  beforeEach(() => {
    setupTestDOM();
    mockChrome = setupChromeAPI();

    // Mock the log and logLevels
    mockLog = jest.fn();
    mockLogLevels = EXT_CONSTANTS.DEBUG.LEVELS;

    // Mock the global analyzer factories
    global.RightsAssessor = {
      create: jest.fn().mockReturnValue({
        analyzeContent: jest.fn().mockResolvedValue(mockAnalysisResults.rights),
      }),
    };

    global.TosSummarizer = {
      create: jest.fn().mockReturnValue({
        summarizeTos: jest.fn().mockResolvedValue("Summary"),
      }),
    };

    global.TextExtractor = {
      create: jest.fn().mockReturnValue({
        extractAndAnalyzePageText: jest.fn().mockResolvedValue({
          text: mockLegalText.simple.text,
          metadata: { legalTermCount: 15 },
        }),
        extractText: jest.fn().mockReturnValue(mockLegalText.simple.text),
      }),
    };

    global.UncommonWordsIdentifier = {
      create: jest.fn().mockReturnValue({
        identifyUncommonWords: jest
          .fn()
          .mockResolvedValue(["pursuant", "aforementioned", "hereinafter"]),
      }),
    };

    // Mock other required globals
    global.legalTerms = ["terms", "service", "agreement"];
    global.commonWords = ["the", "and", "or"];
    global.legalTermsDefinitions = {};
    global.compromise = {};
    global.cheerio = {};

    // Load the ContentController
    ContentController = require("../../src/content/content");

    contentController = new ContentController({
      log: mockLog,
      logLevels: mockLogLevels,
    });
  });

  // --- Initialization and Analyzer Setup ---
  describe("Initialization", () => {
    test("should initialize analyzers successfully", () => {
      expect(global.RightsAssessor.create).toHaveBeenCalled();
      expect(global.TosSummarizer.create).toHaveBeenCalled();
      expect(global.TextExtractor.create).toHaveBeenCalled();
      expect(global.UncommonWordsIdentifier.create).toHaveBeenCalled();
      expect(mockLog).toHaveBeenCalledWith(
        mockLogLevels.INFO,
        "All analyzers initialized successfully",
      );
    });

    test("should initialize content script when document is ready", () => {
      document.readyState = "complete";
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
      document.readyState = "loading";
      const controller = new ContentController({
        log: mockLog,
        logLevels: mockLogLevels,
      });
      controller.initialize();
      expect(chrome.runtime.onMessage.addListener).not.toHaveBeenCalled();

      // Simulate document completing loading
      document.readyState = "complete";
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
          rights: mockAnalysisResults.rights,
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
          rights: mockAnalysisResults.rights,
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
          rights: mockAnalysisResults.rights,
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
      expect(mockLog).not.toHaveBeenCalled();
    });
  });
});
