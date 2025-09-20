# Playwright Testing Plan for Terms Guardian

This document outlines a comprehensive end-to-end testing strategy for the Terms Guardian browser extension using Playwright. The goal is to ensure functionality, reliability, and performance across various scenarios.

---

## 1. Setup & Configuration

These tasks focus on establishing a stable and repeatable testing environment.

- [x] **Finalize Playwright Configuration**:
  - Ensure `playwright.config.js` is optimized for extension testing.
  - Set up project configurations for different browsers if needed (e.g., Chrome, Firefox).
  - Confirm that the build directory (`dist/`) is correctly identified.
- [x] **Create Test Fixtures**:
  - Develop a set of local HTML files with diverse ToS content:
    - A "golden path" simple ToS page.
    - A very long and complex ToS document.
    - A page with no legal text.
    - A page with multiple, separate legal documents.
    - A single-page application (SPA) where ToS is loaded dynamically.
- [x] **Integrate with CI/CD**:
  - Create a GitHub Actions workflow (or similar) that runs `npx playwright test` on every pull request to the `main` branch.
  - Configure the CI job to automatically upload test reports and traces as artifacts.
- [x] **Helper Function Library**:
  - Create a `test-helpers.js` file to contain reusable functions, such as:
    - `openSidePanel()`
    - `triggerAnalysis()`
    - `waitForAnalysisCompletion()`
    - `getScore(scoreName)`

---

## 2. Core Functionality & UI Tests

These tests validate the primary features of the extension that users interact with directly.

- [ ] **Test 1: Extension Loading and Initialization**
  - Verify the extension's service worker becomes active after installation.
  - Confirm the content script is successfully injected into a target page.
  - Check that the browser action (toolbar icon) is visible.
- [ ] **Test 2: Side Panel Lifecycle**
  - Ensure the side panel opens correctly when the toolbar icon is clicked.
  - Verify the side panel displays a default "ready" or "idle" state on a fresh page.
  - Check that all scorecards and summary sections are empty or show default "N/A" values.
  - Confirm the side panel can be closed.
- [ ] **Test 3: End-to-End Analysis Flow (Golden Path)**
  - Navigate to a fixture page with a standard ToS.
  - Trigger the analysis.
  - Verify a "loading" or "analyzing" state appears in the side panel.
  - Wait for completion and assert that:
    - The "Overall Grade," "Readability," and "Rights" scores are populated with expected values.
    - The "Overall Summary" section contains text.
    - The "Key Excerpts" and "Uncommon Terms" lists are populated.
- [ ] **Test 4: Side Panel UI Interactivity**
  - **View Toggle**:
    - Click the "By Section" button and verify the view switches to show section-based summaries.
    - Click the "Document-Level" button and verify the view returns to the overall summary.
  - **Scorecard Pop-ups**:
    - Click each of the three main scorecards.
    - Verify that a pop-up/modal appears for each one.
    - Assert that the pop-up contains detailed metrics (e.g., Flesch score, clause counts).
  - **Links**:
    - Verify the "Terms URL" link in the header points to the correct source document.

---

## 3. Edge Cases & Error Handling

These tests ensure the extension is robust and handles unexpected situations gracefully.

- [ ] **Test 5: Handling of Non-ToS Pages**
  - Navigate to a simple page with no legal text (e.g., `about:blank` or a fixture).
  - Trigger analysis.
  - Verify the side panel displays a clear message like "No terms of service found on this page."
  - Ensure scores remain in their default/empty state.
- [ ] **Test 6: Dynamic Content & Single-Page Applications (SPAs)**
  - Navigate to an SPA fixture.
  - Perform an action that dynamically loads or navigates to a ToS view (without a full page reload).
  - Trigger analysis and verify the extension correctly finds and processes the content.
- [ ] **Test 7: Analysis of Very Long Documents**
  - Use a fixture with an exceptionally long ToS.
  - Trigger analysis and monitor for timeouts or performance degradation.
  - Ensure the analysis completes successfully and the side panel renders the results without crashing.
- [ ] **Test 8: Network and Service Errors**
  - (Requires mocking) Simulate a scenario where the analysis logic (or a future external API) fails.
  - Use `page.route()` to intercept a request and return a 500 error.
  - Verify the side panel displays a user-friendly error message (e.g., "Analysis failed. Please try again.").
- [ ] **Test 9: Caching Logic**
  - Analyze a page and verify results appear.
  - Reload the page and open the side panel.
  - Verify that the results are loaded from cache instantly (or much faster) without showing a "loading" state.
  - (Advanced) Find a way to simulate a content change and verify that a re-analysis is triggered.

---

## 4. Advanced & Non-Functional Tests

These tests focus on security, performance, and accessibility.

- [ ] **Test 10: Content Script Isolation**
  - Verify that the extension's content script does not conflict with the host page's JavaScript.
  - On a test page with its own scripts, `evaluate` a function to check that global variables or prototypes on the page have not been modified by the extension.
- [ ] **Test 11: Security & XSS**
  - Create a fixture where the ToS text contains HTML tags or script snippets (e.g., `<script>alert("XSS")</script>`).
  - Run the analysis and verify that the malicious code is **not** executed when rendered in the side panel (i.e., it is properly sanitized or displayed as plain text).
- [ ] **Test 12: Accessibility (A11y)**
  - Integrate an accessibility checker like `axe-playwright`.
  - Run an `axe` scan on the side panel after it's populated.
  - Assert that there are no critical accessibility violations.
  - Add tests for keyboard navigation:
    - Can you tab through all interactive elements (buttons, links) in the side panel?
    - Can pop-ups be opened and closed using the keyboard?
