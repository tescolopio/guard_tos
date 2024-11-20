/**
 * @file data/cache/textCacheWithRecovery.js
 * @description Enhanced text cache with error recovery
 * @version 1.0.0
 */

(function(global) {
  'use strict';

  class TextCacheWithRecovery extends global.TextCache {
    constructor(config, log, logLevels) {
      super(config);
      this.log = log;
      this.logLevels = logLevels;
    }

    async get(key, type) {
      try {
        return await super.get(key, type);
      } catch (error) {
        this.log(this.logLevels.ERROR, `Cache get error for ${type}:`, error);
        this.cleanup(); // Try to recover
        return null;
      }
    }

    async set(key, value, type) {
      try {
        await super.set(key, value, type);
      } catch (error) {
        this.log(this.logLevels.ERROR, `Cache set error for ${type}:`, error);
        this.cleanup(); // Try to recover
        // Attempt one retry
        try {
          await super.set(key, value, type);
        } catch (retryError) {
          this.log(this.logLevels.ERROR, "Cache retry failed:", retryError);
        }
      }
    }

    cleanup() {
      try {
        super.cleanup();
      } catch (error) {
        this.log(this.logLevels.ERROR, "Cache cleanup error:", error);
        // Reset cache as last resort
        this.cache = {
          raw: new Map(),
          processed: new Map(),
          metadata: new Map(),
          structure: new WeakMap(),
          timestamp: new Map()
        };
      }
    }
  }

  // Export for both environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TextCacheWithRecovery };
  } else {
    global.TextCacheWithRecovery = TextCacheWithRecovery;
  }

})(typeof window !== 'undefined' ? window : global);
