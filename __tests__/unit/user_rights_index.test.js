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
});
