# Alpha Testing - Issue #1 Resolved ✅

## Problem
Extension was loading but showing console errors:
```
Failed to load resource: net::ERR_FILE_NOT_FOUND - constants.js
Failed to load resource: net::ERR_FILE_NOT_FOUND - debugger.js
```

## Root Cause
The webpack build configuration was not copying `constants.js` and `debugger.js` from `src/utils/` to the `dist/` directory, even though `sidepanel.html` referenced them.

## Solution
Updated `config/webpack.common.js` to include these files in the CopyPlugin patterns.

## How to Apply Fix

**If you already loaded the extension:**
1. Run `npm run build` in the terminal
2. Go to `chrome://extensions/`
3. Click the reload icon (↻) on the Terms Guardian card
4. Refresh any pages you're testing

**If you haven't loaded it yet:**
1. Run `npm run build` first
2. Then follow the normal loading instructions from `docs/ALPHA_QUICK_START.md`

## Verification
After reload, you should NOT see the ERR_FILE_NOT_FOUND errors in console.

Console should show:
```
✅ Service worker initialized successfully
✅ Context menu created successfully  
✅ Extension installed successfully
✅ Side panel opened successfully
```

---

**Status:** Fixed and committed (commit ef45f02)  
**Date:** January 16, 2025  
**Next:** Continue with alpha testing now that files load correctly
