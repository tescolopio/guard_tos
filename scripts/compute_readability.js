#!/usr/bin/env node
/**
 * Simple readability metrics script.
 * Usage: node scripts/compute_readability.js <markdown_path>
 * Outputs JSON with metrics.
 */
const fs = require('fs');
const path = require('path');

function stripMarkdown(md) {
  return md
    // Remove code fences
    .replace(/```[\s\S]*?```/g, ' ')
    // Remove inline code
    .replace(/`[^`]*`/g, ' ')
    // Remove images/links markup (keep link text)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // Remove headings markers
    .replace(/^#+\s*/gm, '')
    // Remove bold/italic markers
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    // Remove HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Remove tables pipes
    .replace(/\|/g, ' ')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  // Very naive syllable heuristic
  const vowels = 'aeiouy';
  let count = 0;
  let prevVowel = false;
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }
  // Silent trailing 'e'
  if (word.endsWith('e') && count > 1) count--;
  return count || 1; // at least 1 syllable
}

function computeMetrics(text) {
  // Split sentences (rough heuristic)
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => /[A-Za-z]/.test(w));
  const syllables = words.reduce((acc, w) => acc + countSyllables(w), 0);
  const sentCount = sentences.length || 1;
  const wordCount = words.length || 1;
  const syllablesPerWord = syllables / wordCount;
  const wordsPerSentence = wordCount / sentCount;
  const fleschReadingEase = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  const fleschKincaidGrade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
  return {
    sentences: sentCount,
    words: wordCount,
    syllables,
    wordsPerSentence: parseFloat(wordsPerSentence.toFixed(2)),
    syllablesPerWord: parseFloat(syllablesPerWord.toFixed(2)),
    fleschReadingEase: parseFloat(fleschReadingEase.toFixed(2)),
    fleschKincaidGrade: parseFloat(fleschKincaidGrade.toFixed(2))
  };
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/compute_readability.js <markdown_path>');
    process.exit(1);
  }
  const raw = fs.readFileSync(path.resolve(file), 'utf8');
  // Extract only from first "# Terms of Use" to end of Signing section to reduce nav/banner noise
  const anchor = raw.indexOf('# Terms of Use');
  let slice = anchor >= 0 ? raw.slice(anchor) : raw;
  // Remove footer after 'Signing in to SAM.gov'
  const endIdx = slice.indexOf('## Signing in to SAM.gov');
  if (endIdx >= 0) {
    // Include the heading and following paragraph
    const footerCut = slice.indexOf('\n## ', endIdx + 5);
    if (footerCut > 0) slice = slice.slice(0, footerCut);
  }
  const cleaned = stripMarkdown(slice);
  const metrics = computeMetrics(cleaned);
  console.log(JSON.stringify({ file, metrics }, null, 2));
}

main();
