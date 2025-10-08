#!/usr/bin/env python3
"""Training log template generator.

Creates a structured log file for tracking training experiments
and findings for each category.
"""

import argparse
from pathlib import Path
from datetime import datetime


TEMPLATE = """# {category_name} - Training Log

**Category**: {category_name}  
**Dataset**: {dataset_path}  
**Started**: {date}  
**Status**: 🔄 In Progress

---

## Dataset Overview

- **Records**: {num_records}
- **Gold Seeds**: {num_seeds}
- **Labels**: {num_labels}
- **Balance**: {balance_status}

---

## Training Iterations

### Baseline (v1) - {date}

**Hyperparameters**:
```
base_model: distilbert-base-uncased
epochs: 5
batch_size: 16
learning_rate: 5e-5
weight_decay: 0.01
eval_split: 0.15
```

**Results**:
- Macro F1: ___ (target: >0.75)
- Train F1: ___
- Eval F1: ___
- Training time: ___ minutes

**Per-Label Performance**:
| Label | Precision | Recall | F1 | Support |
|-------|-----------|--------|-----|---------|
| ___ | ___ | ___ | ___ | ___ |

**Issues Identified**:
- [ ] Issue 1: ___
- [ ] Issue 2: ___

**Decision**: ___

---

### Iteration 2 (v2) - Date

**Changes from v1**:
- Change 1: ___
- Change 2: ___

**Results**:
- Macro F1: ___
- Train F1: ___
- Eval F1: ___

**Per-Label Performance**:
| Label | Precision | Recall | F1 | Support |
|-------|-----------|--------|-----|---------|
| ___ | ___ | ___ | ___ | ___ |

**Issues Identified**:
- [ ] Issue 1: ___

**Decision**: ___

---

### Iteration 3 (v3) - Date

_(Add more iterations as needed)_

---

## Final Model

**Version**: v___  
**Status**: ✅ Production Ready / ⚠️ Needs Improvement / ❌ Failed

**Final Metrics**:
- Macro F1: ___
- All labels F1 >0.70: ☐ Yes ☐ No
- Passes manual validation: ☐ Yes ☐ No
- Model size: ___ MB

**Model Location**: `artifacts/models/{category}/{version}/`

---

## Key Learnings

### What Worked:
1. ___
2. ___
3. ___

### What Didn't Work:
1. ___
2. ___

### Surprises:
1. ___
2. ___

---

## Recommendations for Next Category

**Hyperparameters to use**:
```
epochs: ___
learning_rate: ___
weight_decay: ___
batch_size: ___
```

**Things to watch for**:
1. ___
2. ___

**Changes to make**:
1. ___
2. ___

---

## Manual Test Results

### Test Sample 1
**Text**: ___  
**Expected**: ___  
**Predicted**: ___  
**Result**: ✅ / ❌

### Test Sample 2
**Text**: ___  
**Expected**: ___  
**Predicted**: ___  
**Result**: ✅ / ❌

_(Add more test samples as needed)_

---

## Next Steps

- [ ] Action item 1
- [ ] Action item 2
- [ ] Action item 3

---

**Last Updated**: {date}  
**Completed**: ☐ Yes ☐ No
"""


def create_training_log(category: str, dataset_path: str, output_dir: Path):
    """Create a training log file from template."""
    
    # Get current date
    date = datetime.now().strftime("%Y-%m-%d")
    
    # Format category name
    category_name = category.replace("_", " ").title()
    
    # Fill in template (placeholder values)
    content = TEMPLATE.format(
        category_name=category_name,
        category=category,
        dataset_path=dataset_path,
        date=date,
        num_records="___",
        num_seeds="___",
        num_labels="___",
        balance_status="___",
        version="___"
    )
    
    # Create output file
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / f"{category}_training_log.md"
    
    with output_file.open("w") as f:
        f.write(content)
    
    print(f"✅ Created training log: {output_file}")
    print()
    print("Next steps:")
    print(f"1. Review dataset: python scripts/ml/inspect_dataset.py --dataset {dataset_path}")
    print(f"2. Start training: python scripts/ml/train_category_model.py --category {category} ...")
    print(f"3. Fill in results in: {output_file}")
    
    return output_file


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--category", required=True, help="Category name (e.g., data_collection)")
    parser.add_argument("--dataset", required=True, help="Path to dataset file")
    parser.add_argument("--output-dir", default="docs/training_logs", help="Output directory for log")
    
    args = parser.parse_args()
    
    output_dir = Path(args.output_dir)
    create_training_log(args.category, args.dataset, output_dir)
    
    return 0


if __name__ == "__main__":
    exit(main())
