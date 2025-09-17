/**
 * @file src/services/contentHashService.js
 * @description Content hashing service for detecting changes in ToS documents
 * @version 1.0.0
 */

(function (global) {
  "use strict";

  class ContentHashService {
    constructor() {
      this.algorithm = "SHA-256";
      this.saltKey = "terms-guardian-v1";
    }

    /**
     * Generate a unique hash for content at a specific URL
     * @param {string} url The page URL
     * @param {string} content The extracted text content
     * @returns {Promise<string>} SHA-256 hash
     */
    async generateHash(url, content) {
      // Normalize content for consistent hashing
      const normalizedContent = this.normalizeContent(content);

      // Create hash input: URL + normalized content + version salt
      const hashInput = `${url}:${normalizedContent}:${this.saltKey}`;

      try {
        // Try browser Web Crypto API first
        if (typeof crypto !== "undefined" && crypto.subtle) {
          const encoder = new TextEncoder();
          const data = encoder.encode(hashInput);
          const hashBuffer = await crypto.subtle.digest("SHA-256", data);

          return Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        }
      } catch (error) {
        // Web Crypto not available, continue to fallback
      }

      // Try Node.js crypto as fallback
      if (typeof require !== "undefined") {
        try {
          const crypto = require("crypto");
          const hash = crypto.createHash("sha256");
          hash.update(hashInput);
          return hash.digest("hex");
        } catch (error) {
          // Node crypto not available, continue to simple fallback
        }
      }

      // Final fallback to simple hash for compatibility
      return this.generateFallbackHash(url, content);
    }

    /**
     * Normalize content for consistent hashing
     * @param {string} content Raw content
     * @returns {string} Normalized content
     */
    normalizeContent(content) {
      if (!content || typeof content !== "string") {
        return "";
      }

      return content
        .replace(/\s+/g, " ") // Normalize whitespace
        .replace(/[^\w\s]/g, "") // Remove special characters
        .toLowerCase() // Case insensitive
        .trim();
    }

    /**
     * Generate comprehensive metadata for a document
     * @param {string} url Page URL
     * @param {string} content Extracted content
     * @returns {Promise<Object>} Document metadata
     */
    async generateMetadata(url, content) {
      const hash = await this.generateHash(url, content);
      const normalizedContent = this.normalizeContent(content);

      return {
        hash,
        url: this.normalizeUrl(url),
        contentLength: content.length,
        normalizedLength: normalizedContent.length,
        wordCount: normalizedContent.split(" ").length,
        timestamp: Date.now(),
        version: 1,
        checksums: {
          raw: this.simpleChecksum(content),
          normalized: this.simpleChecksum(normalizedContent),
        },
      };
    }

    /**
     * Normalize URL for consistent hashing
     * @param {string} url Raw URL
     * @returns {string} Normalized URL
     */
    normalizeUrl(url) {
      try {
        const urlObj = new URL(url);
        // Remove fragment and common tracking parameters
        urlObj.hash = "";
        const paramsToRemove = [
          "utm_source",
          "utm_medium",
          "utm_campaign",
          "fbclid",
          "gclid",
        ];
        paramsToRemove.forEach((param) => urlObj.searchParams.delete(param));
        return urlObj.toString();
      } catch (error) {
        // Fallback to original URL if parsing fails
        return url;
      }
    }

    /**
     * Generate a simple checksum for validation
     * @param {string} str Input string
     * @returns {number} Simple checksum
     */
    simpleChecksum(str) {
      let hash = 0;
      if (str.length === 0) return hash;

      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }

      return Math.abs(hash);
    }

    /**
     * Fallback hash generation for older browsers
     * @param {string} url Page URL
     * @param {string} content Content
     * @returns {string} Fallback hash
     */
    generateFallbackHash(url, content) {
      const normalizedContent = this.normalizeContent(content);
      const input = `${url}:${normalizedContent}:${this.saltKey}`;

      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }

      return Math.abs(hash).toString(16);
    }

    /**
     * Compare two content hashes to detect changes
     * @param {string} hash1 First hash
     * @param {string} hash2 Second hash
     * @returns {boolean} True if content is the same
     */
    compareHashes(hash1, hash2) {
      return hash1 === hash2;
    }

    /**
     * Validate a hash format
     * @param {string} hash Hash to validate
     * @returns {boolean} True if valid hash format
     */
    isValidHash(hash) {
      if (!hash || typeof hash !== "string") {
        return false;
      }

      // SHA-256 produces 64 character hex string
      return /^[a-f0-9]{64}$/i.test(hash) || /^[a-f0-9]+$/.test(hash);
    }
  }

  // Export for both environments
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { ContentHashService };
  } else {
    global.ContentHashService = ContentHashService;
  }
})(typeof window !== "undefined" ? window : global);
