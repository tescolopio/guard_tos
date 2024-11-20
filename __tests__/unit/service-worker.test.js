const { createServiceWorker } = require("../../src/background/service-worker");
const { EXT_CONSTANTS } = require("../../src/utils/constants");

describe("Service Worker", () => {
  let serviceWorker;
  let logMock;
  let logLevelsMock;

  beforeEach(() => {
    logMock = jest.fn();
    logLevelsMock = EXT_CONSTANTS.DEBUG.LEVELS;

    // Mocking the chrome object
    global.chrome = {
      runtime: {
        onInstalled: {
          addListener: jest.fn(),
        },
        onMessage: {
          addListener: jest.fn(),
        },
      },
      contextMenus: {
        create: jest.fn(),
        onClicked: {
          addListener: jest.fn(),
        },
      },
      notifications: {
        create: jest.fn(),
      },
      storage: {
        local: {
          set: jest.fn(),
          get: jest.fn(),
        },
      },
      windows: {
        getCurrent: jest.fn(),
      },
      sidePanel: {
        open: jest.fn(),
      },
    };

    // Mocking global.Constants
    global.Constants = EXT_CONSTANTS;

    // Initialize the service worker with the mock log function
    serviceWorker = createServiceWorker({
      log: logMock,
      logLevels: EXT_CONSTANTS.DEBUG.LEVELS,
    });
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });

  test("should initialize the service worker", () => {
    serviceWorker.initialize();
    expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalled();
    expect(chrome.contextMenus.onClicked.addListener).toHaveBeenCalled();
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    expect(logMock).toHaveBeenCalledWith(
      EXT_CONSTANTS.DEBUG.LEVELS.INFO,
      "Service worker initialized successfully"
    );
  });

  test("should set up context menu", () => {
    serviceWorker._test.setupContextMenu();
    expect(chrome.contextMenus.create).toHaveBeenCalledWith(
      EXT_CONSTANTS.CONTEXT_MENU.GRADE_TEXT
    );
    expect(logMock).toHaveBeenCalledWith(
      logLevelsMock.INFO,
      "Context menu created successfully"
    );
  });

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
      expect.any(Function)
    );
  });

  test("should handle context menu click with valid data", async () => {
    const data = { selectionText: "test" };
    const tab = { id: 1 };
    chrome.storage.local.set.mockResolvedValueOnce();
    chrome.windows.getCurrent.mockResolvedValueOnce({
      sidePanel: { state: "closed" },
    });
    chrome.sidePanel.open.mockResolvedValueOnce();

    await serviceWorker._test.handleContextMenuClick(data, tab);

    expect(logMock).toHaveBeenCalledWith(
      EXT_CONSTANTS.DEBUG.LEVELS.INFO,
      "Context menu clicked",
      {
        selection: "test",
        tabId: 1,
      }
    );
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      [EXT_CONSTANTS.STORAGE_KEYS.LAST_WORD]: "test",
    });
    expect(chrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 1 });
    expect(logMock).toHaveBeenCalledWith(
      logLevelsMock.INFO,
      "Context menu actions completed successfully"
    );
  });

  test("should handle context menu click with invalid data", async () => {
    const data = {};
    const tab = {};

    await serviceWorker._test.handleContextMenuClick(data, tab);

    expect(logMock).toHaveBeenCalledWith(
      logLevelsMock.WARN,
      "Invalid context menu click data:",
      { data, tab }
    );
    expect(chrome.notifications.create).toHaveBeenCalled();
  });

  test("should store analysis data successfully", async () => {
    const key = "testKey";
    const data = "testData";
    chrome.storage.local.set.mockResolvedValueOnce();

    await serviceWorker._test.storeAnalysisData(key, data);

    expect(chrome.storage.local.set).toHaveBeenCalledWith({ [key]: data });
    expect(logMock).toHaveBeenCalledWith(
      logLevelsMock.INFO,
      `Data stored successfully for key: ${key}`
    );
  });

  test("should handle message with valid action", async () => {
    const message = { action: "getWord" };
    const sender = {};
    const sendResponse = jest.fn();
    chrome.storage.local.get.mockResolvedValueOnce({
      [EXT_CONSTANTS.STORAGE_KEYS.LAST_WORD]: "testWord",
    });

    await serviceWorker._test.handleMessage(message, sender, sendResponse);

    expect(chrome.storage.local.get).toHaveBeenCalledWith(
      EXT_CONSTANTS.STORAGE_KEYS.LAST_WORD
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
      "invalidAction"
    );
    expect(sendResponse).toHaveBeenCalledWith({
      error: EXT_CONSTANTS.MESSAGES.ERROR.UNKNOWN_ACTION,
    });
  });

  test("should handle ToS detection with valid data", async () => {
    const message = { text: "test text" };
    const sender = { tab: { id: 1 } };
    const analyzeContentMock = jest.fn().mockResolvedValueOnce({});
    serviceWorker._test.analyzeContent = analyzeContentMock;
    chrome.storage.local.set.mockResolvedValueOnce();

    await serviceWorker._test.handleTosDetected(message, sender);

    expect(analyzeContentMock).toHaveBeenCalledWith("test text");
    expect(chrome.storage.local.set).toHaveBeenCalled();
    expect(logMock).toHaveBeenCalledWith(
      logLevelsMock.INFO,
      "ToS analysis completed successfully"
    );
  });

  test("should handle ToS detection with invalid data", async () => {
    const message = {};
    const sender = {};

    await serviceWorker._test.handleTosDetected(message, sender);

    expect(logMock).toHaveBeenCalledWith(
      logLevelsMock.WARN,
      "Invalid ToS detection data:",
      { message, sender }
    );
  });

  test("should handle check notification with valid tab", async () => {
    const tab = { url: "https://example.com" };
    const domain = "example.com";
    const result = await serviceWorker._test.handleCheckNotification(tab);

    expect(result).toEqual({ shouldShow: false, domain: domain });
  });

  test("should handle check notification with invalid tab", async () => {
    const tab = {};
    const result = await serviceWorker._test.handleCheckNotification(tab);

    expect(logMock).toHaveBeenCalledWith(
      logLevelsMock.WARN,
      "Invalid tab data for notification check:",
      tab
    );
    expect(result).toEqual({ shouldShow: false, error: "Invalid tab data" });
  });
});
