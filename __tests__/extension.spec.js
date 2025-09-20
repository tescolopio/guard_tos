const { test, expect } = require("@playwright/test");
const path = require("path");

test("extension loads correctly", async ({ page }) => {
  await page.goto("https://playwright.dev/");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});
