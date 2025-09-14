/**
 * @file constants.js
 * @description Central configuration and constants for the Terms Guardian extension
 * @version 2.0.0
 * @date 2024-10-29
 *
 * @author Timmothy Escolopio
 * @company 3D Tech Solutions LLC
 */

const EXT_CONSTANTS = {
  // Extension Settings
  EXTENSION: {
    NAME: "Terms Guardian",
    VERSION: "1.0.0",
    ICON_PATHS: {
      SMALL: "images/icon16.png",
      MEDIUM: "images/icon48.png",
      LARGE: "images/icon128.png",
    },
  },

  // Detection Settings
  DETECTION: {
    INTERVAL_MS: 5000, // 5 seconds between scans (in milliseconds)
    THRESHOLDS: {
      AUTO_GRADE: 20, // Number of legal terms to trigger automatic grading
      NOTIFY: 10, // Number of legal terms to trigger notification
      HIGHLIGHT: 20, // Number of highlighted terms before extracting full text
      SECTION: 10, // Minimum legal terms in a section to consider it legal text
      PROXIMITY: 5, // Maximum word distance for proximity matching
    },
    // Gates for pattern-based fallback path
    FALLBACK_GATES: {
      MIN_WORDS_FOR_FALLBACK: 50,
      MIN_PATTERN_SCORE: 0.3,
    },
  },

  // Analysis Settings
  ANALYSIS: {
    PERFORMANCE_THRESHOLDS: {
      TEXT_PROCESSING: 100,
      API_CALL: 2000,
      GRADE_CALCULATION: 50,
      RIGHTS_ANALYSIS: 150,
      EXTRACTION: 200,
    },
    CHUNK_SIZE: 500, // Size of text chunks for processing
    MIN_WORD_LENGTH: 3, // Minimum length for word analysis
    MAX_RETRIES: 3, // Maximum API retry attempts
    CACHE_DURATION: 86400000, // Cache duration in ms (24 hours)
    GRADES: {
      A: { MIN: 90, LABEL: "Excellent" },
      B: { MIN: 80, LABEL: "Good" },
      C: { MIN: 70, LABEL: "Fair" },
      D: { MIN: 60, LABEL: "Poor" },
      F: { MIN: 0, LABEL: "Very Poor" },
    },
    DEFINITION_CACHE_TIME: 24 * 60 * 60 * 1000,
    BATCH_SIZE: 50,
    PRIORITIZE_LEGAL: true,
    COMPOUND_TERMS: true,
    DICTIONARY: {
      CACHE_SIZE: 1000,
    },
    // Rights scoring rubric configuration
    RIGHTS: {
      NORMALIZATION_PER_WORDS: 1000, // normalize signal counts per N words
      WEIGHTS: {
        // penalties (negative weights)
        HIGH_RISK: {
          ARBITRATION: -15,
          CLASS_ACTION_WAIVER: -15,
          UNILATERAL_CHANGES: -12,
          DATA_SALE_OR_SHARING: -10,
          AUTO_RENEWAL_FRICTION: -8,
          NEGATIVE_OPTION_BILLING: -8,
          DELEGATION_ARBITRABILITY: -10,
        },
        // medium risk
        MEDIUM_RISK: {
          ARBITRATION_CARVEOUTS: -6,
          VAGUE_CONSENT: -5,
          LIMITED_RETENTION_DISCLOSURE: -5,
          MORAL_RIGHTS_WAIVER: -5,
          JURY_TRIAL_WAIVER: -6,
        },
        // positives (bonuses)
        POSITIVES: {
          CLEAR_OPT_OUT: 5,
          SELF_SERVICE_DELETION: 5,
          NO_DATA_SALE: 6,
          TRANSPARENT_RETENTION: 4,
        },
        CAPS: {
          MAX_NEGATIVE: -60,
          MAX_POSITIVE: 20,
        },
      },
      GRADING: {
        // Map numeric score (0-100) to letter grade
        A: { MIN: 85 },
        B: { MIN: 75 },
        C: { MIN: 65 },
        D: { MIN: 50 },
        F: { MIN: 0 },
      },
      CONFIDENCE: {
        COVERAGE_WEIGHT: 0.4,
        SIGNAL_WEIGHT: 0.4,
        TYPE_WEIGHT: 0.2,
      },
    },
  },

  // Notification Messages
  MESSAGES: {
    AUTO_GRADE:
      "Terms Guardian has detected a legal document and is currently grading it. Click the extension badge at the top of the browser to see the readability and how it affects your rights by agreeing to it. This is for educational purposes only and is not legal advice.",
    SIGNIFICANT_TERMS:
      "A significant number of legal terms have been found on this page. Click the Terms Guardian Extension badge at the top of the screen to grade the text. If this is not a legal document like a Terms of Service you can still grade sections of text by selecting the text you want to grade and right clicking to bring up the context menu, then click 'grade this text' to learn more about it. This is for educational purposes only and is not legal advice.",
    NO_LEGAL_TEXT: "No legal text was found on this page.",
    ERROR: {
      MODEL_LOAD: "Error loading analysis model",
      API_ERROR: "Error communicating with definition service",
      INVALID_TEXT: "Invalid or empty text provided",
      GENERAL: "An unexpected error occurred. Please try again later.",
      PERFORMANCE: "Operation took longer than expected",
      STORAGE_FULL: "Storage limit reached",
      NETWORK: "Network connection error",
      UNKNOWN_ACTION: "Unknown action requested",
      ANALYSIS_FAILED: "Analysis failed. Please try again.",
    },
  },
  // Regex patterns for syllable counting
  SYLLABLE_PATTERNS: {
    SUBTRACT: [
      /cial/,
      /tia/,
      /cius/,
      /cious/,
      /giu/,
      /ion/,
      /iou/,
      /sia$/,
      /.ely$/,
      /sed$/,
    ],
    ADD: [
      /ia/,
      /riet/,
      /dien/,
      /iu/,
      /io/,
      /ii/,
      /[aeiouym]bl$/,
      /[aeiou]{3}/,
      /^mc/,
      /ism$/,
      /([^aeiouy])\1l$/,
      /[^l]lien/,
      /^coa[dglx]./,
      /[^gq]ua[^auieo]/,
      /dnt$/,
    ],
  },

  // Error Types
  ERROR_TYPES: {
    MODEL_LOAD: "MODEL_LOAD",
    API_ERROR: "API_ERROR",
    INVALID_TEXT: "INVALID_TEXT",
    GENERAL: "GENERAL",
    PERFORMANCE: "PERFORMANCE",
    STORAGE_FULL: "STORAGE_FULL",
    NETWORK: "NETWORK",
    EXTRACTION: {
      INCOMPLETE_HTML: "INCOMPLETE_HTML",
      MALFORMED_HTML: "MALFORMED_HTML",
      PDF_EXTRACTION: "PDF_EXTRACTION",
      DOCX_EXTRACTION: "DOCX_EXTRACTION",
      INVALID_INPUT: "INVALID_INPUT",
    },
  },

  // Debug Settings
  DEBUG: {
    LEVELS: {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      TRACE: 4,
    },
    DEFAULT_LEVEL: 2, // INFO level
    // Feature flags and diagnostics config
    FEATURES: {
      DICTIONARY_METRICS: {
        ENABLED: true,
        POLL_MS: 10000,
      },
    },
    STORAGE: {
      KEY: "debugLogs",
      MAX_ENTRIES: 1000,
      EXPORT_FORMAT: "json",
      ROTATION_SIZE: 500, // Entries to keep when rotating logs
    },
    PERFORMANCE: {
      ENABLED: true,
      THRESHOLD_WARNING: 100, // ms
      THRESHOLD_ERROR: 1000, // ms
      SAMPLE_RATE: 0.1, // 10% of operations
    },
    MODULES: {
      CONTENT: "content",
      RIGHTS: "rights",
      READABILITY: "readability",
      EXTRACTION: "extraction",
      API: "api",
      STORAGE: "storage",
    },
  },

  // DOM Element Classes
  CLASSES: {
    HIGHLIGHT: "legal-term-highlight",
    SECTION: "legal-text-section",
    IMPORTANT: "important-term",
  },

  // DOM Selectors
  SELECTORS: {
    LEGAL_SECTIONS: [
      "main",
      "article",
      "section",
      'div[class*="terms"]',
      'div[id*="terms"]',
      'div[class*="legal"]',
      'div[id*="legal"]',
    ],
    EXCLUDE_ELEMENTS: [
      "nav",
      "header",
      "footer",
      "script",
      "style",
      "iframe",
      "object",
      "embed",
      "noscript",
    ],
    POPUPS: {
      READABILITY: "#readabilityPopup",
      RIGHTS: "#rightsPopup",
      EXCERPTS: "#excerptsPopup",
      TERMS: "#termsPopup",
    },
  },

  // Local Storage Keys
  STORAGE_KEYS: {
    LAST_WORD: "lastWord",
    ANALYSIS_RESULTS: "analysisResults",
    CACHE_PREFIX: "termsDef_",
    SETTINGS: "guardianSettings",
    DEBUG_LOGS: "debugLogs",
    PERFORMANCE_METRICS: "perfMetrics",
    DICTIONARY_METRICS: "dictionaryMetrics",
  },

  // Context Menu Items
  CONTEXT_MENU: {
    GRADE_TEXT: {
      id: "gradeThisText",
      title: "Grade this text",
      contexts: ["selection"],
    },
  },
};

