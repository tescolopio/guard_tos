import { mockChromeAPI } from './mockData';

export const setupChromeEnvironment = () => {
  global.chrome = mockChromeAPI;

  // Setup mock analyzers
  global.RightsAssessor = {
    create: jest.fn().mockReturnValue({
      analyzeContent: jest.fn().mockResolvedValue('rightsAnalysis'),
    }),
  };

  global.TosSummarizer = {
    create: jest.fn().mockReturnValue({}),
  };

  global.TextExtractor = {
    create: jest.fn().mockReturnValue({
      extractAndAnalyzePageText: jest.fn().mockResolvedValue({
        metadata: { legalTermCount: 5 },
        text: 'sample text',
      }),
      extractText: jest.fn().mockReturnValue('cached text'),
    }),
  };

  global.UncommonWordsIdentifier = {
    create: jest.fn().mockReturnValue({
      identifyUncommonWords: jest.fn().mockResolvedValue('uncommonWords'),
    }),
  };
};

// Initialize chrome environment
setupChromeEnvironment();
