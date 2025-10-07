#!/usr/bin/env node
/**
 * diff_terms.js
 * Generalized diff script for multiple services (e.g., sam-gov, quora).
 * Mirrors logic from diff_samgov.js but parameterized by service id and paths.
 *
 * Usage:
 *   node scripts/diff_terms.js --service sam-gov
 *   node scripts/diff_terms.js --service quora
 *
 * Exit codes:
 *   0 -> No change
 *   1 -> Change detected (diff written)
 *   2 -> Error (e.g., not enough batches)
 */
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const out = {};
  process.argv.slice(2).forEach((arg, idx, arr) => {
    if (arg.startsWith('--')) {
      const [k, v] = arg.includes('=') ? arg.split('=') : [arg, arr[idx + 1]];
      out[k.replace(/^--/, '')] = v === undefined ? true : v;
    }
  });
  return out;
}

const args = parseArgs();
const service = args.service;
if (!service) {
  console.error('Missing --service <id>');
  process.exit(2);
}

const SERVICES_CONFIG_PATH = path.resolve('config/services.json');

function loadServicesRegistry() {
  if (!fs.existsSync(SERVICES_CONFIG_PATH)) {
    console.error('Services config missing:', SERVICES_CONFIG_PATH);
    process.exit(2);
  }
  try {
    return JSON.parse(fs.readFileSync(SERVICES_CONFIG_PATH, 'utf8'));
  } catch (err) {
    console.error('Failed to parse services config:', err.message);
    process.exit(2);
  }
}

const SERVICES_REGISTRY = loadServicesRegistry();
const serviceConfig = SERVICES_REGISTRY[service];
if (!serviceConfig) {
  console.error('Unknown service id:', service);
  process.exit(2);
}

const serviceLabel = serviceConfig.label || service;
const diffConfig = serviceConfig.diff || {};
const policies = diffConfig.policies || {};
const defaultPolicy = diffConfig.defaultPolicy || Object.keys(policies)[0];
const policy = args.policy || defaultPolicy;

if (!policy || !policies[policy]) {
  console.error(`Policy "${policy}" not defined for service ${service}.`);
  process.exit(2);
}

const policyConfig = policies[policy];

const CAPTURE_ROOT = path.resolve(serviceConfig.capture?.outputRoot || path.join('data', 'captures', service));
const DIFF_PREFIX = policyConfig.diffPrefix || `${service}-${policy}`;
const IGNORE_CONFIG = policyConfig.ignorePatternFile ? path.resolve(policyConfig.ignorePatternFile) : null;
const VERSION_HISTORY = policyConfig.versionHistoryFile ? path.resolve(policyConfig.versionHistoryFile) : path.resolve('docs/analysis/diffs', `${DIFF_PREFIX}-version-history.json`);
const MARKDOWN_FILE = policyConfig.markdownFile || 'terms.md';
const META_NAME = policyConfig.metaName || policy;

const DIFF_OUT_DIR = path.resolve('docs/analysis/diffs');

function extractMetaEntry(meta, metaName) {
  if (!meta) return {};
  const match = (entry) => entry && (entry.name === metaName || entry.page === metaName || entry.id === metaName);

  if (Array.isArray(meta)) {
    return meta.find(match) || {};
  }

  if (typeof meta === 'object') {
    if (match(meta)) return meta;
    for (const value of Object.values(meta)) {
      if (Array.isArray(value)) {
        const found = value.find(match);
        if (found) return found;
      }
    }
  }

  return {};
}

function loadBatches() {
  if (!fs.existsSync(CAPTURE_ROOT)) return [];
  return fs.readdirSync(CAPTURE_ROOT)
    .filter(d => /\d{4}-\d{2}-\d{2}T/.test(d))
    .sort();
}