// Named exports for specific constant groups
// Commented out ES6 export to avoid module conflicts
// export const {
//   EXTENSION,
//   DETECTION,
//   ANALYSIS,
//   MESSAGES,
//   ERROR_TYPES,
//   DEBUG,
//   CLASSES,
//   SELECTORS,
//   STORAGE_KEYS,
//   CONTEXT_MENU,
// } = EXT_CONSTANTS;

// Initialize extension globals
const initializeGlobals = () => {
  try {
    if (typeof window !== "undefined") {
      window.EXT_CONSTANTS = EXT_CONSTANTS;
    }
    if (typeof globalThis !== "undefined") {
      globalThis.EXT_CONSTANTS = EXT_CONSTANTS;
    }
  } catch (e) {
    console.warn("Could not initialize global constants:", e);
  }
};

initializeGlobals();

// Export a function to manually initialize globals if needed
// export const setupConstants = initializeGlobals;

// CommonJS compatibility for testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    EXT_CONSTANTS,
    EXTENSION: EXT_CONSTANTS.EXTENSION,
    DETECTION: EXT_CONSTANTS.DETECTION,
    ANALYSIS: EXT_CONSTANTS.ANALYSIS,
    MESSAGES: EXT_CONSTANTS.MESSAGES,
    ERROR_TYPES: EXT_CONSTANTS.ERROR_TYPES,
    DEBUG: EXT_CONSTANTS.DEBUG,
    CLASSES: EXT_CONSTANTS.CLASSES,
    SELECTORS: EXT_CONSTANTS.SELECTORS,
    STORAGE_KEYS: EXT_CONSTANTS.STORAGE_KEYS,
    CONTEXT_MENU: EXT_CONSTANTS.CONTEXT_MENU,
    setupConstants: initializeGlobals,
  };
}
