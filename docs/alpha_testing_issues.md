# Alpha Testing - Issues & Resolutions

## Issue #1: Missing constants.js and debugger.js ✅ RESOLVED

**Problem:**
Extension was loading but showing console errors:
```
Failed to load resource: net::ERR_FILE_NOT_FOUND - constants.js
Failed to load resource: net::ERR_FILE_NOT_FOUND - debugger.js
```

**Root Cause:**
The webpack build configuration was not copying `constants.js` and `debugger.js` from `src/utils/` to the `dist/` directory, even though `sidepanel.html` referenced them.

**Solution:**
Updated `config/webpack.common.js` to include these files in the CopyPlugin patterns.

**Status:** Fixed in commit ef45f02

---

## Issue #2: publicPath Error ✅ RESOLVED

**Problem:**
Content script throwing error:
```
Uncaught Error: Automatic publicPath is not supported in this browser
    at content.js:1:97961
```

**Root Cause:**
Webpack was trying to automatically detect the publicPath in the content script context, but Chrome extensions run content scripts in the page context where automatic detection fails. The publicPath needs to be explicitly set using `chrome.runtime.getURL()`.

**Solution:**
1. Set webpack output `publicPath` to empty string (allows runtime override)
2. Improved `src/runtime/publicPath.js` to properly use `chrome.runtime.getURL()`
3. Added explicit `chunkFilename` configuration

**Status:** Fixed in commit 9df0d3d

---

## How to Apply All Fixes

**If you already loaded the extension:**
1. Run `npm run build` in the terminal (rebuilds with fixes)
2. Go to `chrome://extensions/`
3. Click the reload icon (↻) on the Terms Guardian card
4. Refresh any pages you're testing
5. Check console - errors should be gone

**If you haven't loaded it yet:**
1. Run `npm run build` first
2. Then follow the normal loading instructions from `docs/ALPHA_QUICK_START.md`

---

## Verification Checklist

After reload, verify in console (`F12`):

✅ **Should see:**
```
Service worker initialized successfully
Context menu created successfully
Extension installed successfully
Side panel opened successfully
```

❌ **Should NOT see:**
- `ERR_FILE_NOT_FOUND` errors
- `Automatic publicPath is not supported` errors
- Any React DevTools warnings (these are harmless)

---

**All Issues Resolved:** January 16, 2025  
**Next:** Continue with alpha testing - extension should now work properly!
