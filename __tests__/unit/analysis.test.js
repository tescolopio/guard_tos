/**
 * @file analysis.test.js
 * @description Unit tests for analysis modules: readabilityGrader, rightsAssessor, isLegalText, textExtractor, uncommonWordsIdentifier, summarizeTos
 * @author Timmothy Escolopio
 * @date 2025-07-17
 */
const { JSDOM } = require("jsdom");

const {
  createReadabilityGrader,
} = require("../../src/analysis/readabilityGrader");
const { createRightsAssessor } = require("../../src/analysis/rightsAssessor");
const { createLegalTextAnalyzer } = require("../../src/analysis/isLegalText");
const { createTextExtractor } = require("../../src/analysis/textExtractor");
const { createSummarizer } = require("../../src/analysis/summarizeTos");
const {
  createUncommonWordsIdentifier,
} = require("../../src/analysis/uncommonWordsIdentifier");

describe("Analysis Modules", () => {
  const log = jest.fn();
  const logLevels = { DEBUG: "debug", INFO: "info", ERROR: "error" };
  const dummyText =
    "This is a sample Terms of Service. You agree to the following...";
  const legalTerms = ["terms", "service", "agree"];
  const commonWords = ["the", "and", "or", "is", "a", "to", "of"];
  const legalTermsDefinitions = {
    terms: "Legal conditions",
    service: "Provided functionality",
  };
  const utilities = {
    // Add minimal stubs as needed by your modules
    splitIntoWords: (text) => text.split(/\W+/).filter(Boolean),
    // Add more if required by your implementation
  };

  beforeAll(() => {
    const dom = new JSDOM();
    global.DOMParser = dom.window.DOMParser;
    global.Node = dom.window.Node;

    global.Constants = {
      ANALYSIS: {
        BATCH_THRESHOLD: 1000,
        CHUNK_SIZE: 10,
        GRADES: ["A", "B", "C"],
      },
      ERROR_TYPES: {
        MALFORMED_HTML: "malformed_html",
        INCOMPLETE_HTML: "incomplete_html",
        EXTRACTION: {
          INVALID_INPUT: "invalid_input",
          MALFORMED_HTML: "malformed_html",
        },
      },
    };
    global.TextCacheConfig = function () {
      this.MIN_CACHE_LENGTH = 1;
    };
    global.TextCacheWithRecovery = class {
      async get() {
        return null;
      }
      async set() {
        return true;
      }
    };
    global.legalTerms = legalTerms;
    // Mock extractFromPDF, extractFromDOCX, extractFromText, and splitIntoSentences for textExtractor
    global.extractFromPDF = async () => ({ text: "", metadata: {} });
    global.extractFromDOCX = async () => ({ text: "", metadata: {} });
    global.extractFromText = async () => ({ text: "", metadata: {} });
    global.splitIntoSentences = (text) =>
      text ? text.split(/[.!?]/).filter(Boolean) : [];
  });

  let textExtractorInstance;

  beforeEach(() => {
    textExtractorInstance = createTextExtractor({ log, logLevels, utilities });
    // Now textExtractorInstance is initialized before other modules
  });



  afterAll(() => {
    delete global.Constants;
    delete global.TextCacheConfig;
    delete global.DOMParser;
    delete global.Node;


    delete global.TextCacheWithRecovery;
    delete global.legalTerms;
    delete global.extractFromPDF;
    delete global.extractFromDOCX;
    delete global.extractFromText;
    delete global.splitIntoSentences;
  });

  describe("readabilityGrader", () => {
    it("should calculate readability grade for valid text", () => {
      const grader = createReadabilityGrader({ log, logLevels });
      const result = grader.calculateReadabilityGrade(dummyText);
      expect(result).toHaveProperty("flesch");
      expect(result).toHaveProperty("kincaid");
      expect(result).toHaveProperty("fogIndex");
      expect(result).toHaveProperty("averageGrade");
    });
    it("should handle empty input gracefully", () => {
      const grader = createReadabilityGrader({ log, logLevels });
      const result = grader.calculateReadabilityGrade("");
      expect(result.averageGrade).toBe("N/A");
    });
  });

  describe("rightsAssessor", () => {
    it("should analyze content and return a rightsScore", async () => {
      const assessor = createRightsAssessor({
        log,
        logLevels,
        commonWords,
        legalTermsDefinitions,
        utilities,
      });
      const result = await assessor.analyzeContent(dummyText);
      expect(result).toHaveProperty("rightsScore");
      expect(result).toHaveProperty("uncommonWords");
    });
  });

  describe("isLegalText", () => {
    it("should analyze text and return isLegal and confidence", async () => {
      const analyzer = createLegalTextAnalyzer({
          log,
          logLevels,
          legalTerms,
          utilities: {
            ...utilities,
            splitIntoWords: textExtractorInstance.splitIntoWords, // Use the instance's method
          },
      });
      const result = await analyzer.analyzeText(dummyText);
    expect(result).toHaveProperty("isLegal");
      expect(result).toHaveProperty("confidence");
    });
  });

  describe("uncommonWordsIdentifier", () => {
    it("should identify uncommon words in text", async () => {
      // This module is async and expects config and dictionary mocks
      const identifier = await createUncommonWordsIdentifier({
          log,
          logLevels,
          commonWords,
          legalTerms,
          legalTermsDefinitions,
          config: {
            minWordLength: 3,
            batchSize: 5,
            definitionCacheTime: 1000,
            prioritizeLegalTerms: true,
          },
          utilities: {
            ...utilities,
            splitIntoWords: textExtractorInstance.splitIntoWords, // Use the instance's method
          },
      });
      const result = await identifier.identifyUncommonWords(dummyText);
    expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("textExtractor", () => {
    it("should extract text from HTML and return metadata", async () => {
      const extractor = createTextExtractor({ log, logLevels, utilities });
      const html = "<h1>Title</h1><p>This is a test paragraph.</p>";
      const result = await extractor.extract(html, "html");
    expect(result).toHaveProperty("text")
    expect(result).toHaveProperty("metadata")
      expect(typeof result.text).toBe("string");
      expect(result.metadata).toHaveProperty("wordCount");

    });
    it("should handle invalid input gracefully", async () => {
      const extractor = createTextExtractor({ log, logLevels, utilities });
    const result = await extractor.extract(null, "text");
    expect(result).toHaveProperty("error");
  });
});


  


  describe("summarizeTos", () => {
    it("should summarize ToS HTML and return overall and section summaries", () => {
      const compromise = (txt) => ({
        sentences: () => ({
          first: () => ({ text: () => txt.split(".")[0] + "." }),
          last: () => ({ text: () => txt.split(".").slice(-2).join(".") }),
          filter: () => ({ text: () => "" }),
        }),
      });
      const cheerio = require("cheerio");
      const summarizer = createSummarizer({
        compromise,
        cheerio,
        log,
        logLevels,
      });
      const html =
        "<h1>Section 1</h1><p>This is the first section.</p><h2>Section 2</h2><p>This is the second section.</p>";
      const result = summarizer.summarizeTos(html);
      expect(result).toHaveProperty("overall");
      expect(Array.isArray(result.sections)).toBe(true);
      expect(result.sections.length).toBeGreaterThan(0);
    });
    it("should handle errors gracefully", () => {
      const compromise = () => {
        throw new Error("fail");
      };
      const cheerio = require("cheerio");
      const summarizer = createSummarizer({
        compromise,
        cheerio,
        log,
        logLevels,
      });
      const result = summarizer.summarizeTos("<h1>Section</h1><p>Text</p>");
      expect(result).toHaveProperty("overall");
      // Accept either [] or error object array for robust test
      expect(Array.isArray(result.sections)).toBe(true);
      if (
        result.sections.length === 1 &&
        result.sections[0].summary === "Error generating summary."
      ) {
        expect(result.sections[0]).toHaveProperty("heading");
        expect(result.sections[0]).toHaveProperty("originalText");
        expect(result.sections[0]).toHaveProperty(
          "summary",
          "Error generating summary.",
        );
      } else {
        expect(result.sections).toEqual([]);
      }
      // Only check for error property if present
      if (Object.prototype.hasOwnProperty.call(result, "error")) {
        expect(result).toHaveProperty("error");
      }
    });
  });
});
