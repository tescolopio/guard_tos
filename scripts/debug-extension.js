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

  // Track all console messages
  const allLogs = [];

  // Launch browser with extension
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-dev-shm-usage',
    ],
    devtools: false, // Don't open DevTools automatically to reduce interference
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

    const logEntry = `${emoji} [${type.toUpperCase()}] ${text}`;
    allLogs.push(logEntry);
    console.log(logEntry);
  });

  // Capture page errors
  page.on('pageerror', error => {
    const errMsg = `❌ [PAGE ERROR] ${error.message}`;
    allLogs.push(errMsg);
    console.error(errMsg);
  });

  // Capture request failures
  page.on('requestfailed', request => {
    const errMsg = `❌ [REQUEST FAILED] ${request.url()} - ${request.failure().errorText}`;
    allLogs.push(errMsg);
    console.error(errMsg);
  });

  console.log('🌐 Navigating to test page...\n');
  await page.goto('http://localhost:8080/simple-tos.html', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });

  console.log('\n✅ Page loaded. Waiting for content script...\n');
  console.log('\n⏳ Waiting 10 seconds for initialization...\n');
  await page.waitForTimeout(10000);

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

  // Print summary of logs
  console.log('\n📊 === CONSOLE LOG SUMMARY ===');
  console.log(`Total messages: ${allLogs.length}`);
  
  const termsGuardianLogs = allLogs.filter(log => log.includes('Terms Guardian'));
  console.log(`Terms Guardian messages: ${termsGuardianLogs.length}\n`);
  
  if (termsGuardianLogs.length > 0) {
    console.log('📋 Terms Guardian Messages:');
    termsGuardianLogs.forEach(log => console.log(log));
  }

  const errors = allLogs.filter(log => log.includes('ERROR') || log.includes('error'));
  if (errors.length > 0) {
    console.log('\n⚠️ Errors detected:');
    errors.forEach(log => console.log(log));
  }

  console.log('\n✅ Debug session complete. Browser will stay open for 60 seconds...');
  console.log('Check the Chrome window for any UI or manual testing.\n');
  
  await page.waitForTimeout(60000);
  
  console.log('⏰ Closing browser...');
  await context.close();
}

// Run the debug
debugExtension().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
