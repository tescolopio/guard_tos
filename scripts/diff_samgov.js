#!/usr/bin/env node
/**
 * diff_samgov.js
 * Compare the latest two SAM.gov capture batches (markdown + sanitized hash) and emit a diff report.
 *
 * Output: docs/analysis/diffs/sam-gov-<newBatchId>.md
 * Exit codes:
 *   0 -> No change detected
 *   1 -> Change detected & diff file written
 *   2 -> Error (e.g., not enough batches)
 */
const fs = require('fs');
const path = require('path');

const CAPTURE_ROOT = path.resolve('data/captures/sam-gov');
const DIFF_OUT_DIR = path.resolve('docs/analysis/diffs');
const IGNORE_CONFIG = path.resolve('docs/analysis/diffs/.samgov-ignore.json');
const VERSION_HISTORY = path.resolve('docs/analysis/diffs/sam-gov-version-history.json');

function loadBatches() {
  if (!fs.existsSync(CAPTURE_ROOT)) return [];
  return fs.readdirSync(CAPTURE_ROOT)
    .filter(d => /\d{4}-\d{2}-\d{2}T/.test(d))
    .sort();
}

function readMeta(batch) {
  const metaPath = path.join(CAPTURE_ROOT, batch, 'meta.json');
  if (!fs.existsSync(metaPath)) return null;
  return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
}

function loadMarkdown(batch) {
  const mdPath = path.join(CAPTURE_ROOT, batch, 'terms.md');
  if (!fs.existsSync(mdPath)) return '';
  return fs.readFileSync(mdPath, 'utf8');
}

function loadIgnorePatterns() {
  if (!fs.existsSync(IGNORE_CONFIG)) return [];
  try {
    const arr = JSON.parse(fs.readFileSync(IGNORE_CONFIG, 'utf8'));
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
  // Simple LCS-based diff can be heavy; use hash map approach for heuristic diff.
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
  // Search for common patterns: Effective, Last Updated, Last Modified
  const lines = md.split(/\n/).map(l => l.trim()).filter(Boolean);
  const dateRegex = /(Effective|Last\s+Updated|Last\s+Modified)[^\n]*?(January|February|March|April|May|June|July|August|September|October|November|December|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})[^\n]*/i;
  for (const line of lines) {
    const m = line.match(dateRegex);
    if (m) {
      // Extract date token heuristically (second capturing group or substring following label)
      const dateTokenMatch = line.match(/(January|February|March|April|May|June|July|August|September|October|November|December\s+\d{1,2},\s*\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})/);
      const dateToken = dateTokenMatch ? dateTokenMatch[0] : line;
      return { line, dateToken };
    }
  }
  return null;
}

function loadVersionHistory() {
  if (!fs.existsSync(VERSION_HISTORY)) return [];
  try {
    return JSON.parse(fs.readFileSync(VERSION_HISTORY, 'utf8'));
  } catch {
    return [];
  }
}

function saveVersionHistory(history) {
  fs.writeFileSync(VERSION_HISTORY, JSON.stringify(history, null, 2), 'utf8');
}

