#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const SRC_DIR = path.resolve(
  __dirname,
  "../test-pages/all-mocks/test-pages/Website Terms of Service",
);
const OUT_DIR = path.resolve(
  __dirname,
  "../test-pages/all-mocks/test-pages/curated-tos",
);

// Patterns for inclusion/exclusion based on filenames
const includePatterns = [
  /terms\s*of\s*service/i,
  /terms\s*of\s*use/i,
  /conditions\s*of\s*use/i,
  /user\s*agreement/i,
  /general\s*terms/i,
  /legal\s*terms/i,
  /terms\s*&\s*conditions/i,
  /google_terms_of_service/i,
  /terms-?of-?service/i,
];

const excludePatterns = [
  /privacy/i,
  /acceptable\s*use/i,
  /content\s*policy/i,
  /cookie\s*policy/i,
  /platform\s*policies/i,
  /spaces\s*policies/i,
  /community\s*guidelines/i,
  /about\s*me/i,
  /candidate\s*privacy/i,
  /security\s*and\s*compliance/i,
];

function shouldInclude(file) {
  const name = file.toLowerCase();
  // Exclude directories
  if (file.endsWith("/")) return false;
  // Explicitly exclude known non-ToS categories
  if (excludePatterns.some((re) => re.test(name))) return false;
  // Include PDFs/HTML/TXT that match ToS patterns
  if (includePatterns.some((re) => re.test(name))) return true;
  return false;
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error("Source folder not found:", SRC_DIR);
    process.exit(2);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const entries = fs.readdirSync(SRC_DIR);
  const included = [];
  const excluded = [];

  for (const entry of entries) {
    const srcPath = path.join(SRC_DIR, entry);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      excluded.push({ file: entry, reason: "directory" });
      continue;
    }
    if (shouldInclude(entry)) {
      const destPath = path.join(OUT_DIR, entry);
      fs.copyFileSync(srcPath, destPath);
      included.push({ file: entry, reason: "matched include patterns" });
    } else {
      excluded.push({
        file: entry,
        reason: "did not match include or matched exclude patterns",
      });
    }
  }

  const manifest = {
    source: SRC_DIR,
    output: OUT_DIR,
    timestamp: new Date().toISOString(),
    counts: { included: included.length, excluded: excluded.length },
    included,
    excluded,
  };
  fs.writeFileSync(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log(`Curated ${included.length} files -> ${OUT_DIR}`);
}

main();
