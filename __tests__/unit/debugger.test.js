const { createDebugger } = require('../../src/utils/debugger');
const { EXT_CONSTANTS } = require('../../src/utils/constants');

describe('Debugger Utility', () => {
    let debugInstance;

    beforeEach(() => {
        global.chrome = {
            storage: {
                local: {
                    get: jest.fn().mockResolvedValue({}),
                    set: jest.fn().mockResolvedValue(),
                    remove: jest.fn().mockResolvedValue()
                }
            }
        };
        debugInstance = createDebugger.call({ Constants: EXT_CONSTANTS });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should log a message with INFO level', async () => {
        const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
        await debugInstance.info('Test info message');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test info message'));
    });

    test('should save log to storage', async () => {
        await debugInstance.info('Test info message');
        expect(chrome.storage.local.set).toHaveBeenCalledWith(expect.objectContaining({
            debugLogs: expect.any(Array)
        }));
    });

    test('should format data with circular references', () => {
        const circularObj = {};
        circularObj.self = circularObj;
        const formattedData = debugInstance.config.formatData(circularObj);
        expect(formattedData).toContain('[Circular Reference]');
    });

    test('should save performance metric', async () => {
        await debugInstance.startTimer('testLabel');
        await new Promise(resolve => setTimeout(resolve, 10));
        const duration = await debugInstance.endTimer('testLabel');
        expect(duration).toBeGreaterThan(0);
        expect(chrome.storage.local.set).toHaveBeenCalledWith(expect.objectContaining({
            performanceMetrics: expect.any(Object)
        }));
    });

    test('should get performance analytics', async () => {
        await debugInstance.startTimer('testLabel');
        await new Promise(resolve => setTimeout(resolve, 10));
        await debugInstance.endTimer('testLabel');
        const analytics = await debugInstance.getPerformanceAnalytics('testLabel');
        expect(analytics).toHaveProperty('average');
        expect(analytics).toHaveProperty('recentSamples');
    });

    test('should clear logs', async () => {
        await debugInstance.clearLogs();
        expect(chrome.storage.local.remove).toHaveBeenCalledWith([
            EXT_CONSTANTS.DEBUG.STORAGE.KEY,
            EXT_CONSTANTS.STORAGE_KEYS.PERFORMANCE_METRICS
        ]);
    });

    test('should export logs', async () => {
        const exportData = await debugInstance.exportLogs();
        expect(exportData).toContain('logs');
        expect(exportData).toContain('metrics');
    });

    test('should handle log groups', async () => {
        const consoleGroupSpy = jest.spyOn(console, 'group').mockImplementation();
        const consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();
        debugInstance.startLogGroup('testGroup');
        await debugInstance.info('Test info message in group');
        debugInstance.endLogGroup();
        expect(consoleGroupSpy).toHaveBeenCalledWith('testGroup');
        expect(consoleGroupEndSpy).toHaveBeenCalled();
    });
});
