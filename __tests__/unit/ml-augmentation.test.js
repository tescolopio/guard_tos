/**
 * @file ml-augmentation.test.js
 * @description Tests optional ML augmentation hook in rightsAssessor
 */

const { createRightsAssessor } = require("../../src/analysis/rightsAssessor");

describe("ML augmentation hook in rightsAssessor", () => {
  const log = jest.fn();
  const logLevels = { DEBUG: 3, INFO: 2, WARN: 1, ERROR: 0 };

  test("injecting mlAugmenter bumps clause counts based on mock predictions", async () => {
    // Arrange: text chunk without explicit rule matches
    const text = "These terms mention dispute processes and updates.";

    // mlAugmenter stub simulates high ML probability for ARBITRATION and UNILATERAL_CHANGES
    const mlAugmenter = async (chunk, res) => {
      res.clauseCounts = res.clauseCounts || {
        HIGH_RISK: {},
        MEDIUM_RISK: {},
        POSITIVES: {},
      };
      res.clauseCounts.HIGH_RISK = res.clauseCounts.HIGH_RISK || {};
      res.clauseCounts.MEDIUM_RISK = res.clauseCounts.MEDIUM_RISK || {};
      res.clauseCounts.HIGH_RISK.ARBITRATION =
        (res.clauseCounts.HIGH_RISK.ARBITRATION || 0) + 1;
      res.clauseCounts.MEDIUM_RISK.UNILATERAL_CHANGES =
        (res.clauseCounts.MEDIUM_RISK.UNILATERAL_CHANGES || 0) + 1;
    };

    const assessor = createRightsAssessor({ log, logLevels, mlAugmenter });

    // Act
    const result = await assessor.analyzeContent(text);

    // Assert
    const counts = result.details.clauseCounts;
    expect(counts.HIGH_RISK.ARBITRATION).toBeGreaterThanOrEqual(1);
    expect(counts.MEDIUM_RISK.UNILATERAL_CHANGES).toBeGreaterThanOrEqual(1);
  });
});
