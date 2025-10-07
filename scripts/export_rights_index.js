#!/usr/bin/env node
/**
 * export_rights_index.js
 * Parse manual-reviews.yaml and export a normalized JSON for all documents.
 */
const fs = require('fs');
const path = require('path');

const YAML_PATH = path.resolve('docs/manual-analysis/reports/manual-reviews.yaml');
const OUT_PATH = path.resolve('data/derived/manual_reviews.json');

function parseYaml(raw) {
  // More tolerant splitter: allow optional leading spaces before - document_title:
  // We scan line by line and accumulate blocks.
  const lines = raw.split(/\n/);
  const docs = [];
  let current = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*- document_title:/.test(line)) {
      if (current.length) {
        docs.push(current.join('\n'));
        current = [];
      }
    }
    current.push(line);
  }
  if (current.length) docs.push(current.join('\n'));
  return docs;
}

function extractValue(line) {
  const idx = line.indexOf(':');
  if (idx === -1) return null;
  return line.slice(idx + 1).trim().replace(/^"|"$/g, '');
}

function parseDoc(chunk) {
  const lines = chunk.split(/\n/);
  const doc = { metadata: {}, user_rights_index: { categories: [] } };
  let section = 'root';
  let cat = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^- document_title:/.test(l)) {
      doc.document_title = extractValue(l.replace(/^- /, ''));
      continue;
    }
    if (/^  source_path:/.test(l)) doc.source_path = extractValue(l);
    if (/^  collection_date:/.test(l)) doc.collection_date = extractValue(l);
    if (/^  review_date:/.test(l)) doc.review_date = extractValue(l);
    if (/^  metadata:/.test(l)) { section = 'metadata'; continue; }
    if (/^  readability:/.test(l)) { section = 'readability'; continue; }
    if (/^  user_rights_index:/.test(l)) { section = 'rights'; continue; }
    if (/^  overall_summary:/.test(l)) { section = 'summary'; continue; }

    // Metadata key
    if (section === 'metadata' && /^ {4}[a-zA-Z0-9_]+:/.test(l)) {
      const key = l.split(':')[0].trim();
      const val = extractValue(l);
      doc.metadata[key] = val;
    }
    // Overall score
    if (section === 'rights' && /overall_score:/.test(l)) {
      const num = parseInt(l.split(':')[1]);
      if (!isNaN(num)) doc.user_rights_index.overall_score = num;
    }
    // Category start
    if (/^ {6}- name:/.test(l)) {
      if (cat) doc.user_rights_index.categories.push(cat);
      cat = { name: extractValue(l.trim()) };
    } else if (cat && /^ {8}score:/.test(l)) {
      const num = parseInt(l.split(':')[1]);
      cat.score = num;
    } else if (cat && /^ {8}grade:/.test(l)) {
      cat.grade = extractValue(l);
    } else if (cat && /^ {8}key_evidence:/.test(l)) {
      cat.key_evidence = l.split(':').slice(1).join(':').trim().replace(/^"|"$/g, '');
    }
  }
  if (cat) doc.user_rights_index.categories.push(cat);
  return doc;
}

function main() {
  if (!fs.existsSync(YAML_PATH)) {
    console.error('manual-reviews.yaml not found');
    process.exit(1);
  }
  const raw = fs.readFileSync(YAML_PATH, 'utf8');
  const chunks = parseYaml(raw);
  const docs = chunks.map(parseDoc).filter(d => d.document_title);
  if (!fs.existsSync(path.dirname(OUT_PATH))) fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify({ generated_at: new Date().toISOString(), documents: docs }, null, 2), 'utf8');
  console.log('Exported rights index JSON to', OUT_PATH, 'Documents:', docs.length);
}

main();
