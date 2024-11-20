# service-worker.js

This script defines the service worker for the Terms Guardian Chrome extension, handling background operations such as context menus, notifications, message passing, and analysis of legal documents.

## Purpose

The service worker acts as the background script for the extension, performing tasks that don't require direct interaction with the user interface. It manages the following:

* Context menus: Creating and handling context menu clicks.
* Notifications: Displaying notifications to the user.
* Message Passing: Communicating with content scripts and other parts of the extension.
* Analysis: Performing analysis of legal documents (Terms of Service, Privacy Policies).
* Storage: Storing data in the browser's local storage.
* Side Panel: Managing the side panel for displaying analysis results.

## Structure

### Functions

#### `createServiceWorker({ log, logLevels })`

Creates and returns an object with functions for managing the service worker.

* Takes `log` (a logging function) and `logLevels` (an object with log level definitions) as arguments.
* Uses `global.Constants` to access configuration values.
* Manages internal state using the `state` object.
* Returns an object with the following functions:
  * `initialize`: Initializes the service worker.
  * `_test`: (For testing) Exposes internal functions for testing purposes.

#### `setupContextMenu()`

Sets up the context menu for the extension.

* Creates a context menu item using `chrome.contextMenus.create()`.
* Logs success or failure messages.

#### `showNotification(message)`

Shows a notification to the user.

* Takes a `message` string as an argument.
* Creates a notification using `chrome.notifications.create()`.
* Logs the notification ID.

#### `handleContextMenuClick(data, tab)`

Handles clicks on the context menu item.

* Takes `data` (click data) and `tab` (current tab information) as arguments.
* Validates the input data.
* Logs the click event.
* Stores the selected text using `storeAnalysisData()`.
* Opens the side panel using `openSidePanel()`.
* Logs success or failure messages.

#### `storeAnalysisData(key, data)`

Stores analysis data in the browser's local storage.

* Takes a `key` (storage key) and `data` (data to store) as arguments.
* Uses `chrome.storage.local.set()` to store the data.
* Checks for errors using `chrome.runtime.lastError`.
* Logs success or failure messages.

#### `openSidePanel(tabId)`

Opens the side panel for the given tab.

* Takes `tabId` (the ID of the tab) as an argument.
* Checks if a side panel is already open using `chrome.windows.getCurrent()`.
* Opens the side panel using `chrome.sidePanel.open()`.
* Logs success or failure messages.

#### `handleMessage(message, sender, sendResponse)`

Handles messages from other parts of the extension.

* Takes `message` (the message object), `sender` (sender information), and `sendResponse` (a callback function to send a response) as arguments.
* Validates the message.
* Uses a `switch` statement to handle different message actions:
  * `getWord`: Retrieves the last selected word from storage.
  * `tosDetected`: Triggers the ToS detection and analysis process.
  * `checkNotification`: Checks if a notification should be shown for the current domain.
* Logs any unknown message actions.
* Logs errors encountered while handling messages.

#### `handleTosDetected(message, sender)`

Handles the detection and analysis of Terms of Service content.

* Takes `message` (containing the ToS text) and `sender` (sender information) as arguments.
* Validates the input data.
* Checks if analysis is already in progress for the current tab.
* Performs the analysis using `analyzeContent()`.
* Stores the analysis results using `storeAnalysisData()`.
* Shows a notification to the user.
* Logs success or failure messages.
* Handles errors gracefully, showing a generic error notification to the user and logging detailed error information to the console.

#### `handleCheckNotification(tab)`

Checks if a notification should be shown for the current tab's domain.

* Takes `tab` (tab information) as an argument.
* Validates the input data.
* Extracts the domain from the tab's URL.
* Checks if the domain has already been notified using `state.notifiedDomains`.
* Returns an object indicating whether the notification should be shown.
* Logs any errors encountered.

#### `analyzeContent(text)`

Analyzes the given text using various analyzers.

* Takes `text` (the text content to analyze) as an argument.
* Validates the input text.
* Uses `Promise.allSettled` to run multiple analyzers concurrently:
  * `ReadabilityGrader`: Calculates the readability grade of the text.
  * `RightsAssessor`: Assesses the rights implications of the text.
  * `TosSummarizer`: Summarizes the ToS content.
  * `UncommonWordsIdentifier`: Identifies uncommon words in the text.
* Processes the results from `Promise.allSettled`, handling potential errors from individual analyzers.
* Returns an object containing the analysis results.
* Logs errors encountered during analysis.
* Shows a generic error notification to the user and logs detailed error information to the console.

#### `initialize()`

Initializes the service worker.

* Checks if the service worker has already been initialized.
* Sets up error handling for uncaught errors and unhandled promise rejections.
* Sets up event listeners:
  * `chrome.runtime.onInstalled`: Sets up the context menu when the extension is installed.
  * `chrome.contextMenus.onClicked`: Handles clicks on the context menu item.
  * `chrome.runtime.onMessage`: Handles messages from other parts of the extension.
    * Returns `true` to indicate that responses may be sent asynchronously.
* Sets the `initialized` state to `true`.
* Logs a success message.

### State Management

The `state` object is used to manage the internal state of the service worker:

* `notifiedDomains`: A `Map` to store domains that have already been notified.
* `analysisInProgress`: A `Set` to track tabs where analysis is currently in progress.
* `initialized`: A boolean indicating whether the service worker has been initialized.

## Usage

This script is the main background script for the Terms Guardian extension. It is automatically loaded by the browser when the extension is installed or enabled.

## Additional Sections

### Dependencies

* `global.Constants`:  Provides access to the extension's constants and configuration values.
* `chrome` API: Used for interacting with the Chrome browser and its features (e.g., context menus, notifications, storage, side panel).
* Other Analyzer Modules:  `ReadabilityGrader`, `RightsAssessor`, `TosSummarizer`, `UncommonWordsIdentifier` (these are assumed to be globally available).

### Error Handling

The service worker includes error handling in most functions to catch and log errors. It also uses `try...catch` blocks to handle asynchronous errors and prevent the service worker from crashing.

### Testing

The `_test` property exposes some internal functions for testing purposes.

## Service Worker Initialization

* Creates a `serviceWorker` instance using `self.ServiceWorker.create()`, passing `console.log` for logging and `CONSTANTS.DEBUG.LEVELS` for log levels.
* Calls `serviceWorker.initialize()` to start the service worker.
