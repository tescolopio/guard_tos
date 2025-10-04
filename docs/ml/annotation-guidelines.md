# Annotation Guidelines (Draft)

Last updated: 2025-09-27

These guidelines codify how legal subject-matter experts (SMEs) annotate spans for the
Terms Guardian category models. Treat this document as the authoritative reference for
labeling decisions until superseded by a signed-off revision.

## General Principles

- **Span definition**: annotate self-contained clauses or paragraphs (50–600 words) that
  can be interpreted without external context. Include headings when they clarify scope.
- **Labeling scale**: assign binary labels (0/1) per category sub-label defined in
  `scripts/ml/train_category_model.py`. When unsure, leave the label at `0` and add a
  comment.
- **Multiple labels**: clauses may trigger more than one sub-label within the same
  category (e.g., a dispute clause that covers both mandatory arbitration and venue).
- **Evidence notes**: capture rationale, citations, and edge cases in the `notes` field to
  support adjudication and future QA audits.
- **Sensitive data**: redact personal data encountered in raw documents before saving to
  the shared repository. Document redactions in `notes`.

## Dispute Resolution

Current review queue: `data/gold/dispute_resolution/gold_eval.todo.jsonl`
generated on 2025-09-27 (see directory README for workflow).

| Label                 | Definition                                                                      | Positive Indicators                                              | Negative Indicators                                 |
| --------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| `binding_arbitration` | Clause mandates arbitration as the exclusive dispute forum.                     | "Binding arbitration", reference to AAA/JAMS rules, waiver text. | Mediation mentions without mandatory binding terms. |
| `class_action_waiver` | Clause waives the right to participate in class or collective actions.          | "Class action waiver", "no consolidated claims".                 | Class waiver limited to certain contexts.           |
| `jury_trial_waiver`   | Clause explicitly waives the right to a jury trial.                             | "Waive the right to a jury", "trial by judge only".              | Statements about bench trials without waiver text.  |
| `venue_selection`     | Clause specifies an exclusive venue/jurisdiction for disputes or governing law. | "Exclusive venue", "courts located in", chosen governing law.    | Non-exclusive venue or mere mailing address.        |

### Edge Cases

- **Arbitration carve-outs**: tag as `binding_arbitration` even when small-claims courts
  are carved out, as the primary dispute path remains arbitration.
- **Opt-out windows**: still annotate if arbitration is mandatory unless opt-out is
  frictionless and clearly highlighted. Note the opt-out specifics in `notes`.

### Required Metadata

Every annotation must include:

- `annotator_id`: SME identifier (email or UUID).
- `decision`: map of label → 0/1.
- `confidence`: float in `[0,1]` (1 = fully confident).
- `notes`: short free-form justification (minimum 15 characters when marking positive).

## Data Collection & Use (Placeholder)

Guidelines pending SME review. Draft bullets:

- Distinguish between explicit vs implied consent.
- Flag broad purpose language ("any purpose") vs narrow disclosures.
- Capture opt-in vs opt-out mechanics.

_This section will be expanded once the first batch of corpus samples is prepared._

## Change Log

| Date       | Author | Notes                            |
| ---------- | ------ | -------------------------------- |
| 2025-09-27 | TBD    | Initial draft committed to repo. |
