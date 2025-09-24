// Update EXT_CONSTANTS.ML.THRESHOLDS from data/threshold_suggestions.json
// Usage: node scripts/sync_thresholds.js

const fs = require("fs");
const path = require("path");

const THRESH_JSON = path.resolve(
  __dirname,
  "..",
  "data",
  "threshold_suggestions.json",
);
const CONSTANTS_JS = path.resolve(
  __dirname,
  "..",
  "src",
  "utils",
  "constants.js",
);

function formatNum(n) {
  return Number(n).toPrecision(17);
}

function main() {
  if (!fs.existsSync(THRESH_JSON)) {
    console.error(`Missing ${THRESH_JSON}. Run calibration first.`);
    process.exit(1);
  }
  let constants = fs.readFileSync(CONSTANTS_JS, "utf8");
  const thr = JSON.parse(fs.readFileSync(THRESH_JSON, "utf8"));

  function pick(obj, a, b, fallback) {
    if (obj && typeof obj[a] !== "undefined" && obj[a] !== null) return obj[a];
    if (obj && typeof obj[b] !== "undefined" && obj[b] !== null) return obj[b];
    return fallback;
  }
  const entries = {
    ARBITRATION: formatNum(pick(thr.ARBITRATION, "suggested", "t_f1", 0.5)),
    CLASS_ACTION_WAIVER: formatNum(
      pick(thr.CLASS_ACTION_WAIVER, "suggested", "t_f1", 0.5),
    ),
    LIABILITY_LIMITATION: formatNum(
      pick(thr.LIABILITY_LIMITATION, "suggested", "t_f1", 0.5),
    ),
    UNILATERAL_CHANGES: formatNum(
      pick(thr.UNILATERAL_CHANGES, "suggested", "t_f1", 0.5),
    ),
  };

  // Replace the thresholds block content conservatively by regex on known keys
  for (const [key, val] of Object.entries(entries)) {
    const re = new RegExp(`(${key}:\\s*)([^,]+)`, "g");
    const before = constants;
    constants = constants.replace(re, `$1${val}`);
    if (before === constants) {
      console.warn(
        `Warning: did not find existing threshold for ${key} to replace.`,
      );
    }
  }

  fs.writeFileSync(CONSTANTS_JS, constants);
  console.log("Updated thresholds in src/utils/constants.js");
}

main();
