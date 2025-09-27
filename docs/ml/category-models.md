# Category Model Implementation Playbook

Last updated: 2025-09-26

This guide explains how to train, calibrate, and ship the per-category classifiers that power the Terms Guardian User Rights Index (URI).

## 🎯 Goals

- Deliver a dedicated model per URI category with calibrated confidence scores.
- Keep artifacts browser-friendly (<10 MB compressed, TF.js ready) without sacrificing accuracy.
- Document a repeatable process so model updates can be audited and reproduced.

## 🧬 Model Architecture

| Category               | Baseline Architecture            | Output Labels                                                                                                |
| ---------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Data Collection & Use  | DistilBERT (classification head) | Extensive collection, Minimal collection, Explicit consent, Implied consent, Purpose broad, Purpose specific |
| User Privacy           | DistilBERT                       | Retention disclosed, Deletion offered, Access rights, Privacy waiver                                         |
| Content Rights         | DistilBERT                       | License assignment, IP retained, Moral rights waiver, Commercial use                                         |
| Account Management     | DistilBERT                       | Easy termination, Auto-renewal friction, Manual cancellation, Grace period                                   |
| Dispute Resolution     | DistilBERT                       | Binding arbitration, Class action waiver, Jury trial waiver, Venue selection                                 |
| Terms Changes          | DistilBERT                       | Advance notice, Unilateral change, Opt-out provided                                                          |
| Algorithmic Decisions  | DistilBERT                       | Automated decision, Human review, Transparency statement                                                     |
| Clarity & Transparency | DistilBERT                       | Plain language, Ambiguous language, Legalese density                                                         |

> DistilBERT was chosen for its balance of accuracy and size. Alternate backbones (MiniLM, LegalBERT distilled) can be explored if they meet the size budget.

## 🛠️ Training Workflow

1. Export processed datasets from the training data pipeline (see `docs/ml/training-data-pipeline.md`).
2. Run the trainer script:

   ```bash
   python scripts/ml/train_category_model.py \
     --category data_collection \
     --dataset data/processed/data_collection/v2025.09.30.jsonl \
     --output-dir artifacts/models/data_collection/v2025.09.30
   ```

3. Inspect `metrics.json` and the console output for precision/recall/F1.
4. Run `scripts/ml/calibrate_category_model.py` against the gold dataset to derive per-label thresholds and copy `suggested` values into `src/utils/constants.js` (behind a feature flag until rollout).
5. Export artifacts with `scripts/ml/export_category_model.py` to produce ONNX (and optionally TF.js) bundles for the browser loader.

## 📏 Evaluation Criteria

- **Precision ≥ 0.80** and **Recall ≥ 0.70** per category on the gold evaluation set.
- **Latency** (browser inference) ≤ 300 ms per 500-word chunk on target hardware.
- **Calibration**: Brier score < 0.2; thresholds saved in `constants.js`.
- **Explainability**: Store top tokens/attention scores for debugging (optional but encouraged).

## 📦 Artifact Packaging

Each trained model directory must contain:

- `pytorch_model.bin` (or framework-equivalent weights)
- `config.json` and `tokenizer.json`
- `metrics.json` (detailed report from scikit-learn)
- `category_config.json` (auto-generated metadata)
- `thresholds.json` (post-calibration decision thresholds)
- `README.md` (model card summarizing training data, metrics, ethical considerations)

Compression target: `<category>-model-vX.Y.Z.tar.gz` ≤ 10 MB.

## 🔄 Promotion Checklist

- [ ] Dataset manifest exists and passes QC gates.
- [ ] Training notebook/script committed with exact hyperparameters.
- [ ] Metrics meet acceptance criteria.
- [ ] Thresholds calibrated, copied into `src/utils/constants.js` (behind feature flag until rollout).
- [ ] Model card reviewed by legal + product stakeholders.
- [ ] Browser integration smoke test passes (feature flag enabled).

## 🧪 Future Enhancements

- Distill models to 4-bit quantized TF.js format for faster inference.
- Explore knowledge distillation from larger legal-specific backbones (e.g., LegalBERT) to maintain vocabulary coverage.
- Add contrastive pretraining on unlabeled policy corpora for better domain adaptation.
- Integrate SHAP or attention heatmaps in the sidepanel for transparency.

Refer to the end-to-end roadmap in `docs/roadmap-and-todos.md` and the implementation plan in `docs/ml-enhancement-plan.md` for broader milestones.
