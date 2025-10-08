#!/usr/bin/env node
/**
 * export_rights_index.js
 * Parse manual-reviews.yaml and export a normalized JSON for all documents.
 */
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const YAML_PATH = path.resolve('docs/manual-analysis/reports/manual-reviews.yaml');
const OUT_PATH = path.resolve('data/derived/manual_reviews.json');
const SCHEMA_VERSION = '1.0.0';

function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function slugify(value) {
  if (!value) return null;
  const slug = value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || null;
}

const CATEGORY_NORMALIZATION = new Map([
  ['clarity & transparency', 'Clarity & Transparency'],
  ['clarity and transparency', 'Clarity & Transparency'],
  ['data collection & use', 'Data Collection & Use'],
  ['data collection and use', 'Data Collection & Use'],
  ['user privacy', 'User Privacy'],
  ['content rights', 'Content Rights'],
  ['content & ip rights', 'Content Rights'],
  ['content and ip rights', 'Content Rights'],
  ['account management', 'Account Management'],
  ['dispute resolution', 'Dispute Resolution'],
  ['terms changes', 'Terms Changes'],
  ['algorithmic decisions', 'Algorithmic Decisions'],
  ['billing & auto-renewal', 'Billing & Auto-Renewal'],
  ['billing and auto-renewal', 'Billing & Auto-Renewal'],
  ['liability & remedies', 'Liability & Remedies'],
]);

function canonicalizeCategoryName(name) {
  if (!name) return null;
  const normalized = CATEGORY_NORMALIZATION.get(name.trim().toLowerCase());
  return normalized || name;
}

function dropIndent(line, indent) {
  if (!indent) return line;
  let count = 0;
  while (count < indent && count < line.length && line[count] === ' ') {
    count += 1;
  }
  return line.slice(count);
}

function fixListIndentation(lines) {
  const adjusted = [];
  const contextStack = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, '    ');
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      adjusted.push('');
      continue;
    }

    let indent = line.length - trimmed.length;
    const isListItem = trimmed.startsWith('- ');
    const isColonLine = trimmed.endsWith(':');

    if (!isListItem) {
      while (contextStack.length && indent < contextStack[contextStack.length - 1].indent) {
        contextStack.pop();
      }

      while (
        contextStack.length &&
        indent <= contextStack[contextStack.length - 1].indent &&
        !isColonLine
      ) {
        contextStack.pop();
      }
    }

    if (isColonLine) {
      while (contextStack.length && contextStack[contextStack.length - 1].indent >= indent) {
        contextStack.pop();
      }

      const listIndent = indent + 2;
      contextStack.push({ indent, listIndent });
      adjusted.push(' '.repeat(indent) + trimmed);
      continue;
    }

    if (isListItem) {
      const context = contextStack[contextStack.length - 1];
      const targetIndent = context ? context.listIndent : indent;
      indent = targetIndent;
      adjusted.push(' '.repeat(indent) + trimmed);
      continue;
    }

    adjusted.push(' '.repeat(indent) + trimmed);
  }

  return adjusted;
}

function sanitizeBlock(block, options = {}) {
  const { fixLists = false } = options;
  const lines = block
    .split(/\n/)
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (trimmed === 'reviews:') return false;
      if (trimmed === '---') return false;
      return true;
    });

  const docLine = lines.find((line) => /document_title\s*:/.test(line));
  const baseIndent = docLine ? docLine.match(/^ */)[0].length : 0;

  const stripped = lines.map((line) => dropIndent(line, baseIndent));
  const normalizedLines = fixLists ? fixListIndentation(stripped) : stripped;
  let joined = normalizedLines.join('\n');
  joined = joined.replace(/^(?:\s*\n)+/, '');

  const trimmedStart = joined.trimStart();
  if (/^document_title\s*:/.test(trimmedStart) && !/^\s*-\s*document_title\s*:/.test(trimmedStart)) {
    const docLines = joined.split('\n');
    if (docLines.length) {
      docLines[0] = `- ${docLines[0].trim()}`;
      for (let i = 1; i < docLines.length; i += 1) {
        if (docLines[i].trim()) {
          docLines[i] = `  ${docLines[i]}`;
        }
      }
      joined = docLines.join('\n');
    }
  }

  const dedupedLines = [];
  const seenTopLevel = new Set();
  for (const line of joined.split('\n')) {
    const trimmed = line.trim();
    const indent = line.length - line.trimStart().length;

    if (trimmed && !trimmed.startsWith('-')) {
      const keyMatch = trimmed.match(/^([A-Za-z0-9_]+):/);
      if (keyMatch && indent <= 2) {
        const key = keyMatch[1];
        if (seenTopLevel.has(key)) {
          break;
        }
        seenTopLevel.add(key);
      }
    }

    dedupedLines.push(line);
  }

  const cleaned = dedupedLines.join('\n');
  return cleaned.replace(/[\s\uFEFF\xA0]+$/, '');
}

function splitDocumentBlocks(raw) {
  const lines = raw.split(/\r?\n/);
  const blocks = [];
  let current = [];

  const flush = () => {
    if (!current.length) return;
    const block = current.join('\n').trim();
    if (block) {
      blocks.push(current.join('\n'));
    }
    current = [];
  };

  lines.forEach((line) => {
    if (/^---\s*$/.test(line)) {
      flush();
      return;
    }

    if (/^\s*-?\s*document_title\s*:/.test(line)) {
      if (current.length) {
        flush();
      }
    }

    if (!current.length && !line.trim()) {
      return;
    }

    current.push(line);
  });

  flush();
  return blocks;
}

