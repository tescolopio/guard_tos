# constants.js

This script defines and manages all the constants and configuration values for the Terms Guardian extension.

## Purpose

Centralizing constants in a single file provides several benefits:

* **Maintainability:** Makes it easy to update and modify constants in one central location.
* **Readability:** Improves code readability by separating configuration from logic.
* **Consistency:** Ensures consistency in values used throughout the extension.

## Structure

The `CONSTANTS` object is organized into the following categories:

### `EXTENSION`

* `NAME`: The name of the extension.
* `VERSION`: The current version of the extension.
* `ICON_PATHS`: Paths to icons of different sizes.

### `DETECTION`

* `INTERVAL_MS`: The interval (in milliseconds) for detecting legal agreements.
* `THRESHOLDS`: Threshold values for various detection criteria:
  * `AUTO_GRADE`: Number of legal terms to trigger automatic grading.
  * `NOTIFY`: Number of legal terms to trigger a notification.
  * `HIGHLIGHT`: Number of highlighted terms before extracting full text.
  * `SECTION`: Minimum legal terms in a section to consider it legal text.
  * `PROXIMITY`: Maximum word distance for proximity matching.

### `ANALYSIS`

* `PERFORMANCE_THRESHOLDS`: Thresholds (in milliseconds) for performance monitoring.
* `CHUNK_SIZE`:  Size of text chunks for processing.
* `MIN_WORD_LENGTH`: Minimum word length for analysis.
* `MAX_RETRIES`: Maximum API retry attempts.
* `CACHE_DURATION`: Cache duration in milliseconds.
* `GRADES`: Definitions of readability grades (A, B, C, D, F) with minimum scores and labels.

### `MESSAGES`

* Notification messages for different events (e.g., `AUTO_GRADE`, `SIGNIFICANT_TERMS`).
* Error messages for various error types.

### `ERROR_TYPES`

* Definitions of error types used in the extension.

### `API`

* Settings for external APIs used by the extension (e.g., `LEXPREDICT`).

### `DEBUG`

* Debug settings, including log levels, storage options, performance monitoring, and module names.

### `CLASSES`

* CSS class names used for highlighting and styling elements.

### `SELECTORS`

* CSS selectors used to identify specific elements on the page.

### `STORAGE_KEYS`

* Keys used for storing data in the browser's local storage.

### `CONTEXT_MENU`

* Definitions of context menu items.

## Export

The `CONSTANTS` object is exported to be used in other parts of the extension:

* For CommonJS modules (e.g., in Node.js environment): `module.exports = { constants: CONSTANTS };`
* For browser environments: `global.Constants = CONSTANTS;`

This ensures that the constants are accessible globally within the extension's scripts.
