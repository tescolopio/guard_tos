/**
 * Quick test script - just checks console logs for 15 seconds
 */

const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const distPath = path.resolve(__dirname, '../dist');
  
  console.log('🚀 Launching Chrome with extension...\n');
  
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${distPath}`,
      `--load-extension=${distPath}`,
      '--no-sandbox',
    ],
  });

  const page = await context.newPage();
  
  // Capture console messages
  const logs = [];
  const errors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    logs.push({ type, text });
    
    const emoji = {
      'log': '📝',
      'info': 'ℹ️',
      'warn': '⚠️',
      'error': '❌',
      'debug': '🐛'
    }[type] || '📝';
    
    if (text.includes('Terms Guardian') || text.includes('[INFO]') || text.includes('[ERROR]') || text.includes('[WARN]') || text.includes('[DEBUG]')) {
      console.log(`${emoji} [${type.toUpperCase()}] ${text}`);
    }
    
    if (type === 'error') {
      errors.push(text);
    }
  });

  console.log('🌐 Navigating to test page...\n');
  await page.goto('http://localhost:8080/simple-tos.html', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });

  console.log('\n⏳ Waiting 15 seconds...\n');
  await page.waitForTimeout(15000);

  // Check results
  const hasAttribute = await page.evaluate(() => {
    return document.body.hasAttribute('data-terms-guardian-loaded');
  });

  const hasGlobalFlag = await page.evaluate(() => {
    return window.termsGuardianContentLoaded === true;
  });

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS:');
  console.log('='.repeat(60));
  console.log(`✓ Content script attribute: ${hasAttribute ? '✅ YES' : '❌ NO'}`);
  console.log(`✓ Global flag set: ${hasGlobalFlag ? '✅ YES' : '❌ NO'}`);
  console.log(`✓ Total console messages: ${logs.length}`);
  console.log(`✓ Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  } else {
    console.log('\n🎉 NO ERRORS!');
  }
  
  await context.close();
  console.log('\n✅ Test complete!');
  process.exit(0);
})();
