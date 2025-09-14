/**
 * @file rights-rubric.test.js
 * @description Golden tests for rights index rubric (rule-based) prior to ML integration
 */

const { createRightsAssessor } = require("../../src/analysis/rightsAssessor");

describe("Rights Index Rubric (Golden)", () => {
  const log = jest.fn();
  const logLevels = { DEBUG: 3, INFO: 2, WARN: 1, ERROR: 0 };
  const commonWords = ["the", "and", "or", "is", "a", "to", "of"]; // minimal
  const legalTermsDefinitions = {}; // not used in rubric tests

  function assessor() {
    return createRightsAssessor({
      log,
      logLevels,
      commonWords,
      legalTermsDefinitions,
    });
  }

  test("High-risk clauses depress score and grade to D/F bands", async () => {
    const text = `
      TERMS OF SERVICE
      You agree to binding arbitration for all disputes. Class action waiver applies.
      We reserve the right to change these terms at any time. We may sell your data.
      Subscription includes automatic renewal.
    `;
    const a = assessor();
    const res = await a.analyzeContent(text);
    expect(res).toHaveProperty("rightsScore");
    expect(res).toHaveProperty("grade");
    expect(res.rightsScore).toBeGreaterThanOrEqual(0);
    expect(res.rightsScore).toBeLessThan(70); // expect C- or lower; likely D/F
  });

  test("Positive protections improve score", async () => {
    const text = `
      PRIVACY POLICY
      We do not sell your personal data. You can opt-out using our opt-out process.
      You may delete your account at any time and remove your data. We retain data for 12 months.
    `;
    const a = assessor();
    const res = await a.analyzeContent(text);
    expect(res.rightsScore).toBeGreaterThan(70); // at least C/B band due to positives
  });

  test("Mixed document yields mid-band score with moderate confidence", async () => {
    const text = `
      AGREEMENT
      We may modify these terms occasionally. You can delete your account.
      Disputes may be resolved via arbitration except for small claims court.
    `;
    const a = assessor();
    const res = await a.analyzeContent(text);
    expect(res.rightsScore).toBeGreaterThanOrEqual(50);
    expect(res.rightsScore).toBeLessThanOrEqual(90);
    expect(res).toHaveProperty("confidence");
    expect(res.confidence).toBeGreaterThanOrEqual(0);
    expect(res.confidence).toBeLessThanOrEqual(1);
  });

  test("Short text normalizes to avoid over-penalizing length", async () => {
    const text = `Binding arbitration. Class action waiver.`;
    const a = assessor();
    const res = await a.analyzeContent(text);
    // Despite high-risk patterns, short length should normalize impact
    expect(res.rightsScore).toBeGreaterThanOrEqual(20);
  });

  test("No signals yields neutral-ish score", async () => {
    const text = `Welcome to our website. Enjoy your stay.`;
    const a = assessor();
    const res = await a.analyzeContent(text);
    expect(res.rightsScore).toBeGreaterThan(40);
    expect(res.rightsScore).toBeLessThan(100);
  });
});
