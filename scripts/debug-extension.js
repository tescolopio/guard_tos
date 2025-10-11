#!/usr/bin/env node
/**
 * @file debug-extension.js
 * @description Launch Chrome with extension and capture console output
 */

const { chromium } = require('playwright');
const path = require('path');

async function debugExtension() {
  console.log('🚀 Launching Chrome with Terms Guardian extension...\n');
  
  const extensionPath = path.join(__dirname, '../dist');
  console.log(`📁 Extension path: ${extensionPath}\n`);

  // Launch browser with extension
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-dev-shm-usage',
    ],
    devtools: true, // Open DevTools automatically
  });

  const page = await context.newPage();

  // Capture all console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    const emoji = {
      'log': '📝',
      'info': 'ℹ️',
      'warn': '⚠️',
      'error': '❌',
      'debug': '🐛'
    }[type] || '📄';

    console.log(`${emoji} [${type.toUpperCase()}] ${text}`);
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.error('❌ [PAGE ERROR]', error.message);
  });

  // Capture request failures
  page.on('requestfailed', request => {
    console.error('❌ [REQUEST FAILED]', request.url(), request.failure().errorText);
  });

  console.log('🌐 Navigating to test page...\n');
  await page.goto('http://localhost:8080/simple-tos.html', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });

  console.log('\n✅ Page loaded. Waiting for content script...\n');
  await page.waitForTimeout(5000);

  // Check if content script loaded
  const hasAttribute = await page.evaluate(() => {
    return document.body.hasAttribute('data-terms-guardian-loaded');
  });

  if (hasAttribute) {
    console.log('✅ Content script attribute found on body');
  } else {
    console.log('❌ Content script attribute NOT found on body');
  }

  // Check global flag
  const hasGlobalFlag = await page.evaluate(() => {
    return window.termsGuardianContentLoaded === true;
  });

  if (hasGlobalFlag) {
    console.log('✅ Content script global flag is set');
  } else {
    console.log('❌ Content script global flag is NOT set');
  }

  console.log('\n⏳ Monitoring console for 30 seconds...');
  console.log('(Chrome will stay open - check DevTools manually)\n');
  
  await page.waitForTimeout(30000);

  console.log('\n✅ Test complete. Closing browser...');
  await context.close();
}

// Run the debug
debugExtension().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
