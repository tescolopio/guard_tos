#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function fmt(n) {
  return typeof n === "number" ? n.toFixed(6) : String(n);
}

function main() {
  const repoRoot = path.resolve(__dirname, "..");
  let suggestionsPath = path.join(
    repoRoot,
    "data",
    "threshold_suggestions.json",
  );
  if (!fs.existsSync(suggestionsPath)) {
    const alt = path.join(repoRoot, "data", "calibration_suggestions.json");
    if (fs.existsSync(alt)) suggestionsPath = alt;
  }
  const constantsPath = path.join(repoRoot, "src", "utils", "constants.js");

  if (!fs.existsSync(suggestionsPath)) {
    console.error("No threshold suggestions found at", suggestionsPath);
    process.exit(2);
  }

  const suggestions = readJson(suggestionsPath);

  const constantsSrc = fs.readFileSync(constantsPath, "utf-8");
  const blockMatch = constantsSrc.match(
    /ML:\s*{[\s\S]*?THRESHOLDS:\s*{([\s\S]*?)}[\s\S]*?}/m,
  );
  if (!blockMatch) {
    console.error("Could not locate ML.THRESHOLDS in constants.js");
    process.exit(2);
  }

  // Extract simple key: value pairs inside thresholds
  const thresholdsText = blockMatch[1];
  const current = {};
  for (const line of thresholdsText.split("\n")) {
    const m = line.match(/([A-Z_]+):\s*([0-9]*\.?[0-9]+)\s*,?/);
    if (m) {
      current[m[1]] = parseFloat(m[2]);
    }
  }

  const classes = Object.keys(suggestions);
  console.log(
    "Class".padEnd(24),
    "Current".padEnd(14),
    "Suggested".padEnd(14),
    "Delta",
  );
  console.log("-".repeat(64));
  for (const c of classes) {
    const sug = suggestions[c]?.suggested;
    const cur = current[c];
    if (typeof sug !== "number" || typeof cur !== "number") continue;
    const delta = sug - cur;
    const sign = delta > 0 ? "+" : "";
    console.log(
      c.padEnd(24),
      fmt(cur).padEnd(14),
      fmt(sug).padEnd(14),
      `${sign}${fmt(delta)}`,
    );
  }

  console.log(
    '\nNote: Run "npm run ml:calibrate" to refresh data/threshold_suggestions.json before evaluating.',
  );
}

main();
