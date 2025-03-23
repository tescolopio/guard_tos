// __tests__/helpers/mockData.js

/**
 * Mock data for testing Terms Guardian extension
 */

// Mock legal text samples
const mockLegalText = {
  simple: {
    text: "This is a basic Terms of Service agreement. Users agree to share data.",
    expectedScore: 75,
    expectedRights: ["privacy", "data_collection"],
    metadata: {
      legalTermCount: 15,
      wordCount: 200,
      readabilityScore: 75,
    },
  },
  complex: {
    text: "Pursuant to Section 7(a) of the aforementioned agreement, the party hereinafter...",
    expectedScore: 35,
    expectedRights: ["intellectual_property", "liability"],
    metadata: {
      legalTermCount: 25,
      wordCount: 300,
      readabilityScore: 35,
    },
  },
};

// Mock analysis results
const mockAnalysisResults = {
  readability: {
    score: 75,
    grade: "B",
    suggestions: ["Simplify sentence structure", "Use more common words"],
  },
  rights: {
    score: 65,
    concerns: ["Data collection", "Third-party sharing"],
    recommendations: [
      "Review privacy implications",
      "Check data sharing terms",
    ],
  },
  uncommonWords: [
    {
      word: "pursuant",
      definition: "In accordance with",
      frequency: "legal",
    },
    {
      word: "aforementioned",
      definition: "Previously mentioned",
      frequency: "legal",
    },
  ],
};

// Mock DOM structures
const mockDOMStructures = {
  legalSection: `
    <div class="terms-of-service">
      <h1>Terms of Service</h1>
      <div class="content">
        ${mockLegalText.simple.text}
      </div>
    </div>
  `,
  nonLegalSection: `
    <div class="about-us">
      <h1>About Our Company</h1>
      <p>We are committed to excellence...</p>
    </div>
  `,
};

// Mock Chrome API
const mockChromeAPI = {
  runtime: {
    getURL: jest.fn((path) => `chrome-extension://mock-id/${path}`),
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListeners: jest.fn(),
    },
  },
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    },
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
    setIcon: jest.fn(),
  },
  sidePanel: {
    open: jest.fn(),
    close: jest.fn(),
    getOptions: jest.fn(),
  },
  tabs: {
    query: jest.fn().mockResolvedValue([{ id: 1 }]),
    sendMessage: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  scripting: {
    executeScript: jest.fn(),
  },
};

// Mock analyzers responses
const mockAnalyzers = {
  RightsAssessor: {
    create: jest.fn().mockReturnValue({
      analyzeContent: jest.fn().mockResolvedValue(mockAnalysisResults.rights),
    }),
  },
  TosSummarizer: {
    create: jest.fn().mockReturnValue({
      generateSummary: jest.fn().mockResolvedValue("Summary of terms"),
    }),
  },
  TextExtractor: {
    create: jest.fn().mockReturnValue({
      extractAndAnalyzePageText: jest.fn().mockResolvedValue({
        metadata: { legalTermCount: 5 },
        text: mockLegalText.simple.text,
      }),
      extractText: jest.fn().mockReturnValue(mockLegalText.simple.text),
    }),
  },
  UncommonWordsIdentifier: {
    create: jest.fn().mockReturnValue({
      identifyUncommonWords: jest
        .fn()
        .mockResolvedValue(
          mockAnalysisResults.uncommonWords.map((w) => w.word),
        ),
    }),
  },
};

// Mock extension messages
const mockMessages = {
  tosDetected: {
    type: "tosDetected",
    text: mockLegalText.simple.text,
    analysis: {
      rights: mockAnalysisResults.rights,
      uncommonWords: mockAnalysisResults.uncommonWords.map((w) => w.word),
      timestamp: "2024-03-18T12:00:00.000Z",
    },
  },
  analyzeRequest: {
    type: "analyzeRequest",
    text: mockLegalText.simple.text,
  },
  analysisComplete: {
    type: "analysisComplete",
    analysis: {
      rights: mockAnalysisResults.rights,
      uncommonWords: mockAnalysisResults.uncommonWords.map((w) => w.word),
      timestamp: "2024-03-18T12:00:00.000Z",
    },
  },
};

// Export all mocks
module.exports = {
  mockLegalText,
  mockAnalysisResults,
  mockDOMStructures,
  mockChromeAPI,
  mockAnalyzers,
  mockMessages,
  // Helper function to get fresh copies of mutable objects
  getMockChromeAPI: () => JSON.parse(JSON.stringify(mockChromeAPI)),
  getMockAnalyzers: () => JSON.parse(JSON.stringify(mockAnalyzers)),
  getMockMessages: () => JSON.parse(JSON.stringify(mockMessages)),
};
