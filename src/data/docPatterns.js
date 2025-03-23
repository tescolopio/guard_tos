// Document Patterns
const DOC_PATTERNS = {
  SECTION_NUMBERING: /^\s*(?:\d+\.|\([a-z]\)|\([0-9]\)|\d+\.\d+)/m,
  CITATIONS: /(?:\d+\s+U\.S\.C\.|§+\s*\d+|\bCFR\b|\bFR\b)/i,
  LISTS: /^\s*(?:[A-Z]\.|\d+\.|\u2022|\-)\s+/m,
};

// Export the legal patterns
if (typeof window !== "undefined") {
  window.DOC_PATTERNS = DOC_PATTERNS;
}

// Export for Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = { DOC_PATTERNS };
}
