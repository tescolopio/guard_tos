# Terms Guardian Development Console Configuration

## Browser DevTools Setup for Extension Debugging

### 1. Chrome Extension DevTools Configuration

#### Enable Developer Mode

```bash
# Navigate to chrome://extensions/ and enable Developer mode
# OR use programmatic setup (for automation):
chrome.management.setEnabled("your-extension-id", true);
```

#### Console Filtering Setup

Add these custom log prefixes in your extension code for easy filtering:

```javascript
// In serviceWorker.js
const LOG_PREFIX = "[TG-Background]";
console.log(`${LOG_PREFIX} Service worker initialized`);

// In content.js
const LOG_PREFIX = "[TG-Content]";
console.log(`${LOG_PREFIX} Content script loaded on ${window.location.href}`);

// In sidepanel.js
const LOG_PREFIX = "[TG-Panel]";
console.log(`${LOG_PREFIX} Side panel opened`);
```

### 2. Performance Monitoring Setup

#### Memory and Performance Tracking

```javascript
// Add to your extension for performance monitoring
class PerformanceMonitor {
  static startTimer(label) {
    console.time(`[TG-Perf] ${label}`);
  }

  static endTimer(label) {
    console.timeEnd(`[TG-Perf] ${label}`);
  }

  static memoryUsage() {
    if (performance.memory) {
      console.log("[TG-Perf] Memory:", {
        used:
          Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + " MB",
        total:
          Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + " MB",
        limit:
          Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + " MB",
      });
    }
  }
}

// Usage example:
PerformanceMonitor.startTimer("Legal Text Analysis");
// ... analysis code ...
PerformanceMonitor.endTimer("Legal Text Analysis");
PerformanceMonitor.memoryUsage();
```

### 3. Network Request Monitoring

#### Extension API Call Tracking

```javascript
// Add to background script for network monitoring
const originalFetch = fetch;
window.fetch = function (...args) {
  console.log("[TG-Network] Fetch request:", args[0]);
  return originalFetch
    .apply(this, arguments)
    .then((response) => {
      console.log("[TG-Network] Response:", response.status, args[0]);
      return response;
    })
    .catch((error) => {
      console.error("[TG-Network] Error:", error, args[0]);
      throw error;
    });
};
```

### 4. Error Tracking Configuration

#### Comprehensive Error Handling

```javascript
// Global error handler for extension
window.addEventListener("error", (event) => {
  console.error("[TG-Error] Uncaught error:", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  });
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("[TG-Error] Unhandled promise rejection:", event.reason);
});
```

### 5. Extension State Debugging

#### State Inspector Functions

```javascript
// Add these debugging functions to window object for console access
window.termsGuardianDebug = {
  getState: () => {
    return {
      contentLoaded: window.termsGuardianContentLoaded,
      lastAnalysis: window.termsGuardianLastAnalysis,
      isLegalPage: window.termsGuardianIsLegal,
      version: chrome.runtime.getManifest().version,
    };
  },

  forceAnalysis: () => {
    if (window.termsGuardian && window.termsGuardian.analyzeCurrentPage) {
      console.log("[TG-Debug] Forcing analysis...");
      return window.termsGuardian.analyzeCurrentPage();
    }
    console.warn("[TG-Debug] Analysis function not available");
  },

  clearStorage: () => {
    chrome.storage.local.clear(() => {
      console.log("[TG-Debug] Storage cleared");
    });
  },

  getManifest: () => {
    return chrome.runtime.getManifest();
  },
};
```

### 6. Console Commands Reference

#### Quick Testing Commands

```javascript
// Check extension loading status
chrome.management.get(chrome.runtime.id, (info) => {
  console.log("[TG-Debug] Extension info:", info);
});

// Test message passing
chrome.runtime.sendMessage({ action: "ping" }, (response) => {
  console.log("[TG-Debug] Ping response:", response);
});

// Check storage
chrome.storage.local.get(null, (data) => {
  console.log("[TG-Debug] Storage contents:", data);
});

// Force content script reload (from background)
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.reload(tabs[0].id);
});
```

### 7. Automated Console Setup Script

Save this script and run it in console for quick setup:

```javascript
// Terms Guardian Debug Setup
(function () {
  console.log(
    "%c[TG-Setup] Initializing debug environment...",
    "color: blue; font-weight: bold;",
  );

  // Set up console filters
  console.log("%cConsole Filter Setup:", "color: green;");
  console.log('- Use "[TG-" to filter Terms Guardian logs');
  console.log('- Use "[TG-Error]" for errors only');
  console.log('- Use "[TG-Perf]" for performance metrics');
  console.log('- Use "[TG-Network]" for API calls');

  // Check extension status
  if (typeof chrome !== "undefined" && chrome.runtime) {
    console.log("%cExtension Runtime Available:", "color: green;", "YES");
    console.log("Extension ID:", chrome.runtime.id);
  } else {
    console.log("%cExtension Runtime Available:", "color: red;", "NO");
  }

  // Check content script
  if (typeof window.termsGuardian !== "undefined") {
    console.log("%cContent Script Available:", "color: green;", "YES");
  } else {
    console.log("%cContent Script Available:", "color: orange;", "PENDING");
  }

  console.log(
    "%c[TG-Setup] Debug environment ready!",
    "color: blue; font-weight: bold;",
  );
})();
```

## Quick Reference Commands

### Essential Debug Commands

```javascript
// 1. Extension state check
window.termsGuardianDebug?.getState();

// 2. Force analysis
window.termsGuardianDebug?.forceAnalysis();

// 3. Check storage
chrome.storage.local.get(null, console.log);

// 4. Memory check
performance.memory;

// 5. Service worker status
navigator.serviceWorker.getRegistrations();

// 6. Extension reload
chrome.runtime.reload();
```

### Console Setup Checklist

- [ ] Developer mode enabled in chrome://extensions/
- [ ] Background script console open (Inspect views: service worker)
- [ ] Content script console open (F12 on webpage)
- [ ] Network tab monitoring enabled
- [ ] Console filters configured for "[TG-" prefix
- [ ] Debug setup script executed
- [ ] Performance monitoring active

This development console configuration provides comprehensive visibility into Terms Guardian's operation during testing!
