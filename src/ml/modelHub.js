/**
 * @file modelHub.js
 * @description Central loader for category-specific ML models. Currently wraps the
 * legacy clause classifier and exposes a forward-compatible interface for
 * multi-category predictions.
 */

const clauseModule = require("./clauseClassifier.js");

let hubInstance = null;

function resolveClassifierNamespace() {
  if (!clauseModule) return null;
  if (typeof clauseModule.classifySentences === "function") {
    return clauseModule;
  }
  if (
    clauseModule.default &&
    typeof clauseModule.default.classifySentences === "function"
  ) {
    return clauseModule.default;
  }
  return clauseModule;
}

async function createModelHub() {
  const classifierNs = resolveClassifierNamespace();

  if (!classifierNs || typeof classifierNs.classifySentences !== "function") {
    throw new Error("Clause classifier module did not expose classifySentences");
  }

  return {
    /**
     * Predict clause-level probabilities and (future) category scores for a chunk.
     * @param {string[]} sentences - tokenised sentences for the chunk
     * @param {object} context - optional context (text, ruleCounts, etc.)
     * @returns {Promise<{clauseProbabilities: Record<string, number>, categoryScores: Record<string, number>}>}
     */
    async predict(sentences, context = {}) {
      const predictions = await classifierNs.classifySentences(
        sentences,
        context,
      );
      const clauseProbabilities = {};

      for (const { proba } of predictions) {
        for (const [name, value] of Object.entries(proba)) {
          clauseProbabilities[name] = Math.max(
            clauseProbabilities[name] || 0,
            value,
          );
        }
      }

      return {
        clauseProbabilities,
        categoryScores: {}, // Placeholder until category-specific models ship
      };
    },
  };
}

async function getModelHub() {
  if (!hubInstance) {
    hubInstance = createModelHub();
  }
  return hubInstance;
}

function resetModelHubForTests() {
  hubInstance = null;
}

const api = { getModelHub, resetModelHubForTests };

module.exports = api;
module.exports.default = api;
module.exports.__esModule = true;
