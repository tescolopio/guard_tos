/**
 * @file data/cache/textCache.js
 * @description Base text caching implementation
 * @version 1.0.0
 */

(function(global) {
  'use strict';

  class TextCache {
    constructor(config) {
      this.config = config;
      this.cache = {
        raw: new Map(),
        processed: new Map(),
        metadata: new Map(),
        structure: new WeakMap(),
        timestamp: new Map()
      };
    }

    async get(key, type) {
      const entry = this.cache[type].get(key);
      if (!entry) return null;

      const timestamp = this.cache.timestamp.get(key);
      if (Date.now() - timestamp > this.config.TTL) {
        this.delete(key);
        return null;
      }

      return entry;
    }

    async set(key, value, type) {
      this.cache[type].set(key, value);
      this.cache.timestamp.set(key, Date.now());

      if (this.cache[type].size > this.config.MAX_ENTRIES) {
        this.cleanup();
      }
    }

    cleanup() {
      const now = Date.now();
      for (const [key, timestamp] of this.cache.timestamp) {
        if (now - timestamp > this.config.TTL) {
          this.delete(key);
        }
      }
    }

    delete(key) {
      Object.keys(this.cache).forEach(type => {
        if (this.cache[type] instanceof Map) {
          this.cache[type].delete(key);
        }
      });
    }

    getStats() {
      return {
        raw: this.cache.raw.size,
        processed: this.cache.processed.size,
        metadata: this.cache.metadata.size
      };
    }
  }

  // Export for both environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TextCache };
  } else {
    global.TextCache = TextCache;
  }

})(typeof window !== 'undefined' ? window : global);
