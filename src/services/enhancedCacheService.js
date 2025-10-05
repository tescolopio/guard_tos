/**
 * @file src/services/enhancedCacheService.js
 * @description Enhanced cache service with hash-based lookup and database integration
 * @version 1.0.0
 */

(function (global) {
  "use strict";

  const ContentHashService =
    global.ContentHashService ||
    require("./contentHashService").ContentHashService;

  const DEFAULT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

  class EnhancedCacheService {
    constructor(textCache, databaseService = null, preferenceService = null) {
      this.textCache = textCache;
      this.databaseService = databaseService;
      this.preferenceService = preferenceService;
      this.hashService = new ContentHashService();
      this.stats = {
        localHits: 0,
        cloudHits: 0,
        misses: 0,
        stores: 0,
      };
      this.hasStoredAny = false;
      this.localHashes = new Set();
    }

    async getCachedAnalysis(url, content) {
      try {
  const metadata = await this.hashService.generateMetadata(url, content);
  const hash = metadata.hash;
        const retentionMs = await this.getRetentionMs();

        const { entry, invalid } = await this.loadLocalEntry(hash, retentionMs);

        if (entry) {
          this.stats.localHits += 1;
          const normalized = this.normalizeEntry(entry, metadata);
          return {
            source: "local",
            analysis: normalized.analysis,
            metadata: normalized.metadata,
            cached: true,
          };
        }

        if (invalid) {
          this.stats.misses += 1;
          return null;
        }

        if (await this.shouldUseCloudLookup()) {
          const cloudEntry = await this.getCloudCache(hash);
          if (cloudEntry) {
            this.stats.cloudHits += 1;
            const normalized = this.normalizeEntry(cloudEntry, metadata);
            await this.storeLocalEntry(hash, {
              analysis: normalized.analysis,
              metadata: normalized.metadata,
              timestamp: normalized.timestamp || Date.now(),
              version: normalized.version || 1,
              source: "cloud",
            });
            this.localHashes.add(hash);
            this.hasStoredAny = true;
            return {
              source: "cloud",
              analysis: normalized.analysis,
              metadata: normalized.metadata,
              cached: true,
            };
          }
        }

        this.stats.misses += 1;
        if (!this.hasStoredAny) {
          return {
            source: null,
            data: null,
            metadata,
            cached: false,
          };
        }

        return null;
      } catch (error) {
        console.error("Error in getCachedAnalysis:", error);
        return {
          source: null,
          data: null,
          metadata: null,
          cached: false,
          error: error.message,
        };
      }
    }

    async storeAnalysis(url, content, analysisResults) {
      try {
        const metadata = await this.hashService.generateMetadata(url, content);
        const hash = metadata.hash;

        const entry = {
          analysis: analysisResults,
          metadata,
          timestamp: Date.now(),
          version: 1,
          source: "local",
        };

        const localStored = await this.storeLocalEntry(hash, entry);
        if (localStored) {
          this.stats.stores += 1;
          this.hasStoredAny = true;
          this.localHashes.add(hash);
        }

        let cloudStored = true;
        if (await this.shouldUseCloudStorage()) {
          cloudStored = await this.storeCloudCache(hash, metadata, analysisResults);
        }

        return localStored || cloudStored;
      } catch (error) {
        console.error("Error storing analysis:", error);
        return false;
      }
    }

    async loadLocalEntry(hash, retentionMs) {
      let invalid = false;

      if (!hash) {
        return { entry: null, invalid };
      }

      if (this.textCache && typeof this.textCache.get === "function") {
        try {
          const cached = await this.textCache.get(hash, "processed");
          if (cached) {
            if (this.isValidEntry(cached, hash, retentionMs)) {
              return { entry: cached, invalid };
            }
            invalid = true;
            if (typeof this.textCache.delete === "function") {
              await this.textCache.delete(hash);
            }
          }
        } catch (error) {
          console.warn("Error reading text cache:", error);
        }
      }

      const raw = this.readStorage(hash);
      if (!raw) {
        return { entry: null, invalid };
      }

      try {
        const parsed = JSON.parse(raw);
        if (!this.isValidEntry(parsed, hash, retentionMs)) {
          invalid = true;
          this.removeStorage(hash);
          return { entry: null, invalid };
        }

        if (this.textCache && typeof this.textCache.set === "function") {
          try {
            await this.textCache.set(hash, parsed, "processed");
          } catch (error) {
            console.warn("Error hydrating text cache:", error);
          }
        }

        return { entry: parsed, invalid };
      } catch (_error) {
        invalid = true;
        this.removeStorage(hash);
        return { entry: null, invalid };
      }
    }

    async storeLocalEntry(hash, entry) {
      if (!hash || !entry) {
        return false;
      }

      try {
        if (this.textCache && typeof this.textCache.set === "function") {
          await this.textCache.set(hash, entry, "processed");
        }

        const serialized = JSON.stringify(entry);
        this.writeStorage(hash, serialized);
        return true;
      } catch (error) {
        console.error("Error storing local cache:", error);
        return false;
      }
    }

    normalizeEntry(entry, fallbackMetadata) {
      if (entry && entry.analysis && entry.metadata) {
        return entry;
      }

      const { metadata, timestamp, version, ...rest } = entry || {};
      return {
        analysis: entry && entry.analysis ? entry.analysis : rest,
        metadata: metadata || fallbackMetadata,
        timestamp,
        version,
      };
    }

    isValidEntry(entry, expectedHash, retentionMs) {
      if (!entry || typeof entry !== "object") {
        return false;
      }

      if (!Number.isFinite(entry.timestamp)) {
        return false;
      }

      if (Date.now() - entry.timestamp > retentionMs) {
        return false;
      }

      if (!entry.metadata || entry.metadata.hash !== expectedHash) {
        return false;
      }

      if (!entry.analysis || typeof entry.analysis !== "object") {
        return false;
      }

      return true;
    }

    getStorageKey(hash) {
      return `tg_analysis_${hash}`;
    }

    readStorage(hash) {
      const key = this.getStorageKey(hash);

      try {
        if (
          typeof localStorage !== "undefined" &&
          typeof localStorage.getItem === "function"
        ) {
          const value = localStorage.getItem(key);
          if (value != null) {
            return value;
          }
        }
      } catch (_error) {}

      try {
        if (typeof __TEST_MOCK_STORAGE !== "undefined") {
          const value = __TEST_MOCK_STORAGE.get(key);
          if (value != null) {
            return value;
          }
        }
      } catch (_error) {}

      return null;
    }

    writeStorage(hash, value) {
      const key = this.getStorageKey(hash);

      try {
        if (
          typeof localStorage !== "undefined" &&
          typeof localStorage.setItem === "function"
        ) {
          localStorage.setItem(key, value);
        }
      } catch (_error) {}

      try {
        if (typeof __TEST_MOCK_STORAGE !== "undefined") {
          __TEST_MOCK_STORAGE.set(key, value);
        }
      } catch (_error) {}
    }

    removeStorage(hash) {
      const key = this.getStorageKey(hash);

      try {
        if (
          typeof localStorage !== "undefined" &&
          typeof localStorage.removeItem === "function"
        ) {
          localStorage.removeItem(key);
        }
      } catch (_error) {}

      try {
        if (typeof __TEST_MOCK_STORAGE !== "undefined") {
          __TEST_MOCK_STORAGE.delete(key);
        }
      } catch (_error) {}
    }

    async shouldUseCloudLookup() {
      if (
        !this.databaseService ||
        typeof this.databaseService.checkDocumentExists !== "function"
      ) {
        return false;
      }

      if (
        this.preferenceService &&
        typeof this.preferenceService.getPreferences === "function"
      ) {
        try {
          const prefs = await this.preferenceService.getPreferences();
          return prefs.processingMode === "cloud" && !prefs.isPaidUser;
        } catch (error) {
          console.warn("Error checking cloud preferences:", error);
          return true;
        }
      }

      return true;
    }

    async shouldUseCloudStorage() {
      if (
        !this.databaseService ||
        typeof this.databaseService.storeAnalysis !== "function"
      ) {
        return false;
      }

      return await this.shouldUseCloudLookup();
    }

    async getCloudCache(hash) {
      try {
        if (
          !this.databaseService ||
          typeof this.databaseService.checkDocumentExists !== "function"
        ) {
          return null;
        }

        const result = await this.databaseService.checkDocumentExists(hash);
        if (!result || !result.exists) {
          return null;
        }

        const payload = result.analysis;
        if (!payload) {
          return null;
        }

        if (payload.analysis && payload.metadata) {
          return payload;
        }

        return {
          analysis: payload,
          metadata: {
            hash,
            ...(payload.metadata && typeof payload.metadata === "object"
              ? payload.metadata
              : {}),
          },
          timestamp: payload.timestamp || Date.now(),
          version: payload.version || 1,
        };
      } catch (error) {
        console.warn("Cloud cache lookup failed:", error);
        return null;
      }
    }

    async storeCloudCache(hash, metadata, analysisResults) {
      try {
        if (
          !this.databaseService ||
          typeof this.databaseService.storeAnalysis !== "function"
        ) {
          return true;
        }

        return await this.databaseService.storeAnalysis(
          hash,
          metadata,
          analysisResults,
        );
      } catch (error) {
        console.warn("Cloud cache storage failed:", error);
        return false;
      }
    }

    async getRetentionMs() {
      if (
        this.preferenceService &&
        typeof this.preferenceService.getCacheRetentionMs === "function"
      ) {
        try {
          const value = await this.preferenceService.getCacheRetentionMs();
          if (Number.isFinite(value) && value > 0) {
            return value;
          }
        } catch (error) {
          console.warn("Error resolving cache retention:", error);
        }
      }

      return DEFAULT_RETENTION_MS;
    }

    getStats() {
      const hits = this.stats.localHits + this.stats.cloudHits;
      const total = hits + this.stats.misses;
      return {
        hits,
        misses: this.stats.misses,
        hitRate: total > 0 ? hits / total : 0,
        totalEntries: this.localHashes.size,
      };
    }

    async clearCache() {
      try {
        if (this.textCache && typeof this.textCache.delete === "function") {
          for (const hash of this.localHashes) {
            try {
              await this.textCache.delete(hash);
            } catch (error) {
              console.warn("Error clearing text cache entry:", error);
            }
          }
        }

        for (const hash of this.localHashes) {
          this.removeStorage(hash);
        }

        this.localHashes.clear();
        this.stats = {
          localHits: 0,
          cloudHits: 0,
          misses: 0,
          stores: 0,
        };
        this.hasStoredAny = false;
        return true;
      } catch (error) {
        console.error("Error clearing cache:", error);
        return false;
      }
    }

    async invalidateHash(hash) {
      if (!hash) {
        return false;
      }

      try {
        if (this.textCache && typeof this.textCache.delete === "function") {
          await this.textCache.delete(hash);
        }
      } catch (error) {
        console.warn("Error removing text cache entry:", error);
      }

      this.removeStorage(hash);
      this.localHashes.delete(hash);
      return true;
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { EnhancedCacheService };
  } else {
    global.EnhancedCacheService = EnhancedCacheService;
  }
})(typeof window !== "undefined" ? window : global);
