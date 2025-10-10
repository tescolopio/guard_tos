/**
 * @file debugger.js
 * @description This script contains logging utilities for debugging and error handling.
 * @contributors {tescolopio}
 * @version 1.1.0
 * @date 2024-09-25
 *
 * @company 3D Tech Solutions LLC
 *
 * @changes
 *  - 2024-09-18 | tescolopio | Initial creation of the script.
 *  - 2024-09-24 | tescolopio | Updated script to include more robust logging and error handling. Also included config settings for logging.
 *  - 2024-09-25 | tescolopio | Modified to work with Chrome extension content scripts.
 */

// Use global EXT_CONSTANTS (loaded via constants.js script tag)
// Falls back to require() for Node.js environments (testing)
const EXT_CONSTANTS = typeof window !== 'undefined' && window.EXT_CONSTANTS 
  ? window.EXT_CONSTANTS 
  : (typeof require !== 'undefined' ? require("./constants").EXT_CONSTANTS : {});

(function (global) {
  "use strict";

  function createDebugger(initialConfig = {}) {
    // Get constants
    const { DEBUG } = EXT_CONSTANTS;

    // Enhanced default configuration with new DEBUG constants
    const defaultConfig = {
      DEBUG_LEVEL: DEBUG.DEFAULT_LEVEL,
      TIMESTAMP_FORMAT: "ISO",
      LOG_TO_CONSOLE: true,
      LOG_TO_STORAGE: true,
      STORAGE_KEY: DEBUG.STORAGE.KEY,
      MAX_STORAGE_ENTRIES: DEBUG.STORAGE.MAX_ENTRIES,
      MAX_DATA_LENGTH: 1000,
      INCLUDE_STACK_TRACE: true,
      TRACK_PERFORMANCE: DEBUG.PERFORMANCE.ENABLED,
      GROUP_RELATED_LOGS: true,
      // Default to no filtering so all groups log unless caller opts in
      MODULE_FILTERS: [],
      PERFORMANCE_THRESHOLD: DEBUG.PERFORMANCE.THRESHOLD_WARNING,
      PERFORMANCE_SAMPLE_RATE: DEBUG.PERFORMANCE.SAMPLE_RATE,
      EXPORT_FORMAT: DEBUG.STORAGE.EXPORT_FORMAT,
      formatData: formatDataWithCircular,
      getPerformanceAnalytics,
    };

    const config = { ...defaultConfig, ...initialConfig };
    const logLevels = DEBUG.LEVELS;
    const performanceMetrics = new Map();
    let activeLogGroup = null;

    /**
     * Enhanced data formatting with proper circular reference handling
     */
    function formatDataWithCircular(data) {
      try {
        if (!data) return "";

        const seen = new WeakSet();
        const formatted = JSON.stringify(
          data,
          (key, value) => {
            if (typeof value === "object" && value !== null) {
              if (seen.has(value)) {
                return "[Circular Reference]";
              }
              seen.add(value);
            }
            if (value instanceof Error) {
              // TODO: Consider adding more error properties if needed
              return {
                name: value.name,
                message: value.message,
                stack: value.stack,
              };
            }
            return value;
          },
          2,
        );

        // TODO: Make MAX_DATA_LENGTH configurable from outside
        return formatted.length > config.MAX_DATA_LENGTH
          ? formatted.substring(0, config.MAX_DATA_LENGTH) + "... [truncated]"
          : formatted;
      } catch (error) {
        // TODO: Improve error handling and logging
        return `[Error formatting data: ${error.message}]`;
      }
    }
    // Add performance metrics storage
    const metricsManager = {
      async saveMetric(label, duration) {
        if (!config.TRACK_PERFORMANCE) return null;

        try {
          const key = EXT_CONSTANTS.STORAGE_KEYS.PERFORMANCE_METRICS;
          const { [key]: metricsRaw } = await chrome.storage.local.get(key);
          const metrics = metricsRaw || {};

          if (!metrics[label]) {
            metrics[label] = {
              count: 0,
              total: 0,
              min: duration,
              max: duration,
              samples: [],
            };
          }

          const stat = metrics[label];
          stat.count++;
          stat.total += duration;
          stat.min = Math.min(stat.min, duration);
          stat.max = Math.max(stat.max, duration);

          // Store samples based on sampling rate
          if (Math.random() < config.PERFORMANCE_SAMPLE_RATE) {
            stat.samples.push({
              timestamp: new Date().toISOString(),
              duration,
            });

            // Keep only recent samples
            if (stat.samples.length > 100) {
              stat.samples.shift();
            }
          }

          await chrome.storage.local.set({ [key]: metrics });
          return metrics[label];
        } catch (error) {
          console.error("Error saving performance metric:", error);
          return null;
        }
      },

      async getMetrics(label) {
        try {
          const key = EXT_CONSTANTS.STORAGE_KEYS.PERFORMANCE_METRICS;
          const { [key]: metricsRaw } = await chrome.storage.local.get(key);
          const metrics = metricsRaw || {};
          return label ? metrics[label] : metrics;
        } catch (error) {
          console.error("Error getting performance metrics:", error);
          return null;
        }
      },
    };

    /**
     * Get performance analytics for a specific label
     */
    async function getPerformanceAnalytics(label) {
      if (!label || typeof label !== "string") {
        throw new Error("Label must be provided and must be a string");
      }

      const metrics = await metricsManager.getMetrics(label);
      if (metrics) {
        const average = metrics.count > 0 ? metrics.total / metrics.count : 0;
        return {
          ...metrics,
          average,
          recentSamples: metrics.samples.slice(-10),
          analysisTimestamp: new Date().toISOString(),
          threshold:
            EXT_CONSTANTS.ANALYSIS.PERFORMANCE_THRESHOLDS[label] ||
            DEBUG.PERFORMANCE.THRESHOLD_WARNING,
        };
      }
      return null;
    }

    // Enhance performance monitor
    const performanceMonitor = {
      startTimer(label) {
        if (!config.TRACK_PERFORMANCE) return;
        // Use performance.now if available; fallback to Date.now
        const nowFn =
          typeof performance !== "undefined" && performance.now
            ? performance.now
            : Date.now;
        performanceMetrics.set(label, nowFn());
      },

      async endTimer(label) {
        if (!config.TRACK_PERFORMANCE) return;
        const startTime = performanceMetrics.get(label);
        if (startTime !== undefined) {
          const nowFn =
            typeof performance !== "undefined" && performance.now
              ? performance.now
              : Date.now;
          const endTime = nowFn();
          const duration = endTime - startTime;
          performanceMetrics.delete(label);

          const thresholds = EXT_CONSTANTS.ANALYSIS.PERFORMANCE_THRESHOLDS;
          const specificThreshold =
            thresholds[label] || DEBUG.PERFORMANCE.THRESHOLD_WARNING;

          if (duration > specificThreshold) {
            log(
              logLevels.WARN,
              `Performance warning: ${label} took ${duration.toFixed(2)}ms`,
              { threshold: specificThreshold, duration },
            );
          }

          await metricsManager.saveMetric(label, duration);
          return duration;
        }
      },
    };

    /**
     * Manages debug log storage
     */
    // Enhance storage manager with rotation
    const storageManager = {
      async saveLog(logEntry) {
        if (!config.LOG_TO_STORAGE) return;

        try {
          const { debugLogs = [] } = await chrome.storage.local.get(
            config.STORAGE_KEY,
          );
          debugLogs.push({ ...logEntry, timestamp: new Date().toISOString() });

          // Implement log rotation
          if (debugLogs.length > config.MAX_STORAGE_ENTRIES) {
            const keepCount = DEBUG.STORAGE.ROTATION_SIZE;
            debugLogs.splice(0, debugLogs.length - keepCount);
          }

          await chrome.storage.local.set({ [config.STORAGE_KEY]: debugLogs });
        } catch (error) {
          console.error("Error saving debug log:", error);
        }
      },

      async clearLogs() {
        try {
          await chrome.storage.local.remove([
            config.STORAGE_KEY,
            EXT_CONSTANTS.STORAGE_KEYS.PERFORMANCE_METRICS,
          ]);
        } catch (error) {
          console.error("Error clearing logs:", error);
        }
      },

      async exportLogs() {
        try {
          const [debugLogs, metrics] = await Promise.all([
            chrome.storage.local.get(config.STORAGE_KEY),
            metricsManager.getMetrics(),
          ]);

          const exportData = {
            logs: debugLogs[config.STORAGE_KEY] || [],
            metrics,
            exportDate: new Date().toISOString(),
            config: { ...config },
          };

          return config.EXPORT_FORMAT === "json"
            ? JSON.stringify(exportData, null, 2)
            : exportData;
        } catch (error) {
          console.error("Error exporting logs:", error);
          return "[]";
        }
      },
    };

    /**
     * Enhanced data formatting with circular reference handling
     */
    function formatData(data) {
      try {
        if (!data) return "";

        const seen = new WeakSet();
        const formatted = JSON.stringify(
          data,
          (key, value) => {
            if (typeof value === "object" && value !== null) {
              if (seen.has(value)) {
                return "[Circular Reference]";
              }
              seen.add(value);
            }
            if (value instanceof Error) {
              return {
                name: value.name,
                message: value.message,
                stack: value.stack,
              };
            }
            return value;
          },
          2,
        );

        return formatted.length > config.MAX_DATA_LENGTH
          ? formatted.substring(0, config.MAX_DATA_LENGTH) + "... [truncated]"
          : formatted;
      } catch (error) {
        return `[Error formatting data: ${error.message}]`;
      }
    }

    /**
     * Gets detailed stack trace with source mapping support
     */
    function getStackTrace(error) {
      if (!config.INCLUDE_STACK_TRACE) return "";

      try {
        if (error?.stack) {
          return `\nStack: ${error.stack}`;
        }

        const stack = new Error().stack;
        // Remove first two lines (Error creation and getStackTrace call)
        return stack?.split("\n").slice(3).join("\n") || "";
      } catch (error) {
        return "[Error getting stack trace]";
      }
    }

    /**
     * Enhanced logging function with group support
     */
    async function log(level, message, data = null, error = null) {
      if (level > config.DEBUG_LEVEL) return;

      const timestamp = new Date().toISOString();
      const levelName =
        Object.keys(logLevels).find((key) => logLevels[key] === level) ||
        "UNKNOWN";

      const logEntry = {
        timestamp,
        level: levelName,
        message,
        data: data ? formatData(data) : null,
        groupId: activeLogGroup,
        stack: error ? getStackTrace(error) : null,
      };

      if (
        config.MODULE_FILTERS &&
        config.MODULE_FILTERS.length > 0 &&
        activeLogGroup
      ) {
        if (!config.MODULE_FILTERS.includes(activeLogGroup)) {
          return;
        }
      }

      // Console logging
      if (config.LOG_TO_CONSOLE) {
        let logMessage = `[${timestamp}] [${levelName}] ${message}`;
        if (data) logMessage += `\nData: ${logEntry.data}`;
        if (error) logMessage += logEntry.stack;

        if (config.GROUP_RELATED_LOGS && activeLogGroup) {
          const groupFn = console.groupCollapsed || console.group || (() => {});
          groupFn(`Group: ${activeLogGroup}`);
        }

        switch (level) {
          case logLevels.ERROR:
            console.error(logMessage);
            break;
          case logLevels.WARN:
            console.warn(logMessage);
            break;
          case logLevels.INFO:
            console.info(logMessage);
            break;
          case logLevels.DEBUG:
            console.debug(logMessage);
            break;
          case logLevels.TRACE:
            console.trace(logMessage);
            break;
        }

        if (config.GROUP_RELATED_LOGS && activeLogGroup) {
          console.groupEnd();
        }
      }

      // Storage logging
      await storageManager.saveLog(logEntry);
    }

    // Create specialized logging functions
    const trace = (message, data) => log(logLevels.TRACE, message, data);
    const debug = (message, data) => log(logLevels.DEBUG, message, data);
    const info = (message, data) => log(logLevels.INFO, message, data);
    const warn = (message, data) => log(logLevels.WARN, message, data);
    const error = (message, data, err) =>
      log(logLevels.ERROR, message, data, err);

    /**
     * Group related logs together
     */
    function startLogGroup(groupName) {
      activeLogGroup = groupName;
      if (config.GROUP_RELATED_LOGS && config.LOG_TO_CONSOLE) {
        (console.group || console.groupCollapsed || (() => {}))(groupName);
      }
    }

    function endLogGroup() {
      if (config.GROUP_RELATED_LOGS && config.LOG_TO_CONSOLE) {
        console.groupEnd();
      }
      activeLogGroup = null;
    }

    function setLevel(levelNameOrNumber) {
      try {
        if (typeof levelNameOrNumber === "number") {
          config.DEBUG_LEVEL = levelNameOrNumber;
        } else if (typeof levelNameOrNumber === "string") {
          const upper = levelNameOrNumber.toUpperCase();
          if (logLevels[upper] !== undefined) {
            config.DEBUG_LEVEL = logLevels[upper];
          }
        }
      } catch (e) {
        // ignore
      }
    }

    function enableAll() {
      config.DEBUG_LEVEL = logLevels.TRACE;
      config.LOG_TO_CONSOLE = true;
      config.LOG_TO_STORAGE = true;
      config.TRACK_PERFORMANCE = true;
    }

    return {
      log,
      trace,
      debug,
      info,
      warn,
      error,
      startLogGroup,
      endLogGroup,
      startTimer: performanceMonitor.startTimer,
      endTimer: performanceMonitor.endTimer,
      clearLogs: storageManager.clearLogs,
      exportLogs: storageManager.exportLogs,
      getMetrics: metricsManager.getMetrics,
      getPerformanceAnalytics,
      logLevels,
      config,
      setLevel,
      enableAll,
    };
  }

  // Export for use in other modules
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createDebugger };
  } else {
    global.createDebugger = createDebugger;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this,
);
