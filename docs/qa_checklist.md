# MVP QA Checklist

A concise manual test pass to validate core MVP functionality of Terms Guardian.

## Setup

- [ ] Build production bundle: `npm run build`
- [ ] Load unpacked extension from `dist/` in Chrome
- [ ] Pin the extension to toolbar for easy access
- [ ] (Optional) Enable diagnostics: set `DEBUG.FEATURES.DICTIONARY_METRICS.ENABLED = true` in `src/utils/constants.js` and rebuild

## Smoke Test — Known ToS Page

- [ ] Navigate to a ToS page (e.g., example.com/terms or a local fixture)
- [ ] Extension badge appears/updates when legal text detected
- [ ] Open the side panel
  - [ ] Summary renders without errors
  - [ ] Readability grade displays (e.g., Flesch score and label)
  - [ ] Rights assessment shows key flags
  - [ ] Uncommon terms list shows and definitions expand
  - [ ] (If diagnostics enabled) Diagnostics section appears and shows dictionary cache metrics updating periodically

## Content ↔ Background Messaging

- [ ] Content script sends detection event
- [ ] Background service worker receives and stores the state
- [ ] Panel fetches latest analysis from background

## Edge Cases

- [ ] Non-legal page: badge remains idle and panel indicates no data
- [ ] Very long ToS text (>50k chars): app remains responsive; summary still renders
- [ ] Network offline: app doesn’t crash; cached data or graceful message shown

## Performance sanity

- [ ] Initial analysis completes in under ~2s on a typical page
- [ ] No excessive console errors or warnings in DevTools

## Build & Packaging

- [ ] Source maps present in prod build (`.map` files exist)
- [ ] No runtime errors when reloading the extension

## Optional — Bundle Analysis

- [ ] Run `ANALYZE=true npm run build` and review `bundle-analysis.html`
- [ ] Verify large deps (e.g., NLP libs) are not accidentally included

## Notes

Record any issues with a short reproduction and a screenshot. File follow-ups in `dev_progress.md` or as GitHub issues.

---

## Local Fixture Smoke Flow (Quick 10-minute pass)

1. Build and load the extension (see Setup).
2. Open `docs/fixtures/sample_tos.html` locally in Chrome. Note: to analyze file URLs, on `chrome://extensions` enable “Allow access to file URLs” for Terms Guardian.
3. Observe the badge: it should indicate detection when the page loads.
4. Open the side panel and verify: summary, readability grade, rights assessment, uncommon terms with definitions; if diagnostics are enabled, the Dictionary Cache metrics render and update.
5. Select a paragraph, right-click → “Grade this text” (if context menu present) or use the panel action, and verify a fresh analysis event.
6. Check DevTools console for runtime errors. None should appear; note any exceptions.

### Quick Pass/Fail Log

- Badge detection: [x] Pass / [ ] Fail (notes: ...)
- Sidepanel render: [x] Pass / [ ] Fail (notes: ...)
- Uncommon term definitions: [ ] Pass / [ ] Fail (notes: ...)
- Diagnostics metrics (optional): [ ] Pass / [ ] Fail (notes: ...)
- No runtime errors: [x] Pass / [ ] Fail (notes: ...)