function main() {
  const batches = loadBatches();
  if (batches.length < 2) {
    console.error('Not enough capture batches to diff. Need at least 2.');
    process.exit(2);
  }
  const latest = batches[batches.length - 1];
  const previous = batches[batches.length - 2];
  const latestMeta = readMeta(latest) || [];
  const prevMeta = readMeta(previous) || [];

  const latestTermsMeta = latestMeta.find(m => m.name === 'terms') || {};
  const prevTermsMeta = prevMeta.find(m => m.name === 'terms') || {};

  const hashChanged = latestTermsMeta.sha256_sanitized !== prevTermsMeta.sha256_sanitized;

  const latestMd = loadMarkdown(latest);
  const prevMd = loadMarkdown(previous);
  const ignoreRegexes = loadIgnorePatterns();
  const latestParas = paragraphize(latestMd, ignoreRegexes);
  const prevParas = paragraphize(prevMd, ignoreRegexes);
  const { added, removed } = diffParagraphs(prevParas, latestParas);

  // Paragraph modification detection (sentence-level diff)
  const modifications = [];
  const addedRemaining = [];
  const removedRemaining = [...removed];
  const SIM_THRESHOLD = 0.6;
  // For each added paragraph, try find best match among removed
  for (const a of added) {
    const aTokens = wordTokens(a);
    let best = null;
    let bestScore = 0;
    let bestIndex = -1;
    removedRemaining.forEach((r, idx) => {
      const score = jaccard(aTokens, wordTokens(r));
      if (score > bestScore) {
        bestScore = score; best = r; bestIndex = idx;
      }
    });
    if (best && bestScore >= SIM_THRESHOLD) {
      // Sentence-level diff
      const oldSent = sentenceSplit(best);
      const newSent = sentenceSplit(a);
      const oldSet = new Set(oldSent);
      const newSet = new Set(newSent);
      const sentAdded = newSent.filter(s => !oldSet.has(s));
      const sentRemoved = oldSent.filter(s => !newSet.has(s));
      modifications.push({ similarity: parseFloat(bestScore.toFixed(2)), old: best, new: a, sentences_added: sentAdded, sentences_removed: sentRemoved });
      removedRemaining.splice(bestIndex, 1); // remove matched
    } else {
      addedRemaining.push(a);
    }
  }

  const finalAdded = addedRemaining;
  const finalRemoved = removedRemaining;

  // Effective date detection
  const effectiveInfo = detectEffectiveDate(latestMd);
  let versionHistory = loadVersionHistory();
  let effectiveChange = false;
  if (effectiveInfo) {
    const last = versionHistory[versionHistory.length - 1];
    if (!last || last.dateToken !== effectiveInfo.dateToken) {
      versionHistory.push({ batch: latest, detected_at: new Date().toISOString(), dateToken: effectiveInfo.dateToken, line: effectiveInfo.line });
      saveVersionHistory(versionHistory);
      effectiveChange = true;
    }
  }

  if (!hashChanged && finalAdded.length === 0 && finalRemoved.length === 0 && modifications.length === 0 && !effectiveChange) {
    console.log('No substantive change detected between batches', previous, 'and', latest);
    process.exit(0);
  }

  if (!fs.existsSync(DIFF_OUT_DIR)) fs.mkdirSync(DIFF_OUT_DIR, { recursive: true });
  const outPath = path.join(DIFF_OUT_DIR, `sam-gov-${latest}.md`);
  const ts = new Date().toISOString();
  const lines = [];
  lines.push(`# SAM.gov Terms Diff Report`);
  lines.push(`Generated: ${ts}`);
  lines.push(`Previous Batch: ${previous}`);
  lines.push(`Current Batch: ${latest}`);
  lines.push('');
  lines.push('## Hash Comparison');
  lines.push('| Aspect | Previous | Current | Changed |');
  lines.push('|--------|----------|---------|---------|');
  lines.push(`| Sanitized Hash | ${prevTermsMeta.sha256_sanitized || 'n/a'} | ${latestTermsMeta.sha256_sanitized || 'n/a'} | ${hashChanged ? 'YES' : 'NO'} |`);
  lines.push('');
  if (effectiveInfo) {
    lines.push('## Effective Date Detection');
    lines.push(`Detected Line: ${effectiveInfo.line}`);
    lines.push(`Extracted Date Token: ${effectiveInfo.dateToken}`);
    lines.push(effectiveChange ? '*Effective date change recorded in version history.*' : '*No change from last recorded effective date.*');
    lines.push('');
  } else {
    lines.push('## Effective Date Detection');
    lines.push('No effective/last updated date pattern detected.');
    lines.push('');
  }

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
  lines.push('> Automated report. Consider running readability and rights index review if legal substance changed.');

  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log('Diff report written:', outPath);
  process.exit(1); // signal change
}

main();
