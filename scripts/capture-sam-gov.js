#!/usr/bin/env node
/**
 * SAM.gov Dynamic Terms Capture
 * Fetches dynamically rendered terms pages, extracts legal content, normalizes to Markdown,
 * stores artifacts + hash metadata for change detection.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const puppeteer = require('puppeteer');
const TurndownService = require('turndown');

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

const TARGETS = [
  {
    name: 'terms',
    url: 'https://sam.gov/content/about/terms-of-use',
    selectorCandidates: [
      'sam-frontend-content-terms-of-use',
      'app-terms-of-use',
      "[class*='terms']",
      'main'
    ]
  },
  {
    name: 'sign',
    url: 'https://sam.gov/workspace/profile/sign-terms-of-use?mode=new',
    selectorCandidates: [
      'sam-frontend-content-terms-of-use',
      "[class*='sign-terms']",
      "[class*='terms']",
      'main'
    ]
  }
];

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function extractWithSelectors(page, candidates) {
  for (const sel of candidates) {
    try {
      const exists = await page.$(sel);
      if (exists) {
        const html = await page.$eval(sel, el => el.innerHTML);
        if (html && html.trim().length > 200) { // heuristic: avoid trivial shells
          return { selector: sel, html };
        }
      }
    } catch (e) {
      // ignore and try next selector
    }
  }
  // fallback full body
  const body = await page.evaluate(() => document.body.outerHTML);
  return { selector: 'body', html: body, fallback: true };
}

function sanitize(html) {
  // Remove scripts & styles & noscript blocks
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/\n{3,}/g, '\n\n');
}

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseDir = path.join(process.cwd(), 'data', 'captures', 'sam-gov', timestamp);
  fs.mkdirSync(baseDir, { recursive: true });
  const meta = [];

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    for (const target of TARGETS) {
      const page = await browser.newPage();
      const record = { name: target.name, url: target.url, selector_used: null, status: 'pending', notes: '' };
      try {
        await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        // Retry lightweight network idle simulation
        for (let i = 0; i < 5; i++) {
          await new Promise(r => setTimeout(r, 400));
          const readyState = await page.evaluate(() => document.readyState);
          if (readyState === 'complete') break;
        }
        // Additional settle pause
        await new Promise(r => setTimeout(r, 800));
        // Log console errors (non-fatal)
        page.on('console', msg => {
          if (msg.type() === 'error') record.notes += `console_error:${msg.text().slice(0,80)};`;
        });
        const { selector, html, fallback } = await extractWithSelectors(page, target.selectorCandidates);
        record.selector_used = selector;
        if (fallback) record.notes += 'fallback_full_body;';
        const rawFile = path.join(baseDir, `${target.name}.raw.html`);
        fs.writeFileSync(rawFile, html, 'utf8');
        const sanitized = sanitize(html);
        const sanitizedFile = path.join(baseDir, `${target.name}.sanitized.html`);
        fs.writeFileSync(sanitizedFile, sanitized, 'utf8');
        const markdown = turndown.turndown(sanitized);
        const mdFile = path.join(baseDir, `${target.name}.md`);
        fs.writeFileSync(mdFile, markdown, 'utf8');
        record.sha256_raw = sha256(html);
        record.sha256_sanitized = sha256(sanitized);
        record.sha256_md = sha256(markdown);
        record.status = 'success';
        record.bytes_raw = html.length;
        record.bytes_sanitized = sanitized.length;
        record.bytes_md = markdown.length;
        // Simple heuristic to flag probable shell-only capture
        if (markdown.split(/\s+/).length < 120) {
          record.notes += 'low_word_count;';
          record.status = 'suspect-shell';
        }
      } catch (e) {
        record.status = 'error';
        record.notes += (e && e.message ? e.message.substring(0, 140) : 'unknown_error');
      } finally {
        meta.push(record);
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(baseDir, 'meta.json'), JSON.stringify(meta, null, 2));
  console.log(`Capture complete: ${baseDir}`);
  console.table(meta.map(m => ({ name: m.name, status: m.status, selector: m.selector_used, notes: m.notes })));
}

main().catch(e => {
  console.error('Capture failed:', e);
  process.exit(1);
});
