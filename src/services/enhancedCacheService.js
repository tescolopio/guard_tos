/**
 * @file src/services/enhancedCacheService.js
 * @description Enhanced cache service with hash-based lookup and database integration
 * @version 1.0.0
 */

(function (global) {
  "use strict";

  // Import dependencies
  const ContentHashService =
    global.ContentHashService ||
    require("./contentHashService").ContentHashService;

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
    }

    /**
     * Get cached analysis for content
     * @param {string} url Page URL
     * @param {string} content Extracted content
     * @returns {Promise<Object>} Cache result
     */
    async getCachedAnalysis(url, content) {
      try {
        // Generate content metadata with hash
        const metadata = await this.hashService.generateMetadata(url, content);

        // Check local cache first
        const localResult = await this.getLocalCache(metadata.hash);
        if (localResult) {
          this.stats.localHits++;
          return {
            source: "local",
            data: localResult,
            metadata,
            cached: true,
          };
        }

        // Check cloud database if available and enabled
        if (this.databaseService && (await this.shouldUseCloudLookup())) {
          const cloudResult = await this.getCloudCache(metadata.hash);
          if (cloudResult) {
            this.stats.cloudHits++;
            // Cache locally for future use
            await this.storeLocalCache(metadata.hash, cloudResult);
            return {
              source: "cloud",
              data: cloudResult,
              metadata,
              cached: true,
            };
          }
        }

        // No cache hit
        this.stats.misses++;
        return {
          source: null,
          data: null,
          metadata,
          cached: false,
        };
      } catch (error) {
        console.error("Error in getCachedAnalysis:", error);
        // Return non-cached result on error
        return {
          source: null,
          data: null,
          metadata: null,
          cached: false,
          error: error.message,
        };
      }
    }

    /**
     * Store analysis results in cache
     * @param {Object} metadata Document metadata
     * @param {Object} analysisResults Analysis results
     * @returns {Promise<boolean>} Success status
     */
    async storeAnalysis(metadata, analysisResults) {
      try {
        const cacheEntry = {
          ...analysisResults,
          metadata,
          timestamp: Date.now(),
          version: 1,
        };

        // Always store locally
        const localSuccess = await this.storeLocalCache(
          metadata.hash,
          cacheEntry,
        );

        // Store in cloud if available and enabled
        let cloudSuccess = true;
        if (this.databaseService && (await this.shouldUseCloudStorage())) {
          cloudSuccess = await this.storeCloudCache(
            metadata.hash,
            metadata,
            analysisResults,
          );
        }

        if (localSuccess) {
          this.stats.stores++;
        }

        return localSuccess && cloudSuccess;
      } catch (error) {
        console.error("Error storing analysis:", error);
        return false;
      }
    }

    /**
     * Get analysis from local cache
     * @param {string} hash Content hash
     * @returns {Promise<Object|null>} Cached data or null
     */
    async getLocalCache(hash) {
      try {
        const cached = await this.textCache.get(hash, "processed");

        if (cached && this.isValidCacheEntry(cached)) {
          return cached;
        }

        // Clean up expired entry
        if (cached) {
          await this.textCache.delete(hash);
        }

        return null;
      } catch (error) {
        console.error("Error getting local cache:", error);
        return null;
      }
    }

    /**
     * Store analysis in local cache
     * @param {string} hash Content hash
     * @param {Object} data Analysis data
     * @returns {Promise<boolean>} Success status
     */
    async storeLocalCache(hash, data) {
      try {
        await this.textCache.set(hash, data, "processed");
        return true;
      } catch (error) {
        console.error("Error storing local cache:", error);
        return false;
      }
    }

    /**
     * Get analysis from cloud cache
     * @param {string} hash Content hash
     * @returns {Promise<Object|null>} Cached data or null
     */
    async getCloudCache(hash) {
      try {
        if (!this.databaseService) {
          return null;
        }

        const result = await this.databaseService.checkDocumentExists(hash);
        return result.exists ? result.analysis : null;
      } catch (error) {
        console.warn("Cloud cache lookup failed:", error);
        return null;
      }
    }

    /**
     * Store analysis in cloud cache
     * @param {string} hash Content hash
     * @param {Object} metadata Document metadata
     * @param {Object} analysisResults Analysis results
     * @returns {Promise<boolean>} Success status
     */
    async storeCloudCache(hash, metadata, analysisResults) {
      try {
        if (!this.databaseService) {
          return true; // Consider success if no cloud service
        }

        return await this.databaseService.storeAnalysis(
          hash,
          metadata,
          analysisResults,
        );
      } catch (error) {
        console.warn("Cloud cache storage failed:", error);
        return false; // Don't fail local processing due to cloud issues
      }
    }

    /**
     * Check if cached entry is still valid
     * @param {Object} entry Cache entry
     * @returns {boolean} True if valid
     */
    isValidCacheEntry(entry) {
      if (!entry || !entry.timestamp) {
        return false;
      }

      // Default 30 days retention
      const maxAge = 30 * 24 * 60 * 60 * 1000;
      return Date.now() - entry.timestamp < maxAge;
    }

    /**
     * Check if cloud lookup should be used
     * @returns {Promise<boolean>} True if should use cloud
     */
    async shouldUseCloudLookup() {
      if (!this.preferenceService) {
        return false; // Default to local only
      }

      try {
        const preferences = await this.preferenceService.getPreferences();
        return (
          preferences.processingMode === "cloud" && !preferences.isPaidUser
        );
      } catch (error) {
        console.warn("Error checking cloud preferences:", error);
        return false;
      }
    }

    /**
     * Check if cloud storage should be used
     * @returns {Promise<boolean>} True if should use cloud storage
     */
    async shouldUseCloudStorage() {
      // For now, same logic as lookup
      return await this.shouldUseCloudLookup();
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getStats() {
      const textCacheStats = this.textCache.getStats
        ? this.textCache.getStats()
        : {};

      return {
        ...this.stats,
        hitRate:
          this.stats.localHits + this.stats.cloudHits + this.stats.misses > 0
            ? (
                ((this.stats.localHits + this.stats.cloudHits) /
                  (this.stats.localHits +
                    this.stats.cloudHits +
                    this.stats.misses)) *
                100
              ).toFixed(2) + "%"
            : "0%",
        localCacheSize: textCacheStats.processed || 0,
        totalRequests:
          this.stats.localHits + this.stats.cloudHits + this.stats.misses,
      };
    }

    /**
     * Clear all cached data
     * @returns {Promise<boolean>} Success status
     */
    async clearCache() {
      try {
        // Clear local cache
        if (this.textCache.cleanup) {
          this.textCache.cleanup();
        }

        // Reset stats
        this.stats = {
          localHits: 0,
          cloudHits: 0,
          misses: 0,
          stores: 0,
        };

        return true;
      } catch (error) {
        console.error("Error clearing cache:", error);
        return false;
      }
    }

    /**
     * Invalidate cache for a specific hash
     * @param {string} hash Content hash to invalidate
     * @returns {Promise<boolean>} Success status
     */
    async invalidateHash(hash) {
      try {
        await this.textCache.delete(hash);
        return true;
      } catch (error) {
        console.error("Error invalidating hash:", error);
        return false;
      }
    }
  }

  // Export for both environments
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { EnhancedCacheService };
  } else {
    global.EnhancedCacheService = EnhancedCacheService;
  }
})(typeof window !== "undefined" ? window : global);
