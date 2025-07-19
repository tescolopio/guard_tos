// __tests__/unit/debugger.test.js
const { createDebugger } = require("../../src/utils/debugger");
const { EXT_CONSTANTS } = require("../../src/utils/constants");

describe("Debugger Utility", () => {
  let debugInstance;
  let mockStorage;

  beforeEach(() => {
    // Mock storage data
    mockStorage = {
      debugLogs: [],
      performanceMetrics: {},
    };

    // Mock chrome storage
    global.chrome = {
      storage: {
        local: {
          get: jest
            .fn()
            .mockImplementation((key) =>
              Promise.resolve({ [key]: mockStorage[key] }),
            ),
          set: jest.fn().mockImplementation((data) => {
            Object.assign(mockStorage, data);
            return Promise.resolve();
          }),
          remove: jest.fn().mockResolvedValue(undefined),
        },
      },
    };

    // Mock console
    global.console = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      group: jest.fn(),
      groupEnd: jest.fn(),
      trace: jest.fn(),
    };

    // Ensure performance.now is a Jest mock and not overwritten
    if (!global.performance) {
      global.performance = {};
    }
    Object.defineProperty(global.performance, "now", {
      value: jest.fn(),
      writable: true,
      configurable: true,
    });

    debugInstance = createDebugger({
      LOG_TO_CONSOLE: true,
      LOG_TO_STORAGE: true,
      TRACK_PERFORMANCE: true,
    });

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test("should log a message with INFO level", async () => {
    await debugInstance.info("Test info message");
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("Test info message"),
    );
  });

  test("should save log to storage", async () => {
    await debugInstance.info("Test info message");

    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        [EXT_CONSTANTS.DEBUG.STORAGE.KEY]: expect.arrayContaining([
          expect.objectContaining({
            message: "Test info message",
            level: "INFO",
          }),
        ]),
      }),
    );
  });

  test("should format data with circular references", () => {
    const circularObj = {};
    circularObj.self = circularObj;
    const formattedData = debugInstance.config.formatData(circularObj);
    expect(formattedData).toContain("[Circular Reference]");
  });

  test("should save performance metric", async () => {
    // Guarantee performance.now is a Jest mock
    expect(jest.isMockFunction(performance.now)).toBe(true);
    // Setup performance.now mock to return different values
    performance.now.mockReturnValueOnce(0); // Start time
    performance.now.mockReturnValueOnce(100); // End time

    debugInstance.startTimer("testLabel");
    jest.advanceTimersByTime(100);
    const duration = await debugInstance.endTimer("testLabel");

    // Debug output for diagnosis
    const metrics = await chrome.storage.local.get(
      EXT_CONSTANTS.STORAGE_KEYS.PERFORMANCE_METRICS,
    );
    // Uncomment for debugging: console.log('Saved metrics:', metrics);

    expect(duration).toBe(100);
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        [EXT_CONSTANTS.STORAGE_KEYS.PERFORMANCE_METRICS]: expect.any(Object),
      }),
    );
  });

  test("should get performance analytics", async () => {
    // Setup initial performance data
    await chrome.storage.local.set({
      [EXT_CONSTANTS.STORAGE_KEYS.PERFORMANCE_METRICS]: {
        testLabel: {
          count: 1,
          total: 100,
          min: 100,
          max: 100,
          samples: [
            {
              timestamp: new Date().toISOString(),
              duration: 100,
            },
          ],
        },
      },
    });

    // Debug output for diagnosis
    const metrics = await chrome.storage.local.get(
      EXT_CONSTANTS.STORAGE_KEYS.PERFORMANCE_METRICS,
    );
    // Uncomment for debugging: console.log('Analytics metrics:', metrics);

    const analytics = await debugInstance.getPerformanceAnalytics("testLabel");

    // Uncomment for debugging: console.log('Analytics result:', analytics);

    expect(analytics).toEqual(
      expect.objectContaining({
        count: 1,
        total: 100,
        average: 100,
        min: 100,
        max: 100,
        samples: expect.any(Array),
        recentSamples: expect.any(Array),
        analysisTimestamp: expect.any(String),
        threshold: expect.any(Number),
      }),
    );
  });

  test("should handle log groups", async () => {
    debugInstance.startLogGroup("testGroup");
    await debugInstance.info("Test info message in group");
    debugInstance.endLogGroup();

    // Debug output for diagnosis
    // Uncomment for debugging: console.log('console.info calls:', console.info.mock.calls);

    expect(console.group).toHaveBeenCalledWith("testGroup");
    expect(console.groupEnd).toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("Test info message in group"),
    );
  });

  test("should clear logs", async () => {
    await debugInstance.clearLogs();
    expect(chrome.storage.local.remove).toHaveBeenCalledWith([
      EXT_CONSTANTS.DEBUG.STORAGE.KEY,
      EXT_CONSTANTS.STORAGE_KEYS.PERFORMANCE_METRICS,
    ]);
  });

  test("should export logs", async () => {
    // Setup some mock data
    mockStorage = {
      [EXT_CONSTANTS.DEBUG.STORAGE.KEY]: [
        { message: "Test log", level: "INFO" },
      ],
      [EXT_CONSTANTS.STORAGE_KEYS.PERFORMANCE_METRICS]: {
        testMetric: { count: 1 },
      },
    };

    const exportData = await debugInstance.exportLogs();
    const parsedData = JSON.parse(exportData);

    expect(parsedData).toEqual(
      expect.objectContaining({
        logs: expect.any(Array),
        metrics: expect.any(Object),
        exportDate: expect.any(String),
        config: expect.any(Object),
      }),
    );
  });
});