function readMeta(batch) {
  const metaPath = path.join(CAPTURE_ROOT, batch, 'meta.json');
  if (!fs.existsSync(metaPath)) return null;
  try { return JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch { return null; }
}

function loadMarkdown(batch) {
  const mdPath = path.join(CAPTURE_ROOT, batch, MARKDOWN_FILE);
  if (!fs.existsSync(mdPath)) return '';
  return fs.readFileSync(mdPath, 'utf8');
}

function loadIgnorePatterns(ignorePath) {
  if (!ignorePath || !fs.existsSync(ignorePath)) return [];
  try {
    const arr = JSON.parse(fs.readFileSync(ignorePath, 'utf8'));
    return Array.isArray(arr) ? arr.map(s => new RegExp(s, 'i')) : [];
  } catch (e) {
    console.warn('Failed to parse ignore config; proceeding without filters:', e.message);
    return [];
  }
}

function paragraphize(text, ignoreRegexes) {
  return text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .filter(p => !ignoreRegexes.some(r => r.test(p)));
}

function diffParagraphs(oldParas, newParas) {
  const oldSet = new Set(oldParas);
  const newSet = new Set(newParas);
  const added = newParas.filter(p => !oldSet.has(p));
  const removed = oldParas.filter(p => !newSet.has(p));
  return { added, removed };
}

function wordTokens(p) {
  return p.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function jaccard(aTokens, bTokens) {
  const aSet = new Set(aTokens);
  const bSet = new Set(bTokens);
  let intersection = 0;
  for (const t of aSet) if (bSet.has(t)) intersection++;
  const union = aSet.size + bSet.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function sentenceSplit(p) {
  return p.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 0);
}

function detectEffectiveDate(md) {
  const lines = md.split(/\n/).map(l => l.trim()).filter(Boolean);
  const dateRegex = /(Effective|Last\s+Updated|Last\s+Modified)[^\n]*?(January|February|March|April|May|June|July|August|September|October|November|December|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})[^\n]*/i;
  for (const line of lines) {
    const m = line.match(dateRegex);
    if (m) {
      const dateTokenMatch = line.match(/(January|February|March|April|May|June|July|August|September|October|November|December\s+\d{1,2},\s*\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})/);
      const dateToken = dateTokenMatch ? dateTokenMatch[0] : line;
      return { line, dateToken };
    }
  }
  return null;
}

