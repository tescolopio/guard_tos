/**
 * @file modelHub.js
 * @description Central loader for category-specific ML models. Currently wraps the
 * legacy clause classifier and exposes a forward-compatible interface for
 * multi-category predictions.
 */

let hubInstance = null;

async function createFallbackHub() {
  const clauseModule = await import(
    /* webpackChunkName: "clauseClassifier" */ "./clauseClassifier.js"
  );

  return {
    /**
     * Predict clause-level probabilities and (future) category scores for a chunk.
     * @param {string[]} sentences - tokenised sentences for the chunk
     * @param {object} context - optional context (text, ruleCounts, etc.)
     * @returns {Promise<{clauseProbabilities: Record<string, number>, categoryScores: Record<string, number>}>}
     */
    async predict(sentences, context = {}) {
      const predictions = await clauseModule.classifySentences(
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

export async function getModelHub() {
  if (!hubInstance) {
    hubInstance = createFallbackHub();
  }
  return hubInstance;
}

export function resetModelHubForTests() {
  hubInstance = null;
}
