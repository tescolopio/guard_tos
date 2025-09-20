// __tests__/helpers/test-helpers.js

/**
 * Opens the extension's side panel.
 * @param {import('@playwright/test').Page} page - The Playwright page object.
 * @param {string} extensionId - The ID of the extension.
 */
export async function openSidePanel(page, extensionId) {
  await page.goto(`chrome-extension://${extensionId}/src/panel/sidepanel.html`);
  // Add any necessary waits for the panel to be fully loaded
  await page.waitForSelector("#analysis-summary", { state: "visible" });
}

/**
 * Triggers the analysis on the current page.
 * @param {import('@playwright/test').Page} page - The Playwright page object.
 */
export async function triggerAnalysis(page) {
  // This assumes a button with id 'analyze-button' exists in the side panel
  await page.click("#analyze-button");
}

/**
 * Waits for the analysis to complete.
 * @param {import('@playwright/test').Page} page - The Playwright page object.
 */
export async function waitForAnalysisCompletion(page) {
  // This assumes the summary will be populated with some text after analysis
  await page.waitForFunction(() => {
    const summaryElement = document.querySelector("#overall-summary-text");
    return summaryElement && summaryElement.textContent.length > 0;
  });
}

/**
 * Gets the value of a specific scorecard.
 * @param {import('@playwright/test').Page} page - The Playwright page object.
 * @param {string} scoreName - The name of the score to retrieve (e.g., 'Overall Grade', 'Readability', 'Rights').
 * @returns {Promise<string>} The text content of the score.
 */
export async function getScore(page, scoreName) {
  const scoreElement = await page.waitForSelector(
    `h4:has-text("${scoreName}") + p`,
  );
  return scoreElement.textContent();
}
