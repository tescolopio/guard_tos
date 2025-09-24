#!/usr/bin/env node
/*
Prepare datasets including any normalized off-Hub JSONL files automatically.
Looks for files under data/offhub/normalized/*.jsonl and passes them via --augment to prepare_datasets.py
*/
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = process.cwd();
const normalizedDir = path.join(root, "data", "offhub", "normalized");

function venvPythonPaths(rootDir) {
  return [
    // WSL/Linux style
    path.join(rootDir, ".venv", "bin", "python"),
    // Windows style
    path.join(rootDir, ".venv", "Scripts", "python.exe"),
    // Legacy hard-coded WSL path for convenience
    "/mnt/d/guard_tos/.venv/bin/python",
  ];
}

function basePythonCandidates() {
  return [process.env.PYTHON || "", "python3", "python"].filter(Boolean);
}

function canImportPandas(pythonExe) {
  try {
    const r = spawnSync(pythonExe, ["-c", "import pandas"], {
      stdio: "ignore",
    });
    return r.status === 0;
  } catch (_) {
    return false;
  }
}

function fileExists(p) {
  try {
    return fs.existsSync(p);
  } catch (_) {
    return false;
  }
}

function pickPython(rootDir) {
  // Prefer project venv with pandas
  for (const vp of venvPythonPaths(rootDir)) {
    if (fileExists(vp) && canImportPandas(vp)) return vp;
  }
  // Any candidate that can import pandas
  for (const bp of basePythonCandidates()) {
    if (
      (bp === "python3" || bp === "python" || fileExists(bp)) &&
      canImportPandas(bp)
    )
      return bp;
  }
  return ""; // None found with pandas
}

function createVenv(rootDir) {
  const base = basePythonCandidates().find(
    (p) => p === "python3" || p === "python" || fileExists(p),
  );
  if (!base) return "";
  console.log(
    "No Python with pandas found; creating project venv (.venv) and installing requirements...",
  );
  const venvDir = path.join(rootDir, ".venv");
  const r1 = spawnSync(base, ["-m", "venv", venvDir], { stdio: "inherit" });
  if (r1.status !== 0) {
    console.error("Failed to create virtual environment");
    return "";
  }
  const vpy = venvPythonPaths(rootDir).find((p) => fileExists(p)) || "";
  if (!vpy) {
    console.error(
      "Virtual environment created but python executable not found",
    );
    return "";
  }
  const reqPath = path.join(rootDir, "scripts", "requirements.txt");
  if (fileExists(reqPath)) {
    const r2 = spawnSync(vpy, ["-m", "pip", "install", "-r", reqPath], {
      stdio: "inherit",
    });
    if (r2.status !== 0) {
      console.error("Failed to install requirements into .venv");
      return "";
    }
  } else {
    console.warn(
      "WARN: scripts/requirements.txt not found; proceeding without installing dependencies.",
    );
  }
  return vpy;
}

let augmentFiles = [];
try {
  if (fs.existsSync(normalizedDir)) {
    augmentFiles = fs
      .readdirSync(normalizedDir)
      .filter((f) => f.endsWith(".jsonl"))
      .map((f) => path.join(normalizedDir, f));
  }
} catch (e) {
  console.warn(`WARN: failed to read ${normalizedDir}: ${e.message}`);
}

let python = pickPython(root);
if (!python) {
  // Attempt to create a venv and install requirements
  python = createVenv(root);
}
if (!python) {
  console.error(
    "Could not find or set up a Python interpreter with required packages (e.g., pandas).\n" +
      "Please install dependencies with: pip install -r scripts/requirements.txt,\n" +
      "or set the PYTHON env var to your venv Python executable, then re-run.",
  );
  process.exit(1);
}
const script = path.join(root, "scripts", "prepare_datasets.py");
const outPath = path.join("data", "clauses.jsonl");
const args = [script, "--output", outPath];

if (augmentFiles.length) {
  args.push("--augment", ...augmentFiles);
  console.log(
    `Including ${augmentFiles.length} off-Hub file(s):\n- ${augmentFiles
      .map((f) => path.relative(root, f))
      .join("\n- ")}`,
  );
} else {
  console.log("No off-Hub normalized files found; running base prepare...");
}

const res = spawnSync(python, args, { stdio: "inherit" });
if (res.status !== 0) {
  console.error(`prepare_with_offhub failed with code ${res.status}`);
  process.exit(res.status || 1);
}
