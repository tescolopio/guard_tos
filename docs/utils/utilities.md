# utilities.js

This script provides a collection of utility functions used by other scripts in the Terms Guardian Chrome extension.

## Purpose

This script centralizes common functions that are used across different parts of the extension, promoting code reusability and maintainability. The utilities cover various areas, including:

* Legal term detection
* URL and domain handling
* Extension icon updates
* Side panel updates
* Highlighting
* Fetching data with timeouts

## Structure

### Functions

#### `createUtilities({ log, logLevels, legalTerms })`

Creates and returns an object containing the utility functions.

* Takes `log` (a logging function), `logLevels` (log level definitions), and `legalTerms` (an array of legal terms) as arguments.
* Uses constants from `EXT_CONSTANTS` for configuration.
* Returns an object with the following utility functions:
  * `containsLegalTerm`: Checks if a text contains an exact match for a legal term.
  * `containsPartialMatch`: Checks if a text is a partial match for a legal term.
  * `containsProximityMatch`: Checks if a text contains two legal terms within a certain proximity.
  * `extractDomain`: Extracts the domain from a URL.
  * `updateExtensionIcon`: Updates the extension icon's badge.
  * `updateSidepanel`: Updates the content of the side panel.
  * `highlightLegalTerms`: Highlights legal terms in a text.
  * `fetchWithTimeout`: Fetches data from a URL with a timeout.

#### `containsLegalTerm(text)`

Checks if the given text contains an exact match for any of the legal terms.

* Takes a `text` string as an argument.
* Uses a `Set` for efficient lookup of legal terms.
* Returns `true` if an exact match is found, `false` otherwise.

#### `containsPartialMatch(text)`

Checks if the given text is a partial match for any of the legal terms.

* Takes a `text` string as an argument.
* Returns `true` if a partial match is found, `false` otherwise.

#### `containsProximityMatch(text, proximity = 5)`

Checks if the given text contains two legal terms within the specified proximity (number of words apart).

* Takes a `text` string and an optional `proximity` value (defaulting to 5) as arguments.
* Iterates through the words in the text and checks for legal terms within the proximity.
* Returns `true` if a proximity match is found, `false` otherwise.

#### `extractDomain(url)`

Extracts the domain name from a given URL.

* Takes a `url` string as an argument.
* Uses the `URL` API to parse the URL and extract the hostname.
* Returns the domain name in lowercase or `null` if the URL is invalid.

#### `updateExtensionIcon(showExclamation)`

Updates the extension icon's badge.

* Takes a boolean argument `showExclamation` to indicate whether to show an exclamation mark on the badge.
* Uses `chrome.action.setBadgeText()` to update the badge text.
* Uses `chrome.action.setBadgeBackgroundColor()` to update the badge background color.
* Logs the action performed.

#### `updateSidepanel(content)`

Updates the content of the side panel.

* Takes a `content` object as an argument.
* Uses `chrome.tabs.query()` to find the active tab.
* Sends a message to the active tab with the content to update the side panel.
* Handles potential errors during tab querying and message sending.

#### `highlightLegalTerms(text)`

Highlights legal terms in the given text.

* Takes a `text` string as an argument.
* Iterates through the words in the text and highlights any legal terms found.
* The implementation of the highlighting itself is not shown (it would depend on your specific requirements).
* Returns the number of highlighted terms.

#### `fetchWithTimeout(url, options, timeout)`

Fetches data from a URL with a timeout to prevent requests from hanging indefinitely.

* Takes a `url` string, an optional `options` object for fetch parameters, and an optional `timeout` in milliseconds (defaulting to 5000) as arguments.
* Uses an `AbortController` to abort the fetch request if it exceeds the timeout.
* Returns a promise that resolves with the fetch response.

## Usage

These utility functions are used by various scripts in the extension to perform common tasks related to legal term detection, DOM manipulation, extension icon updates, and communication with other parts of the extension.

## Additional Sections

### Dependencies

* `EXT_CONSTANTS`: Provides access to the extension's constants and configuration values.
* `chrome` API: Used for interacting with the Chrome browser and its features (e.g., tabs, action, runtime).

### Error Handling

Most functions include `try...catch` blocks to handle potential errors and provide informative logging.

### Export

The `createUtilities` function is exported to be used in other parts of the extension:

* For CommonJS modules: `module.exports = { createUtilities };`
* For browser environments: The utility functions are exposed globally using `Object.assign(global, utils);`.
