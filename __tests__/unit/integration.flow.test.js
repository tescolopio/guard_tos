/**
 * Integration-ish test: content -> background(service worker) -> panel flow
 * Uses mocks from helpers to simulate messaging and storage.
 */

/** @jest-environment node */

const path = require("path");
const {
  setupChromeEnvironment,
  resetChromeEnvironment,
  simulateChromeMessage,
} = require("../helpers/chromeSetup");
const { getMockMessages } = require("../helpers/mockData");
const { EXT_CONSTANTS } = require("../../src/utils/constants");

// Ensure fresh modules per test
jest.isolateModules(() => {});

describe("Content → Background → Panel flow", () => {
  beforeEach(() => {
    setupChromeEnvironment();
    jest.resetModules();
  });

  afterEach(() => {
    resetChromeEnvironment();
    jest.resetModules();
  });

  test("content sends tosDetected, background stores results and opens side panel", async () => {
    // Provide minimal service worker global scope
    global.self = { addEventListener: jest.fn() };

    // Load background service worker (auto-initialize due to chrome.runtime.id)
    require(path.resolve(__dirname, "../../src/background/serviceWorker.js"));

    // Simulate message from content to background with service worker message API
    const sender = { tab: { id: 1 } };
    await simulateChromeMessage(
      { action: "tosDetected", text: "sample terms text" },
      sender,
    );

    // Background should have stored analysis results for the tab and triggered a notification
    expect(global.chrome.storage.local.set).toHaveBeenCalled();
    const setArgs = global.chrome.storage.local.set.mock.calls.map((c) => c[0]);
    const expectedKeyPrefix = `${EXT_CONSTANTS.STORAGE_KEYS.ANALYSIS_RESULTS}_1`;
    const hasAnalysisKey = setArgs.some((obj) =>
      Object.keys(obj).some((k) => k === expectedKeyPrefix),
    );
    expect(hasAnalysisKey).toBe(true);

    expect(global.chrome.notifications.create).toHaveBeenCalled();
  });

  test("background getWord returns last stored word (integration)", async () => {
    // Provide minimal service worker global scope
    global.self = { addEventListener: jest.fn() };

    // Load background service worker (auto-initialize due to chrome.runtime.id)
    require(path.resolve(__dirname, "../../src/background/serviceWorker.js"));

    // Make storage stateful for this test
    const storageState = {};
    global.chrome.storage.local.set = jest
      .fn()
      .mockImplementation(async (obj) => Object.assign(storageState, obj));
    global.chrome.storage.local.get = jest
      .fn()
      .mockImplementation(async (key) => {
        if (typeof key === "string") return { [key]: storageState[key] };
        if (Array.isArray(key)) {
          return key.reduce((acc, k) => ((acc[k] = storageState[k]), acc), {});
        }
        return { ...storageState };
      });

    // Seed LAST_WORD and verify via message round-trip
    const lastWordKey = EXT_CONSTANTS.STORAGE_KEYS.LAST_WORD;
    await global.chrome.storage.local.set({ [lastWordKey]: "integrationWord" });

    const response = await simulateChromeMessage({ action: "getWord" });
    expect(global.chrome.storage.local.get).toHaveBeenCalledWith(lastWordKey);
    expect(response).toEqual({ lastWord: "integrationWord" });
  });
});
