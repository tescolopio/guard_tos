#!/usr/bin/env node
/**
 * Capture Quora Terms of Service
 * - Navigates to canonical Quora ToS URL(s)
 * - Extracts main content via progressive selector strategy
 * - Sanitizes HTML (remove nav, footer, script/style, noscript)
 * - Converts to Markdown via Turndown
 * - Generates SHA256 hashes for raw, sanitized, and markdown artifacts
 * - Persists meta.json with provenance (batch id, selectors, byte sizes)
 *
 * Reuses approach from capture-sam-gov.js with a few generalizations.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const puppeteer = require('puppeteer');
const TurndownService = require('turndown');

const OUTPUT_ROOT = path.join(__dirname, '..', 'data', 'captures', 'quora');

const TARGETS = [
  {
    name: 'main',
    url: 'https://www.quora.com/about/tos', // canonical ToS URL; adjust if redirecting
    candidateSelectors: [
      'main',
      'article',
      'div[class*="Content"]',
      'div[id*="content"]',
      'div[class*="Page"]',
      '#root'
    ]
  }
];

async function hashSha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function sanitize(html) {
  // Remove script/style/noscript and common navigation/header/footer patterns.
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    // Collapse excess whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractContent(page, candidateSelectors) {
  return page.evaluate((selectors) => {
    const pickLargest = (nodes) => {
      let best = null;
      let bestLen = 0;
      nodes.forEach(n => {
        const text = n.innerText || '';
        const len = text.split(/\s+/).length;
        if (len > bestLen) { best = n; bestLen = len; }
      });
      return best;
    };

    for (const sel of selectors) {
      const matches = Array.from(document.querySelectorAll(sel));
      if (matches.length === 1) {
        const el = matches[0];
        const textLen = (el.innerText || '').split(/\s+/).length;
        if (textLen > 150) { // heuristic threshold
          return { selectorUsed: sel, html: el.outerHTML };
        }
      } else if (matches.length > 1) {
        const largest = pickLargest(matches);
        if (largest) {
          const textLen = (largest.innerText || '').split(/\s+/).length;
          if (textLen > 150) {
            return { selectorUsed: sel + ' (largest)', html: largest.outerHTML };
          }
        }
      }
    }

    // fallback: whole body
    return { selectorUsed: 'body', html: document.body.outerHTML };
  }, candidateSelectors);
}

async function run() {
  const batchId = new Date().toISOString().replace(/[:]/g, '-');
  const outDir = path.join(OUTPUT_ROOT, batchId);
  ensureDir(outDir);

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
    const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });
    const meta = { batchId, capturedAt: new Date().toISOString(), pages: [] };

    for (const target of TARGETS) {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) TermsGuardianBot/1.0 Chrome/120 Safari/537.36');
      await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Basic wait for dynamic hydration if React-like (manual delay; waitForTimeout not available)
  await new Promise(r => setTimeout(r, 2500));

      const { selectorUsed, html } = await extractContent(page, target.candidateSelectors);
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
    console.log(`Quora capture complete: ${outDir}`);
    meta.pages.forEach(p => {
      console.log(` - ${p.name} selector=${p.selector_used} mdHash=${p.sha256_md}`);
    });
  } catch (err) {
    console.error('Capture error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  run();
}
