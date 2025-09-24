# E2E Smoke Guide

Quick path to validate the extension end‑to‑end. Use after a production build and before releases.

## Scope

- Installation/activation
- ToS detection and pipeline (extraction → readability → rights → summary → URI)
- Side panel UI and popups
- Background messaging, storage, and notifications
- Caching behavior

## Environment setup

1. Build production bundle.
2. Load unpacked extension in Chrome (chrome://extensions, Developer mode ON).
3. Open a fresh profile or disable other extensions to avoid noise.

## Scenarios

1. Detect ToS and open side panel

- Navigate to a known ToS page (e.g., GitHub, Pinterest, Reddit, or the included sample fixture hosted locally)
- Verify badge state and that a notification can be triggered via context menu
- Ensure background logs no errors

1. Run full analysis

- Confirm extracted words count > 100
- Readability grade renders with numeric score and explanation
- Rights Index (legacy) renders score and clause counts grid when toggled
- User Rights Index (URI) renders overall letter grade and 8 categories with scores/sentiment

1. Popups and details

- Open rights details popup: verify URI breakdown HTML appended and no NaN/undefined
- Verify summary sections render with headings, key points, and risk badges

1. Cache behavior

- Reload the same page: verify cache hit logs and faster analysis
- Change minor whitespace: verify cache remains valid (local normalization)

1. Edge and error handling

- Navigate to a short text page: analysis should not throw and shows “insufficient text” gracefully
- Simulate malformed HTML (use developer tools to wipe body): pipeline handles errors without crashing

1. Performance and stability

- Analysis completes within ~2s on medium ToS (machine dependent)
- No unhandled promise rejections in content or service worker consoles

## Acceptance criteria

- All scenarios above pass without console errors
- Unit test suite is green
- URI categories and overall grade are sensible given the document

## Notes

- For automated E2E, consider Playwright with a minimal harness that loads fixture HTML and asserts DOM in side panel. Keep it outside MV3 restrictions by testing a web demo of the panel UI where possible.
