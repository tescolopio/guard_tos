/**
 * @file data/cache/textCacheConfig.js
 * @description Configuration class for text caching system
 * @version 1.0.0
 */

(function(global) {
  'use strict';

  class TextCacheConfig {
    constructor(options = {}) {
      const { DETECTION, ANALYSIS } = global.Constants;

      this.MAX_ENTRIES = options.maxEntries || 100;
      this.TTL = options.ttl || 1000 * 60 * 5; // 5 minutes default
      this.MIN_CACHE_LENGTH = options.minCacheLength || DETECTION.THRESHOLDS.AUTO_GRADE;
      this.BATCH_THRESHOLD = options.batchThreshold || ANALYSIS.BATCH_THRESHOLD;
      this.CHUNK_SIZE = options.chunkSize || ANALYSIS.CHUNK_SIZE;
    }

    static fromConstants(constants) {
      return new TextCacheConfig({
        maxEntries: 100,
        ttl: 1000 * 60 * 5,
        minCacheLength: constants.DETECTION.THRESHOLDS.AUTO_GRADE,
        batchThreshold: constants.ANALYSIS.BATCH_THRESHOLD,
        chunkSize: constants.ANALYSIS.CHUNK_SIZE
      });
    }
  }

  // Export for both environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TextCacheConfig };
  } else {
    global.TextCacheConfig = TextCacheConfig;
  }

})(typeof window !== 'undefined' ? window : global);
