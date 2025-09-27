const { createUserRightsIndex } = require("../../src/analysis/userRightsIndex");

describe("User Rights Index", () => {
  it("computes weighted score and grade with category mapping", () => {
    const uri = createUserRightsIndex();
    const analysis = {
      readability: { normalizedScore: 78 },
      rightsDetails: {
        details: {
          categoryScores: {
            DISPUTE_RESOLUTION: { score: 40 },
            DATA_PRACTICES: { score: 65 },
            CONTENT_AND_IP: { score: 80 },
            UNILATERAL_CHANGES: { score: 55 },
            LIABILITY_AND_REMEDIES: { score: 60 },
          },
        },
      },
      sections: [
        {
          rights: { categoryScores: { DATA_PRACTICES: { score: 70 } } },
        },
      ],
    };
    const res = uri.compute(analysis);
    expect(res).toHaveProperty("categories");
    expect(res.categories).toHaveProperty("CLARITY_TRANSPARENCY");
    expect(res.categories).toHaveProperty("DATA_COLLECTION_USE");
    expect(res.categories).toHaveProperty("USER_PRIVACY");
    expect(res.categories).toHaveProperty("CONTENT_RIGHTS");
    expect(res.categories).toHaveProperty("DISPUTE_RESOLUTION");
    expect(typeof res.weightedScore).toBe("number");
    expect(["A", "B", "C", "D", "F"]).toContain(res.grade);
  });

  it("blends mlCategoryScores into category outputs", () => {
    const uri = createUserRightsIndex();
    const analysis = {
      rightsDetails: {
        details: {
          categoryScores: {
            DISPUTE_RESOLUTION: { score: 80 },
          },
          mlCategoryScores: {
            DISPUTE_RESOLUTION: {
              probability: 0.8,
              score: 20,
              observations: 3,
            },
          },
        },
      },
    };

    const res = uri.compute(analysis);
    const category = res.categories.DISPUTE_RESOLUTION;

    expect(category.score).toBe(59);
    expect(category.grade).toBeDefined();
    expect(category.signals).toBeDefined();
    expect(category.signals.mlScore).toBe(20);
    expect(category.signals.mlProbability).toBeCloseTo(0.8, 5);
    expect(category.signals.mlObservations).toBe(3);
    expect(category.signals.source).toBe("rightsAssessor+ml");
    expect(category.signals.sources).toContain("ml");
    expect(category.signals.sources).toContain("rightsAssessor");
  });
});
