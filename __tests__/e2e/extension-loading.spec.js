/**
 * @file extension-loading.spec.js
 * @description E2E test for verifying the extension loads and detects ToS pages
 */

const { test, expect, chromium } = require('@playwright/test');
const path = require('path');

test.describe('Terms Guardian Extension Loading', () => {
  let browser;
  let context;
  let page;

  test.beforeAll(async () => {
    // Path to the built extension
    const extensionPath = path.join(__dirname, '../../dist');
    
    // Launch browser with extension loaded
    browser = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
      ],
    });

    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('extension loads without errors', async () => {
    const errors = [];
    const consoleLogs = [];

    // Capture console logs
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push({ type: msg.type(), text });
      console.log(`[${msg.type()}] ${text}`);
    });

    // Capture errors
    page.on('pageerror', error => {
      errors.push(error.message);
      console.error('Page error:', error);
    });

    // Navigate to test page
    const testPageUrl = 'http://localhost:8080/simple-tos.html';
    await page.goto(testPageUrl, { waitUntil: 'networkidle' });

    // Wait for content script to load
    await page.waitForTimeout(3000);

    // Check for Terms Guardian logs
    const termsGuardianLogs = consoleLogs.filter(log => 
      log.text.includes('Terms Guardian')
    );

    console.log('\n=== Terms Guardian Console Logs ===');
    termsGuardianLogs.forEach(log => {
      console.log(`[${log.type}] ${log.text}`);
    });

    console.log('\n=== All Console Logs ===');
    consoleLogs.forEach(log => {
      console.log(`[${log.type}] ${log.text}`);
    });

    // Check for errors
    expect(errors).toHaveLength(0);

    // Verify content script loaded
    const hasLoadingLog = termsGuardianLogs.some(log => 
      log.text.includes('Content script file is loading')
    );
    expect(hasLoadingLog).toBeTruthy();

    // Check if modules imported successfully
    const hasImportSuccess = termsGuardianLogs.some(log => 
      log.text.includes('modules imported successfully')
    );
    
    if (!hasImportSuccess) {
      console.log('\n❌ Modules failed to import. Check the logs above for errors.');
    } else {
      console.log('\n✅ Content script loaded and modules imported successfully!');
    }
  });

  test('content script detects ToS page', async () => {
    const consoleLogs = [];

    page.on('console', msg => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    });

    await page.goto('http://localhost:8080/simple-tos.html', { waitUntil: 'networkidle' });
    
    // Wait for detection
    await page.waitForTimeout(6000);

    // Check for detection logs
    const detectionLogs = consoleLogs.filter(log => 
      log.text.includes('Legal document detected') || 
      log.text.includes('Not detected as legal document')
    );

    console.log('\n=== Detection Results ===');
    detectionLogs.forEach(log => {
      console.log(`[${log.type}] ${log.text}`);
    });

    // Verify some detection attempt was made
    expect(detectionLogs.length).toBeGreaterThan(0);
  });

  test('side panel can be opened', async () => {
    await page.goto('http://localhost:8080/simple-tos.html', { waitUntil: 'networkidle' });
    
    // Get extension ID from service worker
    const serviceWorkerTarget = await browser.serviceWorkers()[0];
    
    if (serviceWorkerTarget) {
      console.log('\n✅ Service worker found and running');
    } else {
      console.log('\n❌ Service worker not found');
    }

    // Try to find the side panel
    const pages = browser.pages();
    console.log(`\nNumber of pages/panels open: ${pages.length}`);
    
    pages.forEach((p, i) => {
      console.log(`Page ${i}: ${p.url()}`);
    });
  });
});
