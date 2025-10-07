#!/usr/bin/env node
/**
 * Capture GitHub Terms of Service content using the shared service registry.
 * - Reads selectors + targets from config/services.json
 * - Extracts main content, sanitizes, converts to Markdown, and records provenance
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const puppeteer = require('puppeteer');
const TurndownService = require('turndown');

const SERVICE_ID = 'github';
const SERVICES_CONFIG_PATH = path.resolve('config/services.json');

function loadServicesConfig() {
  if (!fs.existsSync(SERVICES_CONFIG_PATH)) {
    throw new Error(`Services config missing at ${SERVICES_CONFIG_PATH}`);
  }
  const raw = fs.readFileSync(SERVICES_CONFIG_PATH, 'utf8');
  return JSON.parse(raw);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function hashSha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function sanitize(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractContent(page, candidateSelectors) {
  return page.evaluate((selectors) => {
    const pickLargest = (nodes) => {
      let best = null;
      let bestLen = 0;
      nodes.forEach(node => {
        const text = node.innerText || '';
        const len = text.split(/\s+/).length;
        if (len > bestLen) {
          best = node;
          bestLen = len;
        }
      });
      return best;
    };

    for (const selector of selectors) {
      const nodes = Array.from(document.querySelectorAll(selector));
      if (nodes.length === 1) {
        const el = nodes[0];
        const len = (el.innerText || '').split(/\s+/).length;
        if (len > 150) {
          return { selectorUsed: selector, html: el.outerHTML };
        }
      } else if (nodes.length > 1) {
        const largest = pickLargest(nodes);
        if (largest) {
          const len = (largest.innerText || '').split(/\s+/).length;
          if (len > 150) {
            return { selectorUsed: `${selector} (largest)`, html: largest.outerHTML };
          }
        }
      }
    }

    return { selectorUsed: 'body', html: document.body.outerHTML };
  }, candidateSelectors);
}

async function run() {
  const config = loadServicesConfig();
  const serviceConfig = config[SERVICE_ID];
  if (!serviceConfig) {
    throw new Error(`Service ${SERVICE_ID} missing from services.json`);
  }
  const captureConfig = serviceConfig.capture || {};
  const targets = captureConfig.targets || [];
  if (!targets.length) {
    throw new Error(`No capture targets configured for ${SERVICE_ID}`);
  }
  const outputRoot = path.resolve(captureConfig.outputRoot || path.join('data', 'captures', SERVICE_ID));

  const batchId = new Date().toISOString().replace(/[:]/g, '-');
  const outDir = path.join(outputRoot, batchId);
  ensureDir(outDir);

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });
  const meta = { batchId, capturedAt: new Date().toISOString(), service: SERVICE_ID, pages: [] };

  try {
    for (const target of targets) {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) TermsGuardianBot/1.0 Chrome/120 Safari/537.36');
      await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await new Promise(resolve => setTimeout(resolve, 2000));

      const selectors = target.candidateSelectors || ['main', 'article', 'div.markdown-body'];
      const { selectorUsed, html } = await extractContent(page, selectors);
      const sanitized = sanitize(html);
      const markdown = turndown.turndown(sanitized);

      const rawBuf = Buffer.from(html, 'utf-8');
      const sanitizedBuf = Buffer.from(sanitized, 'utf-8');
      const mdBuf = Buffer.from(markdown, 'utf-8');

      const sha256_raw = await hashSha256(rawBuf);
      const sha256_sanitized = await hashSha256(sanitizedBuf);
      const sha256_md = await hashSha256(mdBuf);

      const baseName = target.name;
      fs.writeFileSync(path.join(outDir, `${baseName}.raw.html`), rawBuf);
      fs.writeFileSync(path.join(outDir, `${baseName}.sanitized.html`), sanitizedBuf);
      fs.writeFileSync(path.join(outDir, `${baseName}.md`), mdBuf);

      meta.pages.push({
        name: baseName,
        url: target.url,
        selector_used: selectorUsed,
        sha256_raw,
        sha256_sanitized,
        sha256_md,
        bytes: {
          raw: rawBuf.length,
          sanitized: sanitizedBuf.length,
          md: mdBuf.length
        }
      });

      await page.close();
    }

    fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2));
    console.log(`GitHub capture complete: ${outDir}`);
    meta.pages.forEach(p => {
      console.log(` - ${p.name} selector=${p.selector_used} mdHash=${p.sha256_md}`);
    });
  } catch (err) {
    console.error('Capture error:', err.message || err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  run().catch(err => {
    console.error('Unhandled capture error:', err.message || err);
    process.exit(1);
  });
}
