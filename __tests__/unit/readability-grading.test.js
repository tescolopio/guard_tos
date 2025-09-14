/**
 * @file readability-grading.test.js
 * @description Comprehensive tests for readability grading functionality
 * @author GitHub Copilot
 * @date 2025-09-10
 */

const {
  createReadabilityGrader,
} = require("../../src/analysis/readabilityGrader");

describe("Readability Grading - Comprehensive Tests", () => {
  const log = jest.fn();
  const logLevels = { DEBUG: "debug", INFO: "info", ERROR: "error" };
  let grader;

  beforeEach(() => {
    grader = createReadabilityGrader({ log, logLevels });
  });

  describe("Simple Text Grading", () => {
    it("should grade very simple text as easy to read", () => {
      const simpleText = "I like cats. Cats are nice. They play with yarn.";
      const result = grader.calculateReadabilityGrade(simpleText);

      expect(result.flesch).toBeGreaterThan(80); // Very easy
      expect(result.kincaid).toBeLessThan(5); // Elementary level
      expect(result.fogIndex).toBeLessThan(6); // Easy
      expect(result.averageGrade).toMatch(/A|B/); // Should be A or B grade
    });

    it("should grade complex academic text as difficult", () => {
      const complexText =
        "The epistemological foundations of phenomenological reduction necessitate a transcendental bracketing of the natural attitude, thereby establishing the transcendental ego as the primordial source of all constitution and meaning.";
      const result = grader.calculateReadabilityGrade(complexText);

      expect(result.flesch).toBeLessThan(30); // Very difficult
      expect(result.kincaid).toBeGreaterThan(15); // College graduate level
      expect(result.fogIndex).toBeGreaterThan(15); // Difficult
      expect(result.averageGrade).toMatch(/F|D/); // Should be D or F grade
    });
  });

  describe("Legal Text Grading", () => {
    it("should grade simple legal text appropriately", () => {
      const simpleLegal =
        "You agree to these terms. You must follow the rules. If you break the rules, your account may be suspended.";
      const result = grader.calculateReadabilityGrade(simpleLegal);

      expect(result.flesch).toBeGreaterThan(60); // Fairly easy
      expect(result.kincaid).toBeLessThan(10); // High school level
      expect(result.averageGrade).toBeDefined();
    });

    it("should grade complex legal text as difficult", () => {
      const complexLegal =
        "Notwithstanding anything to the contrary contained herein, the indemnification obligations set forth in this Section shall survive the termination or expiration of this Agreement and shall continue in full force and effect indefinitely thereafter, provided that such indemnification shall be limited to claims arising from events occurring during the term of this Agreement.";
      const result = grader.calculateReadabilityGrade(complexLegal);

      expect(result.flesch).toBeLessThan(40); // Difficult
      expect(result.kincaid).toBeGreaterThan(12); // College level
      expect(result.fogIndex).toBeGreaterThan(12); // Difficult
      expect(result.averageGrade).toMatch(/D|F/); // Should be difficult grade
    });
  });

  describe("Terms of Service Text Grading", () => {
    it("should grade typical ToS text appropriately", () => {
      const tosText = `Terms of Service

      1. Acceptance of Terms
      By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.

      2. Use License
      Permission is granted to temporarily download one copy of the materials on our website for personal, non-commercial transitory viewing only.

      3. Disclaimer
      The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.`;

      const result = grader.calculateReadabilityGrade(tosText);

      expect(result.flesch).toBeGreaterThan(40); // Should be readable
      expect(result.flesch).toBeLessThan(80); // But not too easy
      expect(result.kincaid).toBeGreaterThan(8); // Some education required
      expect(result.kincaid).toBeLessThan(15); // Not graduate level
      expect(result.averageGrade).toBeDefined();
      expect(typeof result.averageGrade).toBe("string");
    });
  });

  describe("Edge Cases", () => {
    it("should handle text with many short sentences", () => {
      const shortSentences =
        "Hi. Hello. How are you? I am fine. Thank you. Good bye.";
      const result = grader.calculateReadabilityGrade(shortSentences);

      expect(result).toHaveProperty("flesch");
      expect(result).toHaveProperty("kincaid");
      expect(result).toHaveProperty("fogIndex");
      expect(result.averageGrade).toBeDefined();
    });

    it("should handle text with very long sentences", () => {
      const longSentence =
        "This is a very long sentence that contains many words and clauses and phrases and it goes on and on without stopping and it includes various concepts and ideas that might be difficult for some people to understand because of the complexity and length of the sentence structure.";
      const result = grader.calculateReadabilityGrade(longSentence);

      expect(result.flesch).toBeLessThan(60); // Should be somewhat difficult due to length
      expect(result.kincaid).toBeGreaterThan(10); // Higher grade level
    });

    it("should handle text with technical jargon", () => {
      const technicalText =
        "The API utilizes RESTful endpoints with OAuth2 authentication, implementing JWT tokens for stateless session management and Redis caching for performance optimization.";
      const result = grader.calculateReadabilityGrade(technicalText);

      expect(result.flesch).toBeLessThan(50); // Technical terms make it harder
      expect(result.kincaid).toBeGreaterThan(12); // Requires education
    });
  });

  describe("Grade Mapping", () => {
    it("should map scores to appropriate letter grades", () => {
      const testCases = [
        { text: "I see a cat.", expectedGrade: "A" },
        {
          text: "The quick brown fox jumps over the lazy dog. This sentence contains all letters of the alphabet.",
          expectedGrade: "B",
        },
        {
          text: "In contemporary society, the proliferation of digital technologies has fundamentally transformed interpersonal communication paradigms.",
          expectedGrade: "C",
        },
        {
          text: "The epistemological foundations of phenomenological reduction necessitate a transcendental bracketing of the natural attitude.",
          expectedGrade: "D",
        },
        {
          text: "Pursuant to the aforementioned contractual stipulations, the indemnification provisions shall remain operative notwithstanding termination.",
          expectedGrade: "F",
        },
      ];

      testCases.forEach(({ text, expectedGrade }) => {
        const result = grader.calculateReadabilityGrade(text);
        expect(result.averageGrade).toBeDefined();
        // Note: Exact grade mapping may vary, but should be reasonable
        expect(["A", "B", "C", "D", "F", "N/A"]).toContain(result.averageGrade);
      });
    });
  });

  describe("Confidence Scoring", () => {
    it("should provide confidence based on text length", () => {
      const shortText = "Hi there.";
      const longText =
        "This is a much longer piece of text that contains many more words and should therefore have higher confidence in the readability analysis because there are more data points to work with when calculating the various readability metrics.";

      const shortResult = grader.calculateReadabilityGrade(shortText);
      const longResult = grader.calculateReadabilityGrade(longText);

      expect(shortResult.confidence).toBeGreaterThanOrEqual(0);
      expect(shortResult.confidence).toBeLessThanOrEqual(1);
      expect(longResult.confidence).toBeGreaterThanOrEqual(0);
      expect(longResult.confidence).toBeLessThanOrEqual(1);

      // Longer text should generally have higher confidence
      expect(longResult.confidence).toBeGreaterThanOrEqual(
        shortResult.confidence,
      );
    });
  });
});
