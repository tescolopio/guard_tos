/**
 * @file src/services/userPreferenceService.js
 * @description User preference management for Terms Guardian
 * @version 1.0.0
 */

(function (global) {
  "use strict";

  class UserPreferenceService {
    constructor() {
      this.storageKey = "termsGuardianPreferences";
      this.defaults = {
        processingMode: "cloud", // 'cloud' | 'local'
        isPaidUser: false,
        cloudDatabaseUrl: "http://localhost:3001",
        cacheRetentionDays: 30,
        autoUpdateEnabled: true,
        enableHashCaching: true,
        debugMode: false,
      };
    }

    /**
     * Get user preferences
     * @returns {Promise<Object>} User preferences
     */
    async getPreferences() {
      try {
        // Try chrome.storage.sync first, fallback to localStorage
        if (
          typeof chrome !== "undefined" &&
          chrome.storage &&
          chrome.storage.sync
        ) {
          const result = await chrome.storage.sync.get(this.storageKey);
          return { ...this.defaults, ...result[this.storageKey] };
        } else {
          // Fallback to localStorage for testing
          const stored = localStorage.getItem(this.storageKey);
          const parsed = stored ? JSON.parse(stored) : {};
          return { ...this.defaults, ...parsed };
        }
      } catch (error) {
        console.warn("Failed to load preferences, using defaults:", error);
        return this.defaults;
      }
    }

    /**
     * Set user preferences
     * @param {Object} preferences Preferences to update
     * @returns {Promise<boolean>} Success status
     */
    async setPreferences(preferences) {
      try {
        const current = await this.getPreferences();
        const updated = { ...current, ...preferences };

        if (
          typeof chrome !== "undefined" &&
          chrome.storage &&
          chrome.storage.sync
        ) {
          await chrome.storage.sync.set({ [this.storageKey]: updated });
        } else {
          // Fallback to localStorage
          localStorage.setItem(this.storageKey, JSON.stringify(updated));
        }

        console.log("User preferences updated:", updated);
        return true;
      } catch (error) {
        console.error("Failed to save preferences:", error);
        return false;
      }
    }

    /**
     * Check if cloud processing should be used
     * @returns {Promise<boolean>} True if should use cloud
     */
    async shouldUseCloudProcessing() {
      try {
        const prefs = await this.getPreferences();
        // Use cloud if enabled and user is not paid (paid users can opt for local)
        return prefs.processingMode === "cloud" && prefs.enableHashCaching;
      } catch (error) {
        console.warn("Error checking cloud preferences:", error);
        return false; // Default to local only
      }
    }

    /**
     * Check if hash caching is enabled
     * @returns {Promise<boolean>} True if hash caching enabled
     */
    async isHashCachingEnabled() {
      try {
        const prefs = await this.getPreferences();
        return prefs.enableHashCaching;
      } catch (error) {
        console.warn("Error checking hash caching preference:", error);
        return true; // Default to enabled
      }
    }

    /**
     * Get cache retention period in milliseconds
     * @returns {Promise<number>} Retention period in ms
     */
    async getCacheRetentionMs() {
      try {
        const prefs = await this.getPreferences();
        return prefs.cacheRetentionDays * 24 * 60 * 60 * 1000;
      } catch (error) {
        console.warn("Error getting cache retention:", error);
        return 30 * 24 * 60 * 60 * 1000; // Default 30 days
      }
    }

    /**
     * Toggle processing mode between local and cloud
     * @returns {Promise<string>} New processing mode
     */
    async toggleProcessingMode() {
      try {
        const prefs = await this.getPreferences();
        const newMode = prefs.processingMode === "cloud" ? "local" : "cloud";
        await this.setPreferences({ processingMode: newMode });
        return newMode;
      } catch (error) {
        console.error("Error toggling processing mode:", error);
        return "local";
      }
    }

    /**
     * Enable debug mode
     * @param {boolean} enabled Debug mode enabled
     * @returns {Promise<boolean>} Success status
     */
    async setDebugMode(enabled) {
      return await this.setPreferences({ debugMode: enabled });
    }

    /**
     * Check if debug mode is enabled
     * @returns {Promise<boolean>} True if debug mode enabled
     */
    async isDebugMode() {
      try {
        const prefs = await this.getPreferences();
        return prefs.debugMode;
      } catch (error) {
        return false;
      }
    }

    /**
     * Reset preferences to defaults
     * @returns {Promise<boolean>} Success status
     */
    async resetToDefaults() {
      try {
        if (
          typeof chrome !== "undefined" &&
          chrome.storage &&
          chrome.storage.sync
        ) {
          await chrome.storage.sync.remove(this.storageKey);
        } else {
          localStorage.removeItem(this.storageKey);
        }

        console.log("User preferences reset to defaults");
        return true;
      } catch (error) {
        console.error("Error resetting preferences:", error);
        return false;
      }
    }

    /**
     * Get preference summary for debugging
     * @returns {Promise<Object>} Preference summary
     */
    async getSummary() {
      try {
        const prefs = await this.getPreferences();
        return {
          processingMode: prefs.processingMode,
          isPaidUser: prefs.isPaidUser,
          hashCachingEnabled: prefs.enableHashCaching,
          cacheRetentionDays: prefs.cacheRetentionDays,
          debugMode: prefs.debugMode,
          cloudUrl: prefs.cloudDatabaseUrl,
        };
      } catch (error) {
        console.error("Error getting preference summary:", error);
        return { error: error.message };
      }
    }
  }

  // Export for both environments
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { UserPreferenceService };
  } else {
    global.UserPreferenceService = UserPreferenceService;
  }
})(typeof window !== "undefined" ? window : global);
