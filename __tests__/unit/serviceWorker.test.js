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
      const message = { text: "test text" };
      const sender = { tab: { id: 1 } };
      const analyzeContentMock = jest.fn().mockResolvedValueOnce({});
      serviceWorker._test.analyzeContent = analyzeContentMock;

      await serviceWorker._test.handleTosDetected(message, sender);

      expect(analyzeContentMock).toHaveBeenCalledWith("test text");
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
