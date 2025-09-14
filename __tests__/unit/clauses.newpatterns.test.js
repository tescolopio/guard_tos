/**
 * @file clauses.newpatterns.test.js
 * @description Regression tests ensuring newly added clause patterns are detected.
 */

const { createRightsAssessor } = require("../../src/analysis/rightsAssessor");
const { LEGAL_PATTERNS } = require("../../src/data/legalPatterns");
const { EXT_CONSTANTS } = require("../../src/utils/constants");

// Helper to build minimal text containing a phrase that should trigger each regex.
// We purposely keep unrelated noise minimal so counts remain deterministic (1 each).

describe("New clause pattern detection", () => {
  const log = () => {};
  const logLevels = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
  const assessor = createRightsAssessor({ log, logLevels });

  const HIGH_RISK_EXAMPLES = {
    NEGATIVE_OPTION_BILLING:
      "This subscription uses a negative option that continues until you cancel.",
    DELEGATION_ARBITRABILITY:
      "The arbitrator shall decide arbitrability including the scope of this agreement.",
  };

  const MEDIUM_RISK_EXAMPLES = {
    MORAL_RIGHTS_WAIVER:
      "You waive all moral rights in the content you submit.",
    JURY_TRIAL_WAIVER:
      "You hereby waive the right to a jury trial in any proceeding.",
  };

  const POSITIVE_CONTROL = {
    CLEAR_OPT_OUT: "You may follow the opt-out procedure described below.",
  };

  test.each(Object.entries(HIGH_RISK_EXAMPLES))(
    "detects high risk clause %s",
    async (key, snippet) => {
      const res = await assessor.analyzeContent(snippet);
      const count = res.details.clauseCounts.HIGH_RISK[key];
      expect(count).toBeGreaterThanOrEqual(1);
    },
  );

  test.each(Object.entries(MEDIUM_RISK_EXAMPLES))(
    "detects medium risk clause %s",
    async (key, snippet) => {
      const res = await assessor.analyzeContent(snippet);
      const count = res.details.clauseCounts.MEDIUM_RISK[key];
      expect(count).toBeGreaterThanOrEqual(1);
    },
  );

  test.each(Object.entries(POSITIVE_CONTROL))(
    "detects positive clause %s (control)",
    async (key, snippet) => {
      const res = await assessor.analyzeContent(snippet);
      const count = res.details.clauseCounts.POSITIVES[key];
      expect(count).toBeGreaterThanOrEqual(1);
    },
  );
});
