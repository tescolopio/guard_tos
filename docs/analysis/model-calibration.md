# Model Calibration Report

Model: src/data/dictionaries/tfidf_logreg_v2.json
Data: data/clauses.jsonl

| Class | AP | F1-max | t_F1 | t_P90 (P,R) | t_P80 (P,R) | Suggested |
|---|---:|---:|---:|---:|---:|---:|
| ARBITRATION | 1.000 | 0.994 | 0.39 | 0.22 (0.90,1.00) | 0.14 (0.80,1.00) | 0.22 |
| CLASS_ACTION_WAIVER | 0.971 | 0.973 | 0.02 | 0.02 (0.90,0.95) | 0.02 (0.82,0.95) | 0.02 |
| LIABILITY_LIMITATION | 0.999 | 0.992 | 0.53 | 0.47 (0.90,1.00) | 0.43 (0.80,1.00) | 0.47 |
| UNILATERAL_CHANGES | 0.992 | 0.971 | 0.07 | 0.06 (0.91,0.96) | 0.05 (0.81,1.00) | 0.06 |
