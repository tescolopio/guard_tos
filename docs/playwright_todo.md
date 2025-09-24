# Playwright E2E TODOs — Terms Guardian

Last updated: 2025-09-23

This plan defines the end-to-end (E2E) testing tasks to validate the Chrome extension in a real Chromium browser using Playwright. It aligns with the overall roadmap (see `docs/roadmap-and-todos.md`) and testing principles (see `docs/testing-guidelines.md`).

## Scope

- Load the extension, navigate to test ToS pages, and validate UI/UX and analysis outputs.
- Cover A–F grade rendering, messaging flows, diagnostics, and error handling.
- Run deterministically in CI with strict timeouts and retries.

## Prerequisites

- Node/npm installed; repo dependencies installed
- Production build available (or dev build flow) to load the extension
- Curated ToS fixtures available under `test-pages/` or `docs/fixtures/`

---

## 1) Test Infrastructure Setup

- [ ] Create Playwright config dedicated to extension E2E (if not present)
  - [ ] Chromium only; headed by default for local runs
  - [ ] Global timeout ≤ 120s per test; expect timeouts set accordingly
  - [ ] Reporter: list + HTML
- [ ] Create test helpers for loading MV3 extension
  - [ ] Build artifact path resolution (dist/)
  - [ ] Launch with `--disable-extensions-except` and `--load-extension`
  - [ ] Get extension id via `chrome://extensions` or service worker URL resolution
- [ ] Add command documentation in `docs/testing-guidelines.md` (with timeout usage)

Acceptance:

- Can programmatically launch Chromium with the unpacked extension and get its extension ID.

---

## 2) Local HTTP Fixture Server

Why: Playwright can’t grant `file://` permissions; serve fixtures via HTTP for realistic context.

- [ ] Add a tiny static server (Node/Express or http-server) to host fixtures
  - [ ] Serve `test-pages/` and `docs/fixtures/` under a known base URL (e.g., http://localhost:5173)
  - [ ] Provide npm scripts to start/stop server
  - [ ] Ensure CORS/offline behavior mirrored if needed
- [ ] Add Playwright setup to start server before tests and stop after

Acceptance:

- Fixture pages are reachable over HTTP and usable by tests in CI.

---

## 3) Extension Initialization Tests

- [ ] Verify service worker activation (MV3) and no console errors
- [ ] Verify content script injection on legal pages
- [ ] Verify badge update when legal text is detected
- [ ] Verify sidepanel can be opened via API/keyboard and loads base UI

Acceptance:

- Badge updates and sidepanel loads without runtime errors on a simple fixture page.

---

## 4) Analysis Pipeline Validation

- [ ] Trigger full analysis on a curated ToS fixture
  - [ ] Summary renders with non-empty text
  - [ ] Readability grading appears with expected fields
  - [ ] Rights assessment loads with clause counts
  - [ ] Uncommon terms list populates with definitions available on hover/tooltip
- [ ] Diagnostics (if feature flag on) render dictionary cache metrics

Acceptance:

- All core analysis sections render; no unhandled promise rejections in console.

---

## 5) Grade-Based UX Checks (A–F)

- [ ] Category grades render with correct colors and labels
- [ ] Overall grade aggregates category grades correctly
- [ ] Confidence indicators show reasonable values (0–100%)
- [ ] Explanations contain patterns or fallback messages
- [ ] Edge: no clear signals → neutral grade handling (e.g., default to C with note)

Acceptance:

- Visual grade badges (A–F) and numeric score equivalents match the mapping rules in `docs/grade-based-implementation.md`.

---

## 6) ML Toggle and Fallback Paths

- [ ] With ML disabled (feature flag), rule-only behavior is deterministic
- [ ] With ML enabled, results remain within expected bounds with no crashes
- [ ] Graceful fallback if model assets unavailable (simulated by blocking URL)

Acceptance:

- Both ML-on and ML-off runs complete; ML failures don’t break UX.

---

## 7) Accessibility & UX Polish

- [ ] Keyboard navigation reaches grade badges and tooltips
- [ ] ARIA labels exist for key UI elements in sidepanel
- [ ] Color contrast meets WCAG AA for grade colors
- [ ] Loading and error states are visible and informative

Acceptance:

- aXe or equivalent checks pass for the panel; manual checks confirm contrast and labels.

---

## 8) Performance & Stability

- [ ] Analysis completes under target time on large fixture (>10k words)
- [ ] No memory leaks across multiple navigations (basic heuristic via heap snapshots optional)
- [ ] Retries configured for flaky navigation/selectors (≤2 retries)

Acceptance:

- E2E suite completes in <5 minutes locally and in CI; flake rate <3%.

---

## 9) CI Integration

- [ ] Add Playwright to CI workflow (`.github/workflows/playwright.yml`)
  - [ ] Ensure extension build step runs before tests
  - [ ] Start fixture server service in CI job
  - [ ] Run with strict timeouts using `timeout` wrapper
  - [ ] Upload Playwright HTML report as artifact

Acceptance:

- CI job runs the E2E suite reliably with artifacts uploaded for failures.

---

## 10) Reporting & Maintenance

- [ ] Add a troubleshooting section to `docs/testing-guidelines.md`
- [ ] Document common failure modes: extension not loading, service worker inactive, permissions
- [ ] Keep curated pages list up to date; tag tricky cases
- [ ] Record manual E2E passes in `docs/test-session-log.md`

Acceptance:

- Engineers can self-serve to diagnose E2E failures and update fixtures.

---

## References

- Roadmap: `docs/roadmap-and-todos.md`
- Testing guidelines: `docs/testing-guidelines.md`
- Manual testing plan: `docs/manual-testing-plan.md`
- QA checklist: `docs/qa_checklist.md`
- Grade spec: `docs/grade-based-implementation.md`
- ML plan: `docs/ml-enhancement-plan.md` and `docs/training_progress.md`
- Curated ToS pages: `test-pages/` and `docs/fixtures/`
