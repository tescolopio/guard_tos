const { EXT_CONSTANTS } = require("../../src/utils/constants");

describe("EXT_CONSTANTS", () => {
  test("should have correct extension settings", () => {
    expect(EXT_CONSTANTS.EXTENSION.NAME).toBe("Terms Guardian");
    expect(EXT_CONSTANTS.EXTENSION.VERSION).toBe("1.0.0");
    expect(EXT_CONSTANTS.EXTENSION.ICON_PATHS.SMALL).toBe("images/icon16.png");
    expect(EXT_CONSTANTS.EXTENSION.ICON_PATHS.MEDIUM).toBe("images/icon48.png");
    expect(EXT_CONSTANTS.EXTENSION.ICON_PATHS.LARGE).toBe("images/icon128.png");
  });

  test("should have correct detection settings", () => {
    expect(EXT_CONSTANTS.DETECTION.INTERVAL_MS).toBe(5000);
    expect(EXT_CONSTANTS.DETECTION.THRESHOLDS.AUTO_GRADE).toBe(20);
    expect(EXT_CONSTANTS.DETECTION.THRESHOLDS.NOTIFY).toBe(10);
    expect(EXT_CONSTANTS.DETECTION.THRESHOLDS.HIGHLIGHT).toBe(20);
    expect(EXT_CONSTANTS.DETECTION.THRESHOLDS.SECTION).toBe(10);
    expect(EXT_CONSTANTS.DETECTION.THRESHOLDS.PROXIMITY).toBe(5);
  });

  test("should have correct analysis settings", () => {
    expect(EXT_CONSTANTS.ANALYSIS.PERFORMANCE_THRESHOLDS.TEXT_PROCESSING).toBe(
      100,
    );
    expect(EXT_CONSTANTS.ANALYSIS.PERFORMANCE_THRESHOLDS.API_CALL).toBe(2000);
    expect(
      EXT_CONSTANTS.ANALYSIS.PERFORMANCE_THRESHOLDS.GRADE_CALCULATION,
    ).toBe(50);
    expect(EXT_CONSTANTS.ANALYSIS.PERFORMANCE_THRESHOLDS.RIGHTS_ANALYSIS).toBe(
      150,
    );
    expect(EXT_CONSTANTS.ANALYSIS.PERFORMANCE_THRESHOLDS.EXTRACTION).toBe(200);
    expect(EXT_CONSTANTS.ANALYSIS.CHUNK_SIZE).toBe(500);
    expect(EXT_CONSTANTS.ANALYSIS.MIN_WORD_LENGTH).toBe(3);
    expect(EXT_CONSTANTS.ANALYSIS.MAX_RETRIES).toBe(3);
    expect(EXT_CONSTANTS.ANALYSIS.CACHE_DURATION).toBe(86400000);
    expect(EXT_CONSTANTS.ANALYSIS.GRADES.A.MIN).toBe(90);
    expect(EXT_CONSTANTS.ANALYSIS.GRADES.A.LABEL).toBe("Excellent");
    expect(EXT_CONSTANTS.ANALYSIS.GRADES.B.MIN).toBe(80);
    expect(EXT_CONSTANTS.ANALYSIS.GRADES.B.LABEL).toBe("Good");
    expect(EXT_CONSTANTS.ANALYSIS.GRADES.C.MIN).toBe(70);
    expect(EXT_CONSTANTS.ANALYSIS.GRADES.C.LABEL).toBe("Fair");
    expect(EXT_CONSTANTS.ANALYSIS.GRADES.D.MIN).toBe(60);
    expect(EXT_CONSTANTS.ANALYSIS.GRADES.D.LABEL).toBe("Poor");
    expect(EXT_CONSTANTS.ANALYSIS.GRADES.F.MIN).toBe(0);
    expect(EXT_CONSTANTS.ANALYSIS.GRADES.F.LABEL).toBe("Very Poor");
  });

  test("should have correct notification messages", () => {
    expect(EXT_CONSTANTS.MESSAGES.AUTO_GRADE).toBe(
      "Terms Guardian has detected a legal document and is currently grading it. Click the extension badge at the top of the browser to see the readability and how it affects your rights by agreeing to it. This is for educational purposes only and is not legal advice.",
    );
    expect(EXT_CONSTANTS.MESSAGES.SIGNIFICANT_TERMS).toBe(
      "A significant number of legal terms have been found on this page. Click the Terms Guardian Extension badge at the top of the screen to grade the text. If this is not a legal document like a Terms of Service you can still grade sections of text by selecting the text you want to grade and right clicking to bring up the context menu, then click 'grade this text' to learn more about it. This is for educational purposes only and is not legal advice.",
    );
    expect(EXT_CONSTANTS.MESSAGES.NO_LEGAL_TEXT).toBe(
      "No legal text was found on this page.",
    );
    expect(EXT_CONSTANTS.MESSAGES.ERROR.MODEL_LOAD).toBe(
      "Error loading analysis model",
    );
    expect(EXT_CONSTANTS.MESSAGES.ERROR.API_ERROR).toBe(
      "Error communicating with definition service",
    );
    expect(EXT_CONSTANTS.MESSAGES.ERROR.INVALID_TEXT).toBe(
      "Invalid or empty text provided",
    );
    expect(EXT_CONSTANTS.MESSAGES.ERROR.GENERAL).toBe(
      "An unexpected error occurred. Please try again later.",
    );
    expect(EXT_CONSTANTS.MESSAGES.ERROR.PERFORMANCE).toBe(
      "Operation took longer than expected",
    );
    expect(EXT_CONSTANTS.MESSAGES.ERROR.STORAGE_FULL).toBe(
      "Storage limit reached",
    );
    expect(EXT_CONSTANTS.MESSAGES.ERROR.NETWORK).toBe(
      "Network connection error",
    );
  });

  test("should have correct error types", () => {
    expect(EXT_CONSTANTS.ERROR_TYPES.MODEL_LOAD).toBe("MODEL_LOAD");
    expect(EXT_CONSTANTS.ERROR_TYPES.API_ERROR).toBe("API_ERROR");
    expect(EXT_CONSTANTS.ERROR_TYPES.INVALID_TEXT).toBe("INVALID_TEXT");
    expect(EXT_CONSTANTS.ERROR_TYPES.GENERAL).toBe("GENERAL");
    expect(EXT_CONSTANTS.ERROR_TYPES.PERFORMANCE).toBe("PERFORMANCE");
    expect(EXT_CONSTANTS.ERROR_TYPES.STORAGE_FULL).toBe("STORAGE_FULL");
    expect(EXT_CONSTANTS.ERROR_TYPES.NETWORK).toBe("NETWORK");
    expect(EXT_CONSTANTS.ERROR_TYPES.EXTRACTION.INCOMPLETE_HTML).toBe(
      "INCOMPLETE_HTML",
    );
    expect(EXT_CONSTANTS.ERROR_TYPES.EXTRACTION.MALFORMED_HTML).toBe(
      "MALFORMED_HTML",
    );
    expect(EXT_CONSTANTS.ERROR_TYPES.EXTRACTION.PDF_EXTRACTION).toBe(
      "PDF_EXTRACTION",
    );
    expect(EXT_CONSTANTS.ERROR_TYPES.EXTRACTION.DOCX_EXTRACTION).toBe(
      "DOCX_EXTRACTION",
    );
    expect(EXT_CONSTANTS.ERROR_TYPES.EXTRACTION.INVALID_INPUT).toBe(
      "INVALID_INPUT",
    );
  });

  test("should have correct debug settings", () => {
    expect(EXT_CONSTANTS.DEBUG.LEVELS.ERROR).toBe(0);
    expect(EXT_CONSTANTS.DEBUG.LEVELS.WARN).toBe(1);
    expect(EXT_CONSTANTS.DEBUG.LEVELS.INFO).toBe(2);
    expect(EXT_CONSTANTS.DEBUG.LEVELS.DEBUG).toBe(3);
    expect(EXT_CONSTANTS.DEBUG.LEVELS.TRACE).toBe(4);
    expect(EXT_CONSTANTS.DEBUG.DEFAULT_LEVEL).toBe(2);
    expect(EXT_CONSTANTS.DEBUG.STORAGE.KEY).toBe("debugLogs");
    expect(EXT_CONSTANTS.DEBUG.STORAGE.MAX_ENTRIES).toBe(1000);
    expect(EXT_CONSTANTS.DEBUG.STORAGE.EXPORT_FORMAT).toBe("json");
    expect(EXT_CONSTANTS.DEBUG.STORAGE.ROTATION_SIZE).toBe(500);
    expect(EXT_CONSTANTS.DEBUG.PERFORMANCE.ENABLED).toBe(true);
    expect(EXT_CONSTANTS.DEBUG.PERFORMANCE.THRESHOLD_WARNING).toBe(100);
    expect(EXT_CONSTANTS.DEBUG.PERFORMANCE.THRESHOLD_ERROR).toBe(1000);
    expect(EXT_CONSTANTS.DEBUG.PERFORMANCE.SAMPLE_RATE).toBe(0.1);
    expect(EXT_CONSTANTS.DEBUG.MODULES.CONTENT).toBe("content");
    expect(EXT_CONSTANTS.DEBUG.MODULES.RIGHTS).toBe("rights");
    expect(EXT_CONSTANTS.DEBUG.MODULES.READABILITY).toBe("readability");
    expect(EXT_CONSTANTS.DEBUG.MODULES.EXTRACTION).toBe("extraction");
    expect(EXT_CONSTANTS.DEBUG.MODULES.API).toBe("api");
    expect(EXT_CONSTANTS.DEBUG.MODULES.STORAGE).toBe("storage");
  });

  test("should have correct DOM element classes", () => {
    expect(EXT_CONSTANTS.CLASSES.HIGHLIGHT).toBe("legal-term-highlight");
    expect(EXT_CONSTANTS.CLASSES.SECTION).toBe("legal-text-section");
    expect(EXT_CONSTANTS.CLASSES.IMPORTANT).toBe("important-term");
  });

  test("should have correct DOM selectors", () => {
    expect(EXT_CONSTANTS.SELECTORS.LEGAL_SECTIONS).toEqual([
      "main",
      "article",
      "section",
      'div[class*="terms"]',
      'div[id*="terms"]',
      'div[class*="legal"]',
      'div[id*="legal"]',
    ]);
    expect(EXT_CONSTANTS.SELECTORS.EXCLUDE_ELEMENTS).toEqual([
      "nav",
      "header",
      "footer",
      "script",
      "style",
      "iframe",
      "object",
      "embed",
      "noscript",
    ]);
    expect(EXT_CONSTANTS.SELECTORS.POPUPS.READABILITY).toBe(
      "#readabilityPopup",
    );
    expect(EXT_CONSTANTS.SELECTORS.POPUPS.RIGHTS).toBe("#rightsPopup");
    expect(EXT_CONSTANTS.SELECTORS.POPUPS.EXCERPTS).toBe("#excerptsPopup");
    expect(EXT_CONSTANTS.SELECTORS.POPUPS.TERMS).toBe("#termsPopup");
  });

  test("should have correct local storage keys", () => {
    expect(EXT_CONSTANTS.STORAGE_KEYS.LAST_WORD).toBe("lastWord");
    expect(EXT_CONSTANTS.STORAGE_KEYS.ANALYSIS_RESULTS).toBe("analysisResults");
    expect(EXT_CONSTANTS.STORAGE_KEYS.CACHE_PREFIX).toBe("termsDef_");
    expect(EXT_CONSTANTS.STORAGE_KEYS.SETTINGS).toBe("guardianSettings");
    expect(EXT_CONSTANTS.STORAGE_KEYS.DEBUG_LOGS).toBe("debugLogs");
    expect(EXT_CONSTANTS.STORAGE_KEYS.PERFORMANCE_METRICS).toBe("perfMetrics");
  });

  test("should have correct context menu items", () => {
    expect(EXT_CONSTANTS.CONTEXT_MENU.GRADE_TEXT.id).toBe("gradeThisText");
    expect(EXT_CONSTANTS.CONTEXT_MENU.GRADE_TEXT.title).toBe("Grade this text");
    expect(EXT_CONSTANTS.CONTEXT_MENU.GRADE_TEXT.contexts).toEqual([
      "selection",
    ]);
  });
});
