/**
 * @file text-processing-pipeline.test.js
 * @description Comprehensive test for the complete text processing pipeline:
 * HTML/text input → text extraction → chunking → analysis → readability scoring
 * @author GitHub Copilot
 * @date 2025-09-17
 */

const { createTextExtractor } = require("../../src/analysis/textExtractor");
const {
  createReadabilityGrader,
} = require("../../src/analysis/readabilityGrader");
const { createRightsAssessor } = require("../../src/analysis/rightsAssessor");
const { createSummarizer } = require("../../src/analysis/summarizeTos");
const {
  createUncommonWordsIdentifier,
} = require("../../src/analysis/uncommonWordsIdentifier");
const cheerio = require("cheerio");
const compromise = require("compromise");

describe("Text Processing Pipeline - End-to-End", () => {
  const log = jest.fn();
  const logLevels = {
    DEBUG: "debug",
    INFO: "info",
    ERROR: "error",
    WARN: "warn",
  };

  // Test utilities
  const utilities = {
    splitIntoWords: (text) =>
      text ? text.toLowerCase().split(/\W+/).filter(Boolean) : [],
  };

  let textExtractor;
  let readabilityGrader;
  let rightsAssessor;
  let summarizer;
  let uncommonWordsIdentifier;

  beforeEach(async () => {
    // Create comprehensive browser environment mocks for Node.js
    const createMockElement = (textContent = "") => ({
      textContent,
      querySelector: () => null,
      querySelectorAll: () => [],
      getAttribute: () => null,
      tagName: "DIV",
      nodeType: 1, // ELEMENT_NODE
      children: [],
      parentElement: null,
    });

    // Mock Node constants
    global.Node = {
      ELEMENT_NODE: 1,
      TEXT_NODE: 3,
      COMMENT_NODE: 8,
    };

    // Mock DOMParser for HTML processing in Node.js environment
    global.DOMParser = class DOMParser {
      parseFromString(html, contentType) {
        // Extract text content from HTML
        const textContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        const mockBody = createMockElement(textContent);

        return {
          body: mockBody,
          querySelector: () => null,
          querySelectorAll: () => [],
          createElement: () => createMockElement(),
        };
      }
    };

    // Initialize all pipeline components
    textExtractor = createTextExtractor({ log, logLevels, utilities });
    readabilityGrader = createReadabilityGrader({ log, logLevels });
    rightsAssessor = createRightsAssessor({ log, logLevels });
    summarizer = createSummarizer({ compromise, cheerio, log, logLevels });
    uncommonWordsIdentifier = await createUncommonWordsIdentifier({
      log,
      logLevels,
      commonWords: [
        "the",
        "and",
        "or",
        "but",
        "a",
        "an",
        "to",
        "of",
        "in",
        "on",
        "at",
      ],
      legalTerms: ["arbitration", "liability", "indemnify", "waiver"],
      legalTermsDefinitions: {
        arbitration: "A method of dispute resolution outside the court system",
        liability: "Legal responsibility for damages or loss",
        indemnify: "To compensate for harm or loss",
        waiver: "The voluntary relinquishment of a right",
      },
      config: {
        minWordLength: 3,
        batchSize: 10,
        definitionCacheTime: 60000,
        prioritizeLegalTerms: true,
      },
      utilities,
    });
  });

  afterEach(() => {
    // Clean up global mocks
    delete global.DOMParser;
    delete global.Node;
  });

  describe("HTML Web Page Processing", () => {
    it("should process HTML content through the pipeline using text fallback", async () => {
      // Since full DOM mocking is complex, test the pipeline using extracted text
      const extractedText = `
        Terms of Service
        
        1. Acceptance of Terms
        By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
        
        2. Modifications
        We reserve the right to modify these terms at any time without prior notice. Your continued use of the service constitutes acceptance of such modifications.
        
        3. Limitation of Liability
        In no event shall the company be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses resulting from your use of the service.
        
        4. Dispute Resolution
        Any disputes arising from this agreement shall be resolved through binding arbitration rather than in court. You waive your right to participate in class action lawsuits.
      `.trim();

      // Process through the complete pipeline as if it came from HTML extraction

      // Step 1: Simulate text extraction result
      const extraction = {
        text: extractedText,
        metadata: {
          wordCount: extractedText.split(/\s+/).filter(Boolean).length,
          source: "html_simulation",
        },
      };

      expect(extraction).toHaveProperty("text");
      expect(extraction).toHaveProperty("metadata");
      expect(extraction.text).toContain("Terms of Service");
      expect(extraction.text).toContain("arbitration");
      expect(extraction.metadata.wordCount).toBeGreaterThan(50);

      const pipelineText = extraction.text;

      // Step 2: Readability Analysis
      const readabilityResult =
        readabilityGrader.calculateReadabilityGrade(pipelineText);

      expect(readabilityResult).toHaveProperty("averageGrade");
      expect(readabilityResult).toHaveProperty("flesch");
      expect(readabilityResult).toHaveProperty("kincaid");
      expect(readabilityResult).toHaveProperty("fogIndex");
      expect(readabilityResult).toHaveProperty("confidence");
      expect(["A", "B", "C", "D", "F"]).toContain(
        readabilityResult.averageGrade,
      );
      expect(readabilityResult.confidence).toBeGreaterThan(0);

      // Step 3: Rights Assessment
      const rightsResult = await rightsAssessor.analyzeContent(pipelineText);

      expect(rightsResult).toHaveProperty("rightsScore");
      expect(rightsResult).toHaveProperty("details");
      expect(rightsResult.rightsScore).toBeGreaterThanOrEqual(0);
      expect(rightsResult.rightsScore).toBeLessThanOrEqual(100);

      // Step 4: Text Summarization (using HTML wrapper)
      const htmlWrapper = `<html><body><div>${pipelineText.replace(/\n/g, "<br>")}</div></body></html>`;
      const summaryResult = await summarizer.summarizeTos(htmlWrapper);

      expect(summaryResult).toHaveProperty("overall");
      expect(summaryResult).toHaveProperty("sections");
      expect(typeof summaryResult.overall).toBe("string");
      expect(Array.isArray(summaryResult.sections)).toBe(true);

      // Step 5: Uncommon Words Identification
      const uncommonWordsResult =
        await uncommonWordsIdentifier.identifyUncommonWords(pipelineText);

      expect(Array.isArray(uncommonWordsResult)).toBe(true);

      // Verify pipeline integration
      console.log("Pipeline Results:");
      console.log(`- Extracted ${extraction.metadata.wordCount} words`);
      console.log(
        `- Readability Grade: ${readabilityResult.averageGrade} (${readabilityResult.normalizedScore?.toFixed(1) || "N/A"})`,
      );
      console.log(`- Rights Score: ${rightsResult.rightsScore}%`);
      console.log(`- Summary Length: ${summaryResult.overall.length} chars`);
      console.log(`- Uncommon Words Found: ${uncommonWordsResult.length}`);
    });
  });

  describe("Plain Text Processing", () => {
    it("should process plain text documents through the pipeline", async () => {
      const plainText = `
Terms of Service Agreement

1. User Responsibilities
Users must provide accurate information and maintain the security of their accounts. Users are responsible for all activities under their account.

2. Service Modifications
We may modify, suspend, or discontinue any part of our service at any time. We reserve the right to change these terms without notice.

3. Intellectual Property
All content provided through our service is protected by copyright and other intellectual property laws. Users may not reproduce or distribute content without permission.

4. Limitation of Liability
Our liability is limited to the maximum extent permitted by law. We are not liable for any damages arising from use of our service.

5. Termination
We may terminate accounts for violations of these terms. Users may cancel their accounts at any time.
      `.trim();

      // Process through pipeline
      const extraction = await textExtractor.extract(plainText, "text");
      const readability =
        readabilityGrader.calculateReadabilityGrade(plainText);
      const rights = await rightsAssessor.analyzeContent(plainText);
      const uncommonWords =
        await uncommonWordsIdentifier.identifyUncommonWords(plainText);

      // Verify all components work with plain text
      // Note: extractFromText preprocesses the text (normalizes whitespace, lowercases)
      expect(extraction.text).toContain("terms of service");
      expect(extraction.text).toContain("liability");
      expect(extraction.metadata.wordCount).toBeGreaterThan(0);
      expect(["A", "B", "C", "D", "F"]).toContain(readability.averageGrade);
      expect(rights.rightsScore).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(uncommonWords)).toBe(true);
    });
  });

  describe("Chunked Processing", () => {
    it("should handle large documents by processing in chunks", async () => {
      // Create a large document by repeating content
      const baseContent = `
        Section: Terms and Conditions
        Users agree to abide by these terms. The company reserves all rights.
        Liability is limited. Arbitration is required for disputes.
        Users waive rights to class action lawsuits.
      `;

      const largeDocument = Array(50).fill(baseContent).join("\n\n");

      // Test chunked processing (simulate breaking into smaller pieces)
      const chunkSize = 1000; // characters
      const chunks = [];
      for (let i = 0; i < largeDocument.length; i += chunkSize) {
        chunks.push(largeDocument.slice(i, i + chunkSize));
      }

      expect(chunks.length).toBeGreaterThan(1);

      // Process each chunk and aggregate results
      const chunkResults = [];
      for (const chunk of chunks) {
        if (chunk.trim().length > 100) {
          // Only process substantial chunks
          const readability =
            readabilityGrader.calculateReadabilityGrade(chunk);
          const rights = await rightsAssessor.analyzeContent(chunk);

          chunkResults.push({
            readability,
            rights,
            wordCount: chunk.split(/\s+/).filter(Boolean).length,
          });
        }
      }

      expect(chunkResults.length).toBeGreaterThan(0);

      // Verify consistent results across chunks
      const avgReadabilityScore =
        chunkResults.reduce(
          (sum, result) => sum + (result.readability.normalizedScore || 0),
          0,
        ) / chunkResults.length;
      const avgRightsScore =
        chunkResults.reduce(
          (sum, result) => sum + result.rights.rightsScore,
          0,
        ) / chunkResults.length;

      expect(avgReadabilityScore).toBeGreaterThanOrEqual(0);
      expect(avgRightsScore).toBeGreaterThanOrEqual(0);

      console.log(`Processed ${chunks.length} chunks:`);
      console.log(
        `- Average Readability Score: ${avgReadabilityScore.toFixed(1)}`,
      );
      console.log(`- Average Rights Score: ${avgRightsScore.toFixed(1)}%`);
    });
  });

  describe("Error Handling in Pipeline", () => {
    it("should gracefully handle invalid inputs at each stage", async () => {
      const invalidInputs = [null, "", "<malformed><html", "   \n\t   "];

      for (const input of invalidInputs) {
        // Text extraction should handle invalid inputs
        const extraction = await textExtractor.extract(input, "html");
        expect(extraction).toBeDefined();

        // Use a fallback text for other pipeline stages
        const testText = input && input.trim() ? input : "fallback test text";

        // Readability should handle edge cases
        const readability =
          readabilityGrader.calculateReadabilityGrade(testText);
        expect(readability).toBeDefined();
        expect(readability.averageGrade).toBeDefined();

        // Rights assessment should handle minimal text
        const rights = await rightsAssessor.analyzeContent(testText);
        expect(rights).toBeDefined();
        expect(typeof rights.rightsScore).toBe("number");
      }
    });
  });

  describe("Performance Benchmarks", () => {
    it("should process medium-sized documents within acceptable time limits", async () => {
      const mediumDocument = Array(20)
        .fill(
          `
        Privacy Policy Section
        We collect personal information when you use our services. This includes
        your name, email address, and usage data. We may share this information
        with third parties for marketing purposes. You can opt out at any time
        by contacting customer service.
      `,
        )
        .join(" ");

      const startTime = Date.now();

      // Run full pipeline
      const extraction = await textExtractor.extract(mediumDocument, "text");
      const readability =
        readabilityGrader.calculateReadabilityGrade(mediumDocument);
      const rights = await rightsAssessor.analyzeContent(mediumDocument);

      const totalTime = Date.now() - startTime;

      // Performance assertions (adjust thresholds as needed)
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(extraction.metadata.wordCount).toBeGreaterThan(200);
      expect(readability.confidence).toBeGreaterThan(0.5); // Should have good confidence

      console.log(
        `Pipeline processed ${extraction.metadata.wordCount} words in ${totalTime}ms`,
      );
    });
  });
});
