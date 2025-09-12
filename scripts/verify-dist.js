#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const dist = path.resolve(__dirname, "../dist");
const required = [
  "manifest.json",
  "content.js",
  "serviceWorker.js",
  "sidepanel.js",
  "sidepanel.html",
  "constants.js",
  "debugger.js",
  "styles.css",
  "images/icon16.png",
  "images/icon48.png",
  "images/icon128.png",
  "dictionaries/dict-a.json",
];

function exists(rel) {
  return fs.existsSync(path.join(dist, rel));
}

const missing = required.filter((f) => !exists(f));

if (missing.length) {
  console.error("Dist verification FAILED. Missing files:", missing);
  process.exit(2);
}

console.log("Dist verification PASSED. All required assets present.");
process.exit(0);
