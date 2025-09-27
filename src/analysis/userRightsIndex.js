"use strict";

const { EXT_CONSTANTS } = require("../utils/constants");

/**
 * Compute the User Rights Index (URI) across eight categories.
 * Inputs: document-level analysis outputs (readability, rights details, sections).
 * Output: {
 *   categories: { CAT: { score, signals, sentiment } },
 *   weightedScore: number (0-100),
 *   grade: 'A'..'F'
 * }
 */
function createUserRightsIndex({ log = () => {}, logLevels = {} } = {}) {
  const CFG = EXT_CONSTANTS.ANALYSIS.USER_RIGHTS_INDEX;
  const ML_CFG = CFG.ML_FUSION || {};
  const RIGHTS_CFG = EXT_CONSTANTS.ANALYSIS.RIGHTS;

  // Map internal clause/heuristic categories to URI categories
  const MAP = {
    // Dispute Resolution
    DISPUTE_RESOLUTION: "DISPUTE_RESOLUTION",
    CLASS_ACTIONS: "DISPUTE_RESOLUTION",
    // Terms Changes
    UNILATERAL_CHANGES: "TERMS_CHANGES",
    // Data & Privacy
    DATA_PRACTICES: "DATA_COLLECTION_USE",
    RETENTION_AND_DELETION: "USER_PRIVACY",
    CONSENT_AND_OPT_OUT: "CLARITY_TRANSPARENCY",
    // Content rights
    CONTENT_AND_IP: "CONTENT_RIGHTS",
    // Liability often affects remedies; we reflect in clarity + content rights slightly
    LIABILITY_AND_REMEDIES: "CLARITY_TRANSPARENCY",
    // Account management
    ACCOUNT_MANAGEMENT: "ACCOUNT_MANAGEMENT",
    // Algorithmic decisions
    ALGORITHMIC_DECISIONS: "ALGORITHMIC_DECISIONS",
  };

  function normalize01(x) {
    if (typeof x !== "number" || Number.isNaN(x)) return 0.5;
    return Math.max(0, Math.min(1, x));
  }

  function gradeFrom(score) {
    const g = CFG.GRADING;
    if (score >= g.A.MIN) return "A";
    if (score >= g.B.MIN) return "B";
    if (score >= g.C.MIN) return "C";
    if (score >= g.D.MIN) return "D";
    return "F";
  }

  /**
   * Very light sentiment scaffold per category.
   * Returns -1 (negative), 0 (neutral), 1 (positive).
   */
  function sentimentForCategory(catKey, signals) {
    // Heuristic: high negative weights or low scores -> negative; strong positives -> positive
    const score = typeof signals.score === "number" ? signals.score : 50;
    if (score <= 40) return -1;
    if (score >= 85) return 1;
    return 0;
  }

  function compute(analysis) {
    try {
      const categories = {};
      const weights = CFG.CATEGORIES;

      // Seed defaults
      Object.keys(weights).forEach((k) => {
        categories[k] = { score: 50, grade: "C", signals: {}, sentiment: 0 };
      });

      // Use rights assessor category scores if present (already 0-100)
      const rightsCat = analysis?.rightsDetails?.details?.categoryScores || {};
      Object.entries(rightsCat).forEach(([k, obj]) => {
        const mapped = MAP[k] || null;
        if (!mapped) return;
        const score = typeof obj?.score === "number" ? obj.score : 50;
        const target = categories[mapped];
        target.score = score;
        target.grade = gradeFrom(score);
        target.signals = target.signals || {};
        const sources = new Set(target.signals.sources || []);
        sources.add("rightsAssessor");
        target.signals.sources = Array.from(sources);
        target.signals.source = target.signals.sources.join("+");
        if (typeof obj?.raw === "number") {
          target.signals.ruleRaw = obj.raw;
        }
        if (typeof obj?.adjusted === "number") {
          target.signals.ruleAdjusted = obj.adjusted;
        }
        target.signals.ruleScore = score;
      });

      const mlEnabled = ML_CFG.ENABLED !== false;
      if (mlEnabled) {
        const minObs =
          typeof ML_CFG.MIN_OBSERVATIONS === "number"
            ? Math.max(1, ML_CFG.MIN_OBSERVATIONS)
            : 1;
        const blendWeight =
          typeof ML_CFG.BLEND_WEIGHT === "number"
            ? Math.min(1, Math.max(0, ML_CFG.BLEND_WEIGHT))
            : 0.65;
        const mlCat = analysis?.rightsDetails?.details?.mlCategoryScores || {};
        Object.entries(mlCat).forEach(([k, obj]) => {
          const mapped = MAP[k] || null;
          if (!mapped) return;
          const observations = Number(obj?.observations || 0);
          if (observations < minObs) return;
          let probability = null;
          if (typeof obj?.probability === "number") {
            probability = obj.probability;
          } else if (typeof obj === "number") {
            probability = obj;
          } else if (typeof obj?.score === "number") {
            const normalized = obj.score > 1 ? obj.score / 100 : obj.score;
            probability = 1 - normalized;
          }
          if (typeof probability === "number") {
            probability = Math.min(1, Math.max(0, probability));
          }
          let mlScore = null;
          if (typeof obj?.score === "number") {
            mlScore = obj.score;
          } else if (typeof probability === "number") {
            mlScore = Math.round((1 - probability) * 100);
          }
          if (typeof mlScore !== "number" || Number.isNaN(mlScore)) return;
          const target = categories[mapped];
          if (!target) return;
          const baseScore =
            typeof target.score === "number" ? target.score : 50;
          const fused = Math.round(
            blendWeight * baseScore + (1 - blendWeight) * mlScore,
          );
          target.score = fused;
          target.grade = gradeFrom(fused);
          target.signals = target.signals || {};
          const sources = new Set(target.signals.sources || []);
          sources.add("ml");
          target.signals.sources = Array.from(sources);
          target.signals.source = target.signals.sources.join("+");
          target.signals.mlScore = mlScore;
          if (typeof probability === "number") {
            target.signals.mlProbability = probability;
          }
          if (observations) {
            target.signals.mlObservations = observations;
          }
        });
      }

      // Readability contributes to Clarity & Transparency
      const r = analysis?.readability;
      if (r && typeof r.normalizedScore === "number") {
        const clarity = categories.CLARITY_TRANSPARENCY;
        // Map normalizedScore (0-100) directly with a mild influence
        clarity.score = Math.round(
          0.7 * clarity.score + 0.3 * r.normalizedScore,
        );
        clarity.grade = gradeFrom(clarity.score);
        clarity.signals.readability = r.normalizedScore;
      }

      // Section hints: basic boosting if sections flagged certain areas
      if (Array.isArray(analysis?.sections)) {
        for (const s of analysis.sections) {
          const cs = s?.rights?.categoryScores || {};
          Object.entries(cs).forEach(([k, v]) => {
            const mapped = MAP[k] || null;
            if (!mapped) return;
            const sc = typeof v?.score === "number" ? v.score : undefined;
            if (typeof sc === "number") {
              // Light smoothing toward section-level signal
              categories[mapped].score = Math.round(
                0.8 * categories[mapped].score + 0.2 * sc,
              );
              categories[mapped].grade = gradeFrom(categories[mapped].score);
            }
          });
        }
      }

      // Sentiment hooks per category
      Object.keys(categories).forEach((k) => {
        categories[k].sentiment = sentimentForCategory(k, categories[k]);
      });

      // Weighted overall
      let sum = 0;
      let wsum = 0;
      Object.entries(weights).forEach(([k, { weight }]) => {
        const s = categories[k]?.score ?? 50;
        sum += s * weight;
        wsum += weight;
      });
      const weightedScore =
        wsum > 0 ? Math.round((sum / wsum) * 100) / 100 : 50;
      const grade = gradeFrom(weightedScore);

      return { categories, weightedScore, grade };
    } catch (e) {
      log(logLevels.ERROR || 3, "UserRightsIndex compute error", e);
      return {
        categories: {},
        weightedScore: 50,
        grade: "C",
        error: e?.message,
      };
    }
  }

  return { compute };
}

module.exports = { createUserRightsIndex };
