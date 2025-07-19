// src/utils/legalDictionaryService.js
// Minimal mock for testing

async function createLegalDictionaryService({ log, logLevels }) {
  return {
    lookup: async (word) => ({ definition: `Definition for ${word}` }),
    isLegalTerm: (word) => false,
    getAllLegalTerms: () => [],
  };
}

module.exports = { createLegalDictionaryService };
