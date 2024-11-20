# debugger.js

This script provides logging utilities for debugging and error handling in the Terms Guardian Chrome extension.

## Purpose

This script aims to:

* Provide a flexible and configurable logging system for debugging and tracking events in the extension.
* Handle different log levels (error, warning, info, debug, trace).
* Format log messages and data for clarity and readability.
* Optionally store logs in the browser's local storage for later analysis.
* Monitor performance and log performance metrics.
* Group related log messages for better organization.
* Export logs for debugging and analysis.

## Structure

### Functions

#### `createDebugger(initialConfig = {})`

Creates and returns an object with logging and debugging functions.

* Takes an optional `initialConfig` object to customize the debugger's behavior.
* Uses constants from `EXT_CONSTANTS` for default configuration.
* Sets up log levels, performance metrics, and an active log group.
* Returns an object with the following functions:
  * `log`: The main logging function.
  * `trace`, `debug`, `info`, `warn`, `error`: Convenience functions for different log levels.
  * `startLogGroup`, `endLogGroup`: Functions for grouping related logs.
  * `startTimer`, `endTimer`: Functions for performance monitoring.
  * `clearLogs`: Clears stored logs.
  * `exportLogs`: Exports logs in the specified format.
  * `getMetrics`: Retrieves performance metrics.
  * `getPerformanceAnalytics`: Gets performance analytics for a specific label.

#### `formatDataWithCircular(data)`

Formats data for logging, handling circular references to avoid infinite recursion.

* Takes a `data` object as an argument.
* Uses `JSON.stringify` with a custom replacer function to handle circular references.
* Truncates the formatted data if it exceeds the `MAX_DATA_LENGTH`.
* Returns the formatted data as a string.

#### `getPerformanceAnalytics(label)`

Retrieves performance analytics for the specified label.

* Calculates average duration, retrieves recent samples, and determines the performance threshold.
* Returns an object with performance data or null if no metrics are found.

#### `log(level, message, data, error)`

The main logging function.

* Takes `level` (log level), `message` (log message), `data` (optional data to log), and `error` (optional error object) as arguments.
* Checks if the log level is enabled based on the configured `DEBUG_LEVEL`.
* Formats the log message and data.
* Optionally groups related logs using `console.groupCollapsed` and `console.groupEnd`.
* Logs the message to the console based on the log level (error, warn, info, debug, trace).
* Stores the log entry in local storage using `storageManager.saveLog()`.

#### `startLogGroup(groupName)`

Starts a new log group to organize related log messages.

* Sets the `activeLogGroup` to the provided `groupName`.
* Optionally uses `console.group` to visually group logs in the console.

#### `endLogGroup()`

Ends the current log group.

* Resets the `activeLogGroup` to `null`.
* Optionally uses `console.groupEnd` to close the group in the console.

## Usage

This script provides logging and debugging utilities for the extension. The main logging function (`log`) and the convenience functions (`trace`, `debug`, `info`, `warn`, `error`) can be used throughout the extension's code to log messages and data at different levels.

## Additional Sections

### Dependencies

* `EXT_CONSTANTS`: Provides access to configuration values, log levels, and storage keys.

### Error Handling

The `formatData` and `getStackTrace` functions include `try...catch` blocks to handle potential errors during data formatting and stack trace retrieval.

### Performance Monitoring

The `performanceMonitor` object provides functions (`startTimer`, `endTimer`) to track the performance of specific code blocks and log warnings if they exceed the configured thresholds.

### Storage Management

The `storageManager` object provides functions (`saveLog`, `clearLogs`, `exportLogs`) to manage the storage of log entries in the browser's local storage. It also implements log rotation to prevent the storage from exceeding its capacity.

### Export

The `createDebugger` function is exported to be used in other parts of the extension:

* For CommonJS modules: `module.exports = { createDebugger };`
* For browser environments: The main logging functions and utilities are exposed globally under the `global.debug` object.
