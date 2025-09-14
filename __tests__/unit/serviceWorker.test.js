// __tests__/unit/serviceWorker.test.js

describe("Service Worker", () => {
  let serviceWorker;
  let logMock;
  let logLevelsMock;
  let createServiceWorker;
  let EXT_CONSTANTS;
  let ReadabilityGrader;
  let RightsAssessor;
  let TosSummarizer;
  let UncommonWordsIdentifier;

  beforeEach(() => {
    // Mock the Service Worker global scope
    global.self = {
      addEventListener: jest.fn(),
    };
    // Mock analyzers
    ReadabilityGrader = {
      create: jest.fn().mockReturnValue({
        calculateReadabilityGrade: jest.fn().mockResolvedValue({ score: 75 }),
      }),
    };

    RightsAssessor = {
      create: jest.fn().mockReturnValue({
        analyzeContent: jest.fn().mockResolvedValue({ score: 80 }),
      }),
    };

    TosSummarizer = {
      create: jest.fn().mockReturnValue({
        summarizeTos: jest.fn().mockResolvedValue("Summary"),
      }),
    };

    UncommonWordsIdentifier = {
      create: jest.fn().mockReturnValue({
        identifyUncommonWords: jest.fn().mockResolvedValue(["word1", "word2"]),
      }),
    };

    // Setup global context
    global.ReadabilityGrader = ReadabilityGrader;
    global.RightsAssessor = RightsAssessor;
    global.TosSummarizer = TosSummarizer;
    global.UncommonWordsIdentifier = UncommonWordsIdentifier;

    // Setup Chrome API mock
    global.chrome = {
      runtime: {
        onInstalled: {
          addListener: jest.fn((callback) => callback()),
        },
        onMessage: {
          addListener: jest.fn(),
          removeListener: jest.fn(),
        },
        getManifest: jest.fn(() => ({ version: "1.0.0" })),
        lastError: null,
      },
      action: {
        onClicked: {
          addListener: jest.fn(),
          removeListener: jest.fn(),
        },
      },
      sidePanel: {
        open: jest.fn().mockResolvedValue(undefined),
      },
      contextMenus: {
        create: jest.fn(),
        onClicked: {
          addListener: jest.fn(),
          removeListener: jest.fn(),
        },
      },
      notifications: {
        create: jest.fn((options, callback) => callback?.("notificationId")),
      },
      storage: {
        local: {
          set: jest.fn().mockResolvedValue(undefined),
          get: jest.fn().mockResolvedValue({}),
        },
      },
      windows: {
        getCurrent: jest
          .fn()
          .mockResolvedValue({ sidePanel: { state: "closed" } }),
      },
      sidePanel: {
        open: jest.fn().mockResolvedValue(undefined),
      },
      tabs: {
        query: jest.fn().mockResolvedValue([{ id: 1 }]),
        sendMessage: jest.fn(),
      },
    };

    // Now load the modules
    jest.isolateModules(() => {
      const constants = require("../../src/utils/constants");
      const serviceWorkerModule = require("../../src/background/serviceWorker");
      EXT_CONSTANTS = constants.EXT_CONSTANTS;
      createServiceWorker = serviceWorkerModule.createServiceWorker;
    });

    // Setup logging mocks
    logMock = jest.fn();
    logLevelsMock = EXT_CONSTANTS.DEBUG.LEVELS;

    // Initialize service worker
    serviceWorker = createServiceWorker({
      log: logMock,
      logLevels: logLevelsMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    delete global.chrome;
    delete global.ReadabilityGrader;
    delete global.RightsAssessor;
    delete global.TosSummarizer;
    delete global.UncommonWordsIdentifier;
  });

  describe("Initialization", () => {
    test("should initialize the service worker", () => {
      serviceWorker.initialize();

      expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalled();
      expect(chrome.contextMenus.onClicked.addListener).toHaveBeenCalled();
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
      expect(logMock).toHaveBeenCalledWith(
        logLevelsMock.INFO,
        "Service worker initialized successfully",
      );
    });

    test("should set up context menu", () => {
      serviceWorker._test.setupContextMenu();

      expect(chrome.contextMenus.create).toHaveBeenCalledWith(
        EXT_CONSTANTS.CONTEXT_MENU.GRADE_TEXT,
      );
      expect(logMock).toHaveBeenCalledWith(
        logLevelsMock.INFO,
        "Context menu created successfully",
      );
    });
  });

  describe("Notifications", () => {
    test("should show notification", () => {
      const message = "Test notification";

      serviceWorker._test.showNotification(message);

      expect(chrome.notifications.create).toHaveBeenCalledWith(
        {
          type: "basic",
          title: EXT_CONSTANTS.EXTENSION.NAME,
          message: message,
          iconUrl: EXT_CONSTANTS.EXTENSION.ICON_PATHS.MEDIUM,
        },
        expect.any(Function),
      );
    });
  });

  describe("Context Menu Handling", () => {
    test("should handle context menu click with valid data", async () => {
      const data = { selectionText: "test" };
      const tab = { id: 1 };

      await serviceWorker._test.handleContextMenuClick(data, tab);

      expect(logMock).toHaveBeenCalledWith(
        logLevelsMock.INFO,
        "Context menu clicked",
        { selection: "test", tabId: 1 },
      );
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        [EXT_CONSTANTS.STORAGE_KEYS.LAST_WORD]: "test",
      });
      expect(chrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 1 });
    });

    test("should handle context menu click with invalid data", async () => {
      const data = {};
      const tab = {};

      await serviceWorker._test.handleContextMenuClick(data, tab);

      expect(logMock).toHaveBeenCalledWith(
        logLevelsMock.WARN,
        "Invalid context menu click data:",
        { data, tab },
      );
      expect(chrome.notifications.create).toHaveBeenCalled();
    });

    test("should handle side panel open failure gracefully", async () => {
      const data = { selectionText: "test" };
      const tab = { id: 1 };

      const err = new Error("panel failed");
      chrome.sidePanel.open.mockRejectedValueOnce(err);

      await serviceWorker._test.handleContextMenuClick(data, tab);

      // set still attempted
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        [EXT_CONSTANTS.STORAGE_KEYS.LAST_WORD]: "test",
      });

      // open failure should be logged from openSidePanel
      expect(logMock).toHaveBeenCalledWith(
        logLevelsMock.ERROR,
        "Error opening side panel:",
        err,
      );

      // openSidePanel swallows error; no outer error log or notification is expected
      const outerErrorLogged = logMock.mock.calls.some(
        ([level, text]) =>
          level === logLevelsMock.ERROR &&
          text === "Error handling context menu click:",
      );
      expect(outerErrorLogged).toBe(false);
      expect(chrome.notifications.create).not.toHaveBeenCalled();
    });
  });

  describe("Data Storage", () => {
    test("should store analysis data successfully", async () => {
      const key = "testKey";
      const data = "testData";

      await serviceWorker._test.storeAnalysisData(key, data);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({ [key]: data });
      expect(logMock).toHaveBeenCalledWith(
        logLevelsMock.INFO,
        `Data stored successfully for key: ${key}`,
      );
    });

    test("should log error when chrome.runtime.lastError is set after set", async () => {
      const key = "failKey";
      const data = "oops";
      // Simulate lastError on next check
      chrome.storage.local.set.mockImplementationOnce(async () => {
        chrome.runtime.lastError = { message: "Quota exceeded" };
      });

      await serviceWorker._test.storeAnalysisData(key, data);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ [key]: data });
      expect(logMock).toHaveBeenCalledWith(
        logLevelsMock.ERROR,
        "Error storing data:",
        chrome.runtime.lastError,
      );
      // Cleanup
      chrome.runtime.lastError = null;
    });
  });

  describe("Message Handling", () => {
    test("should handle message with valid action", async () => {
      const message = { action: "getWord" };
      const sender = {};
      const sendResponse = jest.fn();

      chrome.storage.local.get.mockResolvedValueOnce({
        [EXT_CONSTANTS.STORAGE_KEYS.LAST_WORD]: "testWord",
      });

      await serviceWorker._test.handleMessage(message, sender, sendResponse);

      expect(chrome.storage.local.get).toHaveBeenCalledWith(
        EXT_CONSTANTS.STORAGE_KEYS.LAST_WORD,
      );
      expect(sendResponse).toHaveBeenCalledWith({ lastWord: "testWord" });
    });

    test("should respond with error if message is invalid", async () => {
      const sendResponse = jest.fn();
      await serviceWorker._test.handleMessage(null, {}, sendResponse);
      expect(logMock).toHaveBeenCalledWith(
        logLevelsMock.WARN,
        "Invalid message received:",
        null,
      );
      expect(sendResponse).toHaveBeenCalledWith({ error: "Invalid message" });
    });

    test("getWord should handle storage.get lastError gracefully", async () => {
      const message = { action: "getWord" };
      const sender = {};
      const sendResponse = jest.fn();

      // Simulate lastError during get; service should still respond with undefined
      chrome.storage.local.get.mockImplementationOnce(async () => {
        chrome.runtime.lastError = { message: "internal get failure" };
        return {}; // no value returned
      });

      await serviceWorker._test.handleMessage(message, sender, sendResponse);

      expect(chrome.storage.local.get).toHaveBeenCalledWith(
        EXT_CONSTANTS.STORAGE_KEYS.LAST_WORD,
      );
      expect(sendResponse).toHaveBeenCalledWith({ lastWord: undefined });

      // It should at least log that a message was received, and not log an error for handleMessage
      expect(logMock).toHaveBeenCalledWith(
        logLevelsMock.DEBUG,
        "Message received:",
        message,
      );

      const errorLogForHandleMessage = logMock.mock.calls.some(
        ([level, text]) =>
          level === logLevelsMock.ERROR && text === "Error handling message:",
      );
      expect(errorLogForHandleMessage).toBe(false);

      // Cleanup
      chrome.runtime.lastError = null;
    });

    test("should handle message with invalid action", async () => {
      const message = { action: "invalidAction" };
      const sender = {};
      const sendResponse = jest.fn();

      await serviceWorker._test.handleMessage(message, sender, sendResponse);

      expect(logMock).toHaveBeenCalledWith(
        logLevelsMock.WARN,
        "Unknown message action:",
        "invalidAction",
      );
      expect(sendResponse).toHaveBeenCalledWith({
        error: EXT_CONSTANTS.MESSAGES.ERROR.UNKNOWN_ACTION,
      });
    });
  });

  describe("ToS Detection", () => {
    test("should handle ToS detection with valid data", async () => {
      const message = { text: "test text", action: "tosDetected" };
      const sender = { tab: { id: 1 } };

      await serviceWorker._test.handleTosDetected(message, sender);

      expect(chrome.storage.local.set).toHaveBeenCalled();
      expect(logMock).toHaveBeenCalledWith(
        logLevelsMock.INFO,
        "ToS analysis completed successfully",
      );
    });

    test("should handle ToS detection with invalid data", async () => {
      const message = {};
      const sender = {};

      await serviceWorker._test.handleTosDetected(message, sender);

      expect(logMock).toHaveBeenCalledWith(
        logLevelsMock.WARN,
        "Invalid ToS detection data:",
        { message, sender },
      );
    });
  });

  describe("Notification Checks", () => {
    test("should handle check notification with valid tab", async () => {
      const tab = { url: "https://example.com" };
      const domain = "example.com";

      const result = await serviceWorker._test.handleCheckNotification(tab);

      expect(result).toEqual({ shouldShow: false, domain });
    });

    test("should handle check notification with invalid tab", async () => {
      const tab = {};

      const result = await serviceWorker._test.handleCheckNotification(tab);

      expect(logMock).toHaveBeenCalledWith(
        logLevelsMock.WARN,
        "Invalid tab data for notification check:",
        tab,
      );
      expect(result).toEqual({ shouldShow: false, error: "Invalid tab data" });
    });
  });
});