function parseDocumentBlock(block) {
  const attemptParse = (sanitized) => {
    if (!sanitized.startsWith('- document_title:')) {
      throw new Error('Unable to locate document_title in block');
    }

    let parsed;
    try {
      parsed = YAML.parse(sanitized, { prettyErrors: true });
    } catch (error) {
      const debugPath = path.resolve('debug_failed.yaml');
      try {
        fs.writeFileSync(debugPath, sanitized, 'utf8');
      } catch (writeError) {
        // ignore file write issues
      }
      const preview = sanitized
        .split('\n')
        .slice(0, 20)
        .join('\n');
      throw new Error(`YAML parse failed: ${error.message}\n--- block preview ---\n${preview}`);
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Parsed document block did not produce a list entry');
    }

    const doc = parsed[0];
    if (!doc || typeof doc !== 'object') {
      throw new Error('Parsed document is not an object');
    }
    return doc;
  };

  try {
    const sanitized = sanitizeBlock(block, { fixLists: false });
    return attemptParse(sanitized);
  } catch (initialError) {
    if (!/YAML parse failed/.test(initialError.message)) {
      throw initialError;
    }

    const sanitizedWithFixes = sanitizeBlock(block, { fixLists: true });
    return attemptParse(sanitizedWithFixes);
  }
}

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function normalizeMetrics(metrics) {
  return ensureArray(metrics).map((metric) => ({
    name: metric?.name || null,
    score: toNumber(metric?.score),
    grade: metric?.grade || null,
    notes: metric?.notes || null,
  }));
}

function normalizeReadability(readability = {}) {
  return {
    overall_grade: readability.overall_grade || null,
    manual_observations: readability.manual_observations || null,
    metrics: normalizeMetrics(readability.metrics),
  };
}

function normalizeCategories(categories) {
  const list = ensureArray(categories).map((cat) => {
    const canonical = canonicalizeCategoryName(cat?.name);
    const slug = canonical ? slugify(canonical) : slugify(cat?.name);
    return {
      name: cat?.name || null,
      canonical_name: canonical,
      slug,
      score: toNumber(cat?.score),
      grade: cat?.grade || null,
      key_evidence: cat?.key_evidence || null,
    };
  });

  const index = {};
  for (const cat of list) {
    if (cat.slug) {
      index[cat.slug] = {
        canonical_name: cat.canonical_name || cat.name,
        score: cat.score,
        grade: cat.grade,
        key_evidence: cat.key_evidence,
      };
    }
  }

  return { list, index };
}

function normalizeSectionSummary(entry = {}) {
  return {
    section: entry.section || null,
    risk_level: entry.risk_level || null,
    rights_categories_impacted: ensureArray(entry.rights_categories_impacted).map((item) => item ?? null),
    key_takeaways: ensureArray(entry.key_takeaways).map((item) => item ?? null),
    notes: entry.notes || null,
  };
}

function normalizeGlossary(glossary) {
  return ensureArray(glossary).map((entry) => ({
    term: entry?.term || null,
    definition: entry?.definition || null,
    reference: entry?.reference || null,
  }));
}

function deriveDocumentId(doc) {
  const domain = doc.metadata?.primary_domain;
  const title = doc.document_title;
  const base = domain ? `${domain}-${title}` : title;
  return slugify(base) || slugify(doc.source_path) || null;
}

function normalizeDocument(doc) {
  const readability = normalizeReadability(doc.readability || {});
  const { list: categories, index: categoryIndex } = normalizeCategories(
    doc.user_rights_index?.categories,
  );

  return {
    id: deriveDocumentId(doc),
    schema_version: SCHEMA_VERSION,
    document_title: doc.document_title || null,
    slug: slugify(doc.document_title),
    source_path: doc.source_path || null,
    collection_date: doc.collection_date || null,
    review_date: doc.review_date || null,
    reviewer: doc.reviewer || null,
    metadata: doc.metadata || {},
    readability,
    user_rights_index: {
      overall_score: toNumber(doc.user_rights_index?.overall_score),
      categories,
      category_index: categoryIndex,
    },
    section_index: ensureArray(doc.section_index),
    section_summaries: ensureArray(doc.section_summaries).map(normalizeSectionSummary),
    overall_summary: doc.overall_summary || null,
    glossary: normalizeGlossary(doc.glossary),
    additional_observations: ensureArray(doc.additional_observations).map((item) =>
      item === null || item === undefined ? null : item,
    ),
  };
}

function exportManualReviews() {
  if (!fs.existsSync(YAML_PATH)) {
    throw new Error('manual-reviews.yaml not found');
  }

  const raw = fs.readFileSync(YAML_PATH, 'utf8');
  const blocks = splitDocumentBlocks(raw);
  if (!blocks.length) {
    throw new Error('No document blocks found in manual-reviews.yaml');
  }

  const parsedDocs = [];
  const errors = [];

  blocks.forEach((block, index) => {
    const titleMatch = block.match(/document_title:\s*"?([^"\n]+)"?/);
    const fallbackTitle = titleMatch ? titleMatch[1] : `document_${index + 1}`;

    try {
      const parsed = parseDocumentBlock(block);
      parsedDocs.push(normalizeDocument(parsed));
    } catch (error) {
      errors.push(`Failed to parse ${fallbackTitle}: ${error.message}`);
    }
  });

  if (errors.length) {
    const message = errors.join('\n');
    throw new Error(message);
  }

  const payload = {
    generated_at: new Date().toISOString(),
    schema_version: SCHEMA_VERSION,
    document_count: parsedDocs.length,
    documents: parsedDocs,
  };

  ensureDirectoryExists(OUT_PATH);
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2), 'utf8');
  return parsedDocs.length;
}

function main() {
  try {
    const count = exportManualReviews();
    console.log(`Exported rights index JSON to ${OUT_PATH} (${count} documents).`);
  } catch (error) {
    console.error('Failed to export manual reviews:', error.message);
    process.exit(1);
  }
}

main();
