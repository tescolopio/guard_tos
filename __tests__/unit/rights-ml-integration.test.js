/**
 * @file rights-ml-integration.test.js
 * @description Ensures ML category scores surface through rights assessor output
 */

const { createRightsAssessor } = require("../../src/analysis/rightsAssessor");

const log = () => {};
const logLevels = { DEBUG: 3, INFO: 2, WARN: 1, ERROR: 0 };

describe("rights assessor ML propagation", () => {
  it("attaches aggregated mlCategoryScores to the analysis details", async () => {
    const assessor = createRightsAssessor({
      log,
      logLevels,
      commonWords: [],
      legalTermsDefinitions: {},
      mlAugmenter: async (_chunk, res) => {
        res.mlCategoryScores = {
          DISPUTE_RESOLUTION: 0.8,
          DATA_PRACTICES: { score: 35 },
        };
      },
    });

    const text = `Binding arbitration applies to all disputes.\n`;
    const result = await assessor.analyzeContent(text);

    expect(result.details.mlCategoryScores).toBeDefined();
    const mlDetails = result.details.mlCategoryScores;
    expect(mlDetails.DISPUTE_RESOLUTION).toBeDefined();
    expect(mlDetails.DISPUTE_RESOLUTION.observations).toBeGreaterThanOrEqual(1);
    expect(mlDetails.DISPUTE_RESOLUTION.probability).toBeCloseTo(0.8, 5);
    expect(mlDetails.DISPUTE_RESOLUTION.score).toBe(20);

    expect(mlDetails.DATA_PRACTICES).toBeDefined();
    // score of 35 (rights-friendly scale) becomes probability of 0.65 (risk)
    expect(mlDetails.DATA_PRACTICES.probability).toBeCloseTo(0.65, 5);
    expect(mlDetails.DATA_PRACTICES.score).toBe(35);
  });
});
