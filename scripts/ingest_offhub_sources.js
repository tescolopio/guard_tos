#!/usr/bin/env node
/*
Optionally ingest known off-Hub sources if raw files exist.
This script is a convenience wrapper around scripts/ingest_offhub.py.
It checks for typical raw paths and runs normalization using data/offhub/mapping.yml.
*/
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const mapping = path.join(root, "data", "offhub", "mapping.yml");
const pyCandidates = [
  path.join(root, ".venv", "bin", "python"),
  path.join(root, ".venv", "Scripts", "python.exe"),
  "/mnt/d/guard_tos/.venv/bin/python",
  process.env.PYTHON || "",
  "python3",
  "python",
].filter(Boolean);

function pickPython() {
  for (const p of pyCandidates) {
    try {
      if (p === "python3" || p === "python" || fs.existsSync(p)) return p;
    } catch (_) {}
  }
  return "python3";
}

function runIngest({ source, input, csv, textField, labelField, out }) {
  if (!fs.existsSync(input)) return false;
  const args = [
    path.join(root, "scripts", "ingest_offhub.py"),
    "--source",
    source,
    "--input",
    input,
    "--text-field",
    textField,
    "--label-field",
    labelField,
    "--map-file",
    mapping,
    "--out",
    out,
  ];
  if (csv) args.splice(3, 0, "--csv");
  const python = pickPython();
  console.log(
    `Normalizing ${source} from ${path.relative(root, input)} -> ${path.relative(root, out)}`,
  );
  const res = spawnSync(python, args, { stdio: "inherit" });
  return res.status === 0;
}

const tasks = [
  {
    source: "claudette",
    input: path.join(root, "data", "offhub", "raw", "claudette", "clauses.csv"),
    csv: true,
    textField: "clause",
    labelField: "label",
    out: path.join(root, "data", "offhub", "normalized", "claudette.jsonl"),
  },
  {
    source: "opp115",
    input: path.join(root, "data", "offhub", "raw", "opp115", "policies.jsonl"),
    csv: false,
    textField: "policy_text",
    labelField: "category",
    out: path.join(root, "data", "offhub", "normalized", "opp115.jsonl"),
  },
  {
    source: "tosdr",
    input: path.join(root, "data", "offhub", "raw", "tosdr", "points.jsonl"),
    csv: false,
    textField: "text",
    labelField: "label",
    out: path.join(root, "data", "offhub", "normalized", "tosdr.jsonl"),
  },
];

let any = false;
for (const t of tasks) {
  try {
    any = runIngest(t) || any;
  } catch (e) {
    console.warn(`WARN: failed to ingest ${t.source}: ${e.message}`);
  }
}

if (!any) {
  console.log(
    "No known off-Hub raw files found. Place raw files under data/offhub/raw/... and re-run.",
  );
}
