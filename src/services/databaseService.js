/**
 * @file src/services/databaseService.js
 * @description Database service for Terms Guardian cloud integration
 * @version 1.0.0
 */

(function (global) {
  "use strict";

  class DatabaseService {
    constructor(config = {}) {
      this.config = {
        apiBaseUrl: config.apiBaseUrl || "http://localhost:3001",
        timeout: config.timeout || 5000,
        retries: config.retries || 3,
        ...config,
      };

      // Enable test mode for Jest environment, API mode for extension
      this.isTestMode = config.testMode || typeof jest !== "undefined";
      this.dbConfig = config.dbConfig || {
        host: "localhost",
        port: 5434,
        database: "terms_guardian",
        user: "tg_user",
        password: "tg_password_dev",
      };
    }

    /**
     * Check if document analysis exists in database
     * @param {string} hash Content hash
     * @returns {Promise<Object>} Result with exists flag and analysis data
     */
    async checkDocumentExists(hash) {
      try {
        if (this.isTestMode) {
          return await this.checkDocumentExistsDB(hash);
        }

        const response = await fetch(
          `${this.config.apiBaseUrl}/api/v1/document/${hash}`,
          {
            method: "GET",
            headers: this.getHeaders(),
            signal: AbortSignal.timeout(this.config.timeout),
          },
        );

        if (response.status === 404) {
          return { exists: false, analysis: null };
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { exists: true, analysis: data };
      } catch (error) {
        console.warn(
          "Database check failed, falling back to local processing:",
          error,
        );
        return { exists: false, analysis: null };
      }
    }

    /**
     * Store analysis results in database
     * @param {string} hash Content hash
     * @param {Object} metadata Document metadata
     * @param {Object} analysisResults Analysis results
     * @returns {Promise<boolean>} Success status
     */
    async storeAnalysis(hash, metadata, analysisResults) {
      try {
        if (this.isTestMode) {
          return await this.storeAnalysisDB(hash, metadata, analysisResults);
        }

        const payload = {
          hash,
          metadata,
          analysis: analysisResults,
          timestamp: Date.now(),
        };

        const response = await fetch(
          `${this.config.apiBaseUrl}/api/v1/document`,
          {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(this.config.timeout),
          },
        );

        return response.ok;
      } catch (error) {
        console.warn("Failed to store analysis in database:", error);
        return false;
      }
    }

    /**
     * Direct database check for testing (simulated)
     * @param {string} hash Content hash
     * @returns {Promise<Object>} Result
     */
    async checkDocumentExistsDB(hash) {
      // Simulate database lookup
      const stored = this.getStoredAnalysis(hash);

      if (stored) {
        console.log(
          `[DB] Found cached analysis for hash: ${hash.substring(0, 8)}...`,
        );
        return { exists: true, analysis: stored };
      }

      console.log(
        `[DB] No cached analysis found for hash: ${hash.substring(0, 8)}...`,
      );
      return { exists: false, analysis: null };
    }

    /**
     * Direct database store for testing (simulated)
     * @param {string} hash Content hash
     * @param {Object} metadata Document metadata
     * @param {Object} analysisResults Analysis results
     * @returns {Promise<boolean>} Success status
     */
    async storeAnalysisDB(hash, metadata, analysisResults) {
      try {
        // Simulate storing in database
        this.setStoredAnalysis(hash, {
          metadata,
          analysis: analysisResults,
          timestamp: Date.now(),
          id: this.generateId(),
        });

        console.log(
          `[DB] Stored analysis for hash: ${hash.substring(0, 8)}...`,
        );
        return true;
      } catch (error) {
        console.error("[DB] Error storing analysis:", error);
        return false;
      }
    }

    /**
     * Get stored analysis (localStorage simulation for testing)
     * @param {string} hash Content hash
     * @returns {Object|null} Stored analysis or null
     */
    getStoredAnalysis(hash) {
      try {
        const key = `tg_analysis_${hash}`;
        const stored = localStorage.getItem(key);

        if (stored) {
          const parsed = JSON.parse(stored);
          // Check if not expired (30 days)
          const maxAge = 30 * 24 * 60 * 60 * 1000;
          if (Date.now() - parsed.timestamp < maxAge) {
            return parsed;
          } else {
            // Clean up expired entry
            localStorage.removeItem(key);
          }
        }

        return null;
      } catch (error) {
        console.error("Error getting stored analysis:", error);
        return null;
      }
    }

    /**
     * Set stored analysis (localStorage simulation for testing)
     * @param {string} hash Content hash
     * @param {Object} data Analysis data
     */
    setStoredAnalysis(hash, data) {
      try {
        const key = `tg_analysis_${hash}`;
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error("Error setting stored analysis:", error);
      }
    }

    /**
     * Get HTTP headers for API requests
     * @returns {Object} Headers object
     */
    getHeaders() {
      return {
        "Content-Type": "application/json",
        "X-Extension-Version": this.getExtensionVersion(),
        "User-Agent": "TermsGuardian-Extension",
      };
    }

    /**
     * Get extension version
     * @returns {string} Version string
     */
    getExtensionVersion() {
      try {
        if (
          typeof chrome !== "undefined" &&
          chrome.runtime &&
          chrome.runtime.getManifest
        ) {
          return chrome.runtime.getManifest().version;
        }
        return "1.0.0";
      } catch (error) {
        return "1.0.0";
      }
    }

    /**
     * Generate a simple ID for testing
     * @returns {string} Generated ID
     */
    generateId() {
      return "test_" + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get database statistics
     * @returns {Promise<Object>} Database statistics
     */
    async getStats() {
      try {
        const keys = Object.keys(localStorage).filter((key) =>
          key.startsWith("tg_analysis_"),
        );
        const totalEntries = keys.length;

        let totalSize = 0;
        let oldestEntry = null;
        let newestEntry = null;

        keys.forEach((key) => {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
            try {
              const parsed = JSON.parse(value);
              if (!oldestEntry || parsed.timestamp < oldestEntry) {
                oldestEntry = parsed.timestamp;
              }
              if (!newestEntry || parsed.timestamp > newestEntry) {
                newestEntry = parsed.timestamp;
              }
            } catch (e) {
              // Ignore invalid entries
            }
          }
        });

        return {
          totalEntries,
          totalSizeBytes: totalSize,
          oldestEntry: oldestEntry ? new Date(oldestEntry).toISOString() : null,
          newestEntry: newestEntry ? new Date(newestEntry).toISOString() : null,
          isTestMode: this.isTestMode,
        };
      } catch (error) {
        console.error("Error getting database stats:", error);
        return {
          totalEntries: 0,
          totalSizeBytes: 0,
          oldestEntry: null,
          newestEntry: null,
          error: error.message,
        };
      }
    }

    /**
     * Clear all stored analysis data (for testing)
     * @returns {Promise<boolean>} Success status
     */
    async clearAll() {
      try {
        const keys = Object.keys(localStorage).filter((key) =>
          key.startsWith("tg_analysis_"),
        );
        keys.forEach((key) => localStorage.removeItem(key));
        console.log(`[DB] Cleared ${keys.length} analysis entries`);
        return true;
      } catch (error) {
        console.error("Error clearing database:", error);
        return false;
      }
    }
  }

  // Export for both environments
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { DatabaseService };
  } else {
    global.DatabaseService = DatabaseService;
  }
})(typeof window !== "undefined" ? window : global);
