import { EXT_CONSTANTS } from '../src/utils/constants';
import ContentController from '../src/content/content';
import {
  setupTestDOM,
  resetAllMocks,
  setupChromeAPI,
  wait
} from '../helpers/testUtils';
import {
  mockAnalysisResults,
  mockLegalText,
  mockChromeAPI,
} from '../helpers/mockData';
import '../helpers/chromeSetup';
const { expect } = require('@jest/globals');

describe('ContentController', () => {
  let controller;
  let mockLog;
  let mockLogLevels;

  beforeEach(() => {
    // Setup test DOM
    setupTestDOM();

    // Setup mocks
    mockLog = jest.fn();
    mockLogLevels = EXT_CONSTANTS.DEBUG.LEVELS;

    // Setup Chrome API mock
    setupChromeAPI(mockChromeAPI);

    // Mock global analyzers
    global.RightsAssessor = {
      create: jest.fn().mockReturnValue({
        analyzeContent: jest.fn().mockResolvedValue(mockAnalysisResults.rights),
      }),
    };

    global.TosSummarizer = {
      create: jest.fn().mockReturnValue({
        generateSummary: jest.fn().mockResolvedValue('Summary of terms'),
      }),
    };

    global.TextExtractor = {
      create: jest.fn().mockReturnValue({
        extractAndAnalyzePageText: jest.fn().mockResolvedValue({
          metadata: { legalTermCount: 5 },
          text: mockLegalText.simple.text,
        }),
        extractText: jest.fn().mockReturnValue(mockLegalText.simple.text),
      }),
    };

    global.UncommonWordsIdentifier = {
      create: jest.fn().mockReturnValue({
        identifyUncommonWords: jest
          .fn()
          .mockResolvedValue(['pursuant', 'aforementioned', 'hereinafter']),
      }),
    };

    // Initialize controller
    controller = new ContentController({
      log: mockLog,
      logLevels: mockLogLevels,
    });
  });

  afterEach(() => {
    resetAllMocks();
    jest.clearAllTimers();
  });

  describe('Initialization', () => {
    test('should initialize analyzers successfully', () => {
      expect(global.RightsAssessor.create).toHaveBeenCalled();
      expect(global.TosSummarizer.create).toHaveBeenCalled();
      expect(global.TextExtractor.create).toHaveBeenCalled();
      expect(global.UncommonWordsIdentifier.create).toHaveBeenCalled();
      expect(mockLog).toHaveBeenCalledWith(
        mockLogLevels.INFO,
        'All analyzers initialized successfully',
      );
    });

    test('should initialize content script when document is ready', () => {
      document.readyState = 'complete';
      controller.initialize();
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
      expect(mockLog).toHaveBeenCalledWith(
        mockLogLevels.INFO,
        'Content script initialized',
      );
    });

    test('should wait for document to complete before initializing', async () => {
      document.readyState = 'loading';
      controller.initialize();
      expect(chrome.runtime.onMessage.addListener).not.toHaveBeenCalled();

      // Simulate document completing loading
      document.readyState = 'complete';
      document.dispatchEvent(new Event('readystatechange'));

      await wait(0);
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    });
  });

  describe('Extension Icon Management', () => {
    test('should update extension icon with exclamation mark', () => {
      controller.updateExtensionIcon(true);
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '!' });
      expect(mockLog).toHaveBeenCalledWith(
        mockLogLevels.INFO,
        'Extension badge set',
      );
    });

    test('should update extension icon without exclamation mark', () => {
      controller.updateExtensionIcon(false);
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
      expect(mockLog).toHaveBeenCalledWith(
        mockLogLevels.INFO,
        'Extension badge cleared',
      );
    });
  });

  describe('Legal Agreement Detection', () => {
    test('should handle high legal term count', async () => {
      const text = mockLegalText.simple.text;
      await controller.handleHighLegalTermCount(text);

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'tosDetected',
        text: text,
        analysis: {
          rights: mockAnalysisResults.rights,
          uncommonWords: ['pursuant', 'aforementioned', 'hereinafter'],
          timestamp: expect.any(String),
        },
      });
    });

    test('should handle moderate legal term count', () => {
      controller.handleModerateLegalTermCount();
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '!' });
    });

    test('should detect and handle high count legal agreements', async () => {
      controller.extractor.extractAndAnalyzePageText.mockResolvedValueOnce({
        metadata: {
          legalTermCount: EXT_CONSTANTS.DETECTION.THRESHOLDS.AUTO_GRADE + 1,
        },
        text: mockLegalText.complex.text,
      });

      await controller.detectLegalAgreements();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'tosDetected',
        text: mockLegalText.complex.text,
        analysis: {
          rights: mockAnalysisResults.rights,
          uncommonWords: ['pursuant', 'aforementioned', 'hereinafter'],
          timestamp: expect.any(String),
        },
      });
    });

    test('should detect and handle moderate count legal agreements', async () => {
      controller.extractor.extractAndAnalyzePageText.mockResolvedValueOnce({
        metadata: {
          legalTermCount: EXT_CONSTANTS.DETECTION.THRESHOLDS.NOTIFY + 1,
        },
        text: mockLegalText.simple.text,
      });

      await controller.detectLegalAgreements();
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '!' });
    });

    test('should detect and handle low count legal agreements', async () => {
      controller.extractor.extractAndAnalyzePageText.mockResolvedValueOnce({
        metadata: {
          legalTermCount: EXT_CONSTANTS.DETECTION.THRESHOLDS.NOTIFY - 1,
        },
        text: mockLegalText.simple.text,
      });

      await controller.detectLegalAgreements();
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });

    test('should handle extraction errors gracefully', async () => {
      const error = new Error('Extraction failed');
      controller.extractor.extractAndAnalyzePageText.mockRejectedValueOnce(
        error,
      );

      await controller.detectLegalAgreements();

      expect(mockLog).toHaveBeenCalledWith(
        mockLogLevels.ERROR,
        'Error detecting legal agreements:',
        error,
      );
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });
  });

  describe('Message Handling', () => {
    test('should handle analyze request messages', async () => {
      const message = {
        type: 'analyzeRequest',
        text: mockLegalText.simple.text,
      };

      await controller.handleMessage(message);

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'analysisComplete',
        analysis: {
          rights: mockAnalysisResults.rights,
          uncommonWords: ['pursuant', 'aforementioned', 'hereinafter'],
          timestamp: expect.any(String),
        },
      });
    });

    test('should ignore unknown message types', async () => {
      const message = {
        type: 'unknown',
        data: 'test',
      };

      await controller.handleMessage(message);

      expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
      expect(mockLog).not.toHaveBeenCalled();
    });
  });
});