function loadVersionHistory(historyPath) {
  if (!historyPath || !fs.existsSync(historyPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
  } catch {
    return [];
  }
}

function saveVersionHistory(historyPath, history) {
  if (!historyPath) return;
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8');
}

function main() {
  const batches = loadBatches();
  if (batches.length < 2) {
    console.warn('Not enough capture batches to diff for service', service, 'policy', policy);
    process.exit(0);
  }

  const latest = batches[batches.length - 1];
  const previous = batches[batches.length - 2];

  const latestMeta = readMeta(latest) || [];
  const prevMeta = readMeta(previous) || [];
  const latestEntry = extractMetaEntry(latestMeta, META_NAME) || {};
  const prevEntry = extractMetaEntry(prevMeta, META_NAME) || {};
  const hashChanged = (latestEntry.sha256_sanitized || '') !== (prevEntry.sha256_sanitized || '');

  const latestMd = loadMarkdown(latest);
  const prevMd = loadMarkdown(previous);
  const ignoreRegexes = loadIgnorePatterns(IGNORE_CONFIG);

  const latestParas = paragraphize(latestMd, ignoreRegexes);
  const prevParas = paragraphize(prevMd, ignoreRegexes);
  const { added, removed } = diffParagraphs(prevParas, latestParas);

  const modifications = [];
  const addedRemaining = [];
  const removedRemaining = [...removed];
  const SIM_THRESHOLD = 0.6;

  for (const a of added) {
    const aTokens = wordTokens(a);
    let best = null;
    let bestScore = 0;
    let bestIndex = -1;
    removedRemaining.forEach((r, idx) => {
      const score = jaccard(aTokens, wordTokens(r));
      if (score > bestScore) {
        bestScore = score;
        best = r;
        bestIndex = idx;
      }
    });
    if (best && bestScore >= SIM_THRESHOLD) {
      const oldSent = sentenceSplit(best);
      const newSent = sentenceSplit(a);
      const oldSet = new Set(oldSent);
      const newSet = new Set(newSent);
      const sentAdded = newSent.filter(s => !oldSet.has(s));
      const sentRemoved = oldSent.filter(s => !newSet.has(s));
      modifications.push({
        similarity: parseFloat(bestScore.toFixed(2)),
        old: best,
        new: a,
        sentences_added: sentAdded,
        sentences_removed: sentRemoved
      });
      removedRemaining.splice(bestIndex, 1);
    } else {
      addedRemaining.push(a);
    }
  }

  const finalAdded = addedRemaining;
  const finalRemoved = removedRemaining;

  const effectiveInfo = detectEffectiveDate(latestMd);
  let versionHistory = loadVersionHistory(VERSION_HISTORY);
  let effectiveChange = false;
  if (effectiveInfo) {
    const last = versionHistory[versionHistory.length - 1];
    if (!last || last.dateToken !== effectiveInfo.dateToken) {
      versionHistory.push({
        batch: latest,
        detected_at: new Date().toISOString(),
        dateToken: effectiveInfo.dateToken,
        line: effectiveInfo.line
      });
      saveVersionHistory(VERSION_HISTORY, versionHistory);
      effectiveChange = true;
    }
  }

  if (!hashChanged && finalAdded.length === 0 && finalRemoved.length === 0 && modifications.length === 0 && !effectiveChange) {
    console.log(`[${service}/${policy}] No substantive change from ${previous} to ${latest}`);
    process.exit(0);
  }

  if (!fs.existsSync(DIFF_OUT_DIR)) fs.mkdirSync(DIFF_OUT_DIR, { recursive: true });
  const outPath = path.join(DIFF_OUT_DIR, `${DIFF_PREFIX}-${latest}.md`);
  const ts = new Date().toISOString();
  const lines = [];
  lines.push(`# ${serviceLabel} – ${policy} Terms Diff Report`);
  lines.push(`Generated: ${ts}`);
  lines.push(`Previous Batch: ${previous}`);
  lines.push(`Current Batch: ${latest}`);
  lines.push('');
  lines.push('## Hash Comparison');
  lines.push('| Aspect | Previous | Current | Changed |');
  lines.push('|--------|----------|---------|---------|');
  lines.push(`| Sanitized Hash | ${prevEntry.sha256_sanitized || 'n/a'} | ${latestEntry.sha256_sanitized || 'n/a'} | ${hashChanged ? 'YES' : 'NO'} |`);
  lines.push('');
  lines.push('## Effective Date Detection');
  if (effectiveInfo) {
    lines.push(`Detected Line: ${effectiveInfo.line}`);
    lines.push(`Extracted Date Token: ${effectiveInfo.dateToken}`);
    lines.push(effectiveChange ? '*Effective date change recorded in version history.*' : '*No change from last recorded effective date.*');
  } else {
    lines.push('No effective/last updated date pattern detected.');
  }
  lines.push('');
  lines.push('## Added Paragraphs');
  if (finalAdded.length === 0) {
    lines.push('_None_');
  } else {
    finalAdded.forEach(p => lines.push(`- ${p.substring(0, 400)}${p.length > 400 ? '…' : ''}`));
  }
  lines.push('');
  lines.push('## Removed Paragraphs');
  if (finalRemoved.length === 0) {
    lines.push('_None_');
  } else {
    finalRemoved.forEach(p => lines.push(`- ${p.substring(0, 400)}${p.length > 400 ? '…' : ''}`));
  }
  lines.push('');
  lines.push('## Modified Paragraphs (Similarity-Based)');
  if (modifications.length === 0) {
    lines.push('_None_');
  } else {
    modifications.forEach((m, idx) => {
      lines.push(`### Modification ${idx + 1} (Similarity ${m.similarity})`);
      lines.push('**Old:**');
      lines.push(m.old.length > 600 ? m.old.slice(0, 600) + '…' : m.old);
      lines.push('');
      lines.push('**New:**');
      lines.push(m.new.length > 600 ? m.new.slice(0, 600) + '…' : m.new);
      if (m.sentences_added.length || m.sentences_removed.length) {
        lines.push('');
        lines.push('Sentences Added:');
        lines.push(m.sentences_added.length ? m.sentences_added.map(s => `- ${s}`).join('\n') : '_None_');
        lines.push('Sentences Removed:');
        lines.push(m.sentences_removed.length ? m.sentences_removed.map(s => `- ${s}`).join('\n') : '_None_');
      }
      lines.push('');
    });
  }
  lines.push('');
  lines.push('## Summary');
  const drivers = [];
  if (hashChanged) drivers.push('hash change');
  if (finalAdded.length) drivers.push('added paragraphs');
  if (finalRemoved.length) drivers.push('removed paragraphs');
  if (modifications.length) drivers.push('modified paragraphs');
  if (effectiveChange) drivers.push('effective date change');
  lines.push(drivers.length ? `Change drivers: ${drivers.join(', ')}.` : 'No significant textual change components.');
  lines.push('');
  lines.push('> Automated report. Re-run readability & rights index review if substantive legal changes present.');

  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`[${service}/${policy}] Diff report written:`, outPath);
  process.exit(1);
}

main();
