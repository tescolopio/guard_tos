// Quick smoke test to ensure the model JSON is present and thresholds exist
const fs = require("fs");
const path = require("path");

const MODEL_PATH = path.resolve(
  __dirname,
  "..",
  "src",
  "data",
  "dictionaries",
  "tfidf_logreg_v2.json",
);
const CONSTANTS_JS = path.resolve(
  __dirname,
  "..",
  "src",
  "utils",
  "constants.js",
);

function has(str, snippet) {
  return str.indexOf(snippet) !== -1;
}

function main() {
  if (!fs.existsSync(MODEL_PATH)) {
    console.error("Missing model JSON at", MODEL_PATH);
    process.exit(1);
  }
  const model = JSON.parse(fs.readFileSync(MODEL_PATH, "utf8"));
  const required = ["vocab", "idf", "classes"];
  for (const k of required) {
    if (!(k in model)) {
      console.error("Model missing key:", k);
      process.exit(1);
    }
  }
  const src = fs.readFileSync(CONSTANTS_JS, "utf8");
  const keys = [
    "ARBITRATION",
    "CLASS_ACTION_WAIVER",
    "LIABILITY_LIMITATION",
    "UNILATERAL_CHANGES",
  ];
  for (const k of keys) {
    if (!has(src, `${k}:`)) {
      console.error("Threshold missing in constants for", k);
      process.exit(1);
    }
  }
  console.log("Smoke OK: model and thresholds present");
}

main();
