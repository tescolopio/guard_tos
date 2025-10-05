#!/usr/bin/env node
/**
 * Run the Terms Guardian analysis pipeline across a directory of mock pages.
 * Usage: node scripts/analyze_mock_pages.js [directory] [--json] [--limit=N]
 */

const fs = require("fs");
const path = require("path");
const { run } = require("./run_analysis_fixture");

const DEFAULT_ROOT = path.resolve(__dirname, "../test-pages");
const SUPPORTED_EXTENSIONS = new Set([".html", ".htm", ".txt"]);

function parseArgs(argv) {
  const options = {
    dir: DEFAULT_ROOT,
    json: false,
    limit: Infinity,
  };

  argv.forEach((arg) => {
    if (arg.startsWith("--")) {
      if (arg === "--json") {
        options.json = true;
      } else if (arg.startsWith("--limit=")) {
        const value = Number.parseInt(arg.split("=")[1], 10);
        if (!Number.isNaN(value) && value > 0) {
          options.limit = value;
        }
      }
    } else if (!options.dir || options.dir === DEFAULT_ROOT) {
      options.dir = path.resolve(arg);
    }
  });

  return options;
}

function collectFiles(root) {
  const files = [];

  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.toLowerCase().endsWith("_files")) {
          continue; // skip asset folders produced by browser save-as
        }
        walk(fullPath);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(root);
  return files.sort();
}

function formatNumber(value) {
  return value.toLocaleString("en-US");
}

async function analyzeMockPages({ dir = DEFAULT_ROOT, json = false, limit = Infinity } = {}) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Directory not found: ${dir}`);
  }

  const targets = collectFiles(dir);
  if (targets.length === 0) {
    return {
      analyzed: 0,
      skipped: 0,
      results: [],
      errors: [],
      stats: {},
    };
  }

  const selected = targets.slice(0, limit);
  const results = [];
  const errors = [];

  for (const file of selected) {
    try {
      const report = await run(file);
      results.push({ file, report });
      if (!json) {
        const rel = path.relative(process.cwd(), file);
        console.log(`\n${rel}`);
        console.log("-".repeat(rel.length));
        const words = (report.metadata && report.metadata.words) || 0;
        const readabilityGrade =
          (report.readability && report.readability.grade) || "N/A";
        const rightsGrade = (report.rights && report.rights.grade) || "N/A";
        const uriGrade =
          (report.userRightsIndex && report.userRightsIndex.grade) || "N/A";
        console.log(
          `Words: ${formatNumber(words)} | Readability: ${readabilityGrade} | Rights: ${rightsGrade} | URI: ${uriGrade}`,
        );
        if (report.riskLevel) {
          console.log(`Risk Level: ${report.riskLevel}`);
        }
        if (Array.isArray(report.keyFindings) && report.keyFindings.length) {
          console.log(
            `Key Findings: ${report.keyFindings
              .map((item) => item.title || item.heading || JSON.stringify(item))
              .slice(0, 3)
              .join("; ")}`,
          );
        }
      }
    } catch (error) {
      errors.push({ file, error });
      if (!json) {
        console.error(`Failed to analyze ${file}:`, error.message);
      }
    }
  }

  const stats = new Map();
  for (const { report } of results) {
    const grade =
      (report.userRightsIndex && report.userRightsIndex.grade) || "Unknown";
    stats.set(grade, (stats.get(grade) || 0) + 1);
  }

  return {
    analyzed: results.length,
    skipped: errors.length,
    results,
    errors,
    stats: Object.fromEntries(stats),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  try {
    const summary = await analyzeMockPages(options);
    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log("\nSummary");
      console.log("======");
      console.log(`Analyzed: ${summary.analyzed}`);
      if (summary.skipped) {
        console.log(`Skipped: ${summary.skipped}`);
      }
      if (Object.keys(summary.stats).length > 0) {
        Object.entries(summary.stats).forEach(([grade, count]) => {
          console.log(`  URI ${grade}: ${count}`);
        });
      }
    }
  } catch (error) {
    console.error("Mock page analysis failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzeMockPages,
  collectMockPageFiles: collectFiles,
  DEFAULT_ROOT,
};
