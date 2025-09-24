# Model Card (Browser ML — optional)

Status: For MVP, no ML model artifacts are bundled. The pipeline uses rule-based scoring with optional heuristics. This card documents planned ML augmentation for transparency.

## Intended use

- Assist clause detection (e.g., arbitration, class actions, liability limitations) to improve precision/recall in edge cases.

## Data

- Source: Public Terms of Service and policy documents.
- Labeling: Heuristic + manual review, class definitions align with RIGHTS weights.
- Licensing: Only documents with permissible licenses or fair-use excerpts.

## Model and thresholds

- Baseline: TF-IDF + Logistic Regression (browser-portable)
- Thresholds: See `EXT_CONSTANTS.ML.THRESHOLDS` in `src/utils/constants.js`
- Fusion: Rule/ML fusion with `FUSE_ALPHA` to balance signals

## Limitations

- Domain shift across industries may affect accuracy
- Short snippets yield lower confidence
- Not legal advice; scores are educational signals only

## Safety

- On-device inference to protect privacy
- No network calls for ML in MVP

## Maintenance

- Calibration scripts documented in `docs/analysis/model-calibration.md`
- Versioning via `MODEL_VERSION` in constants
