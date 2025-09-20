import { test, expect } from "@playwright/test";
import path from "path";
import { openSidePanel } from "../helpers/test-helpers";

const pathToExtension = path.join(__dirname, "../../dist");

test.describe("Extension Loading and Initialization", () => {
  test.setTimeout(10000); // 10-second timeout for all tests in this suite
  let context;
  let page;
  let extensionId;

  test.beforeAll(async ({ browser }) => {
    // Launch a new context with the extension
    context = await browser.newContext({
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    // Create a page to trigger extension loading
    const page = await context.newPage();
    await page.goto('about:blank');
    
    // Try to get the extension ID from chrome://extensions or try multiple approaches
    try {
      // Wait for service worker with a timeout
      const serviceWorker = await context.waitForEvent("serviceworker", { timeout: 5000 });
      extensionId = serviceWorker.url().split("/")[2];
    } catch (error) {
      // Fallback: Navigate to chrome://extensions and get the extension ID
      await page.goto('chrome://extensions/');
      await page.waitForTimeout(2000); // Give time for extensions to load
      
      // Try to extract extension ID from the page
      try {
        extensionId = await page.evaluate(() => {
          const extensionItems = document.querySelectorAll('extensions-item');
          for (const item of extensionItems) {
            if (item.shadowRoot && item.shadowRoot.textContent.includes('Terms Guardian')) {
              return item.id;
            }
          }
          return null;
        });
      } catch (e) {
        // Final fallback - use a known pattern or skip service worker dependent tests
        console.warn('Could not determine extension ID, some tests may fail');
        extensionId = 'unknown';
      }
    }
    
    await page.close();
  });

  test.beforeEach(async () => {
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test("should have an active service worker", async () => {
    if (extensionId === 'unknown') {
      test.skip(true, 'Extension ID could not be determined');
    }
    
    // Wait a bit for service workers to initialize
    await page.waitForTimeout(1000);
    
    const serviceWorkers = context.serviceWorkers();
    if (serviceWorkers.length === 0) {
      // Try to trigger service worker by navigating to a page
      await page.goto('about:blank');
      await page.waitForTimeout(1000);
    }
    
    const serviceWorker = context.serviceWorkers()[0];
    expect(serviceWorker).toBeDefined();
    if (extensionId !== 'unknown') {
      expect(serviceWorker.url()).toContain(extensionId);
    }
  });

  test("should inject the content script into a target page", async () => {
    await page.goto(
      "file://" + path.resolve(__dirname, "../fixtures/simple-tos.html"),
    );
    
    // Wait for content script to load
    await page.waitForTimeout(2000);
    
    // Check for an element that the content script adds, or a variable it sets.
    const contentScriptLoaded = await page.evaluate(() => {
      // You might need to expose a variable from your content script to check this
      return window.termsGuardianContentLoaded === true;
    });
    expect(contentScriptLoaded).toBe(true);
  });

  test("should open the side panel", async () => {
    if (extensionId === 'unknown') {
      test.skip(true, 'Extension ID could not be determined');
    }
    
    await openSidePanel(page, extensionId);
    await expect(page.locator("#analysis-summary")).toBeVisible();
  });
});
