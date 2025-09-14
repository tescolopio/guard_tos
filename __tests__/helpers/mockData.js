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

// Mock Chrome API factory function
const getMockChromeAPI = () => {
  // Use jest.fn() if available, otherwise create a simple mock function
  const mockFn =
    typeof jest !== "undefined"
      ? jest.fn
      : () => {
          const fn = function () {};
          fn.mockReturnValue = () => fn;
          fn.mockResolvedValue = () => fn;
          fn.mockImplementation = () => fn;
          return fn;
        };

  return {
    runtime: {
      getURL: mockFn().mockImplementation(
        (path) => `chrome-extension://mock-id/${path}`,
      ),
      sendMessage: mockFn(),
      onMessage: {
        addListener: mockFn(),
        removeListener: mockFn(),
        hasListeners: mockFn(),
      },
      onInstalled: {
        addListener: mockFn(),
      },
      lastError: null,
      getManifest: mockFn().mockReturnValue({ version: "1.0.0" }),
    },
    contextMenus: {
      create: mockFn(),
      onClicked: {
        addListener: mockFn(),
        removeListener: mockFn(),
      },
    },
    notifications: {
      create: mockFn().mockImplementation((options, callback) =>
        callback?.("notificationId"),
      ),
    },
    storage: {
      local: {
        get: mockFn().mockResolvedValue({}),
        set: mockFn().mockResolvedValue(undefined),
        remove: mockFn().mockResolvedValue(undefined),
      },
    },
    action: {
      setBadgeText: mockFn(),
      setBadgeBackgroundColor: mockFn(),
      setIcon: mockFn(),
      onClicked: {
        addListener: mockFn(),
        removeListener: mockFn(),
      },
    },
    windows: {
      getCurrent: mockFn().mockResolvedValue({
        sidePanel: { state: "closed" },
      }),
    },
    sidePanel: {
      open: mockFn(),
      close: mockFn(),
      getOptions: mockFn(),
    },
    tabs: {
      query: mockFn().mockResolvedValue([{ id: 1 }]),
      sendMessage: mockFn(),
      create: mockFn(),
      update: mockFn(),
    },
    scripting: {
      executeScript: mockFn(),
    },
  };
};

// Mock analyzers responses factory function
const getMockAnalyzers = () => {
  // Use jest.fn() if available, otherwise create a simple mock function
  const mockFn =
    typeof jest !== "undefined"
      ? jest.fn
      : () => {
          const fn = function () {};
          fn.mockReturnValue = () => fn;
          fn.mockResolvedValue = () => fn;
          fn.mockImplementation = () => fn;
          return fn;
        };

  return {
    ReadabilityGrader: {
      create: mockFn().mockReturnValue({
        calculateReadabilityGrade: mockFn().mockResolvedValue({
          score: 75,
          grade: "B",
        }),
      }),
    },
    RightsAssessor: {
      create: mockFn().mockReturnValue({
        analyzeContent: mockFn().mockResolvedValue(mockAnalysisResults.rights),
      }),
    },
    TosSummarizer: {
      create: mockFn().mockReturnValue({
        generateSummary: mockFn().mockResolvedValue("Summary of terms"),
        summarizeTos: mockFn().mockResolvedValue("Summary of terms"),
      }),
    },
    TextExtractor: {
      create: mockFn().mockReturnValue({
        extractAndAnalyzePageText: mockFn().mockResolvedValue({
          metadata: { legalTermCount: 5 },
          text: mockLegalText.simple.text,
        }),
        extractText: mockFn().mockReturnValue(mockLegalText.simple.text),
      }),
    },
    UncommonWordsIdentifier: {
      create: mockFn().mockReturnValue({
        identifyUncommonWords: mockFn().mockResolvedValue(
          mockAnalysisResults.uncommonWords.map((w) => w.word),
        ),
      }),
    },
  };
};

// Mock extension messages factory function
const getMockMessages = () => ({
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
});

// Export all mocks
module.exports = {
  mockLegalText,
  mockAnalysisResults,
  mockDOMStructures,
  getMockChromeAPI,
  getMockAnalyzers,
  getMockMessages,
};
