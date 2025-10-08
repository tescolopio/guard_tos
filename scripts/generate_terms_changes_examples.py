#!/usr/bin/env python3
"""Generate synthetic examples for terms_changes labels.

Creates realistic synthetic examples for terms_changes category labels,
covering advance notice, unilateral changes, and opt-out provisions.

Example:
    python scripts/generate_terms_changes_examples.py \
        --output data/aug/terms_changes.jsonl \
        --per-label 30
"""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path
from typing import List


def parse_args() -> argparse.Namespace:
    """Parses command-line arguments."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        required=True,
        help="Path to output JSONL file"
    )
    parser.add_argument(
        "--per-label",
        type=int,
        default=30,
        help="Number of examples to generate per label"
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducibility"
    )
    return parser.parse_args()


# Templates for advance_notice
ADVANCE_NOTICE_TEMPLATES = [
    "We will {notify_verb} you at least {timeframe} before any {change_type} to these {document}.",
    "{notify_verb_cap} of {change_type_plural} will be provided {timeframe} in advance.",
    "We shall provide {notice_type} {timeframe} prior to {change_type_plural} taking effect.",
    "You will receive {notice_type} at least {timeframe} before we {change_verb} these {document}.",
    "We commit to {timeframe} advance notice for any {change_type_plural} to our {document}.",
    "{document_cap} {change_type_plural} will be announced {timeframe} before becoming effective.",
    "Reasonable advance notice of at least {timeframe} will be given for {change_type_plural}.",
]

# Templates for unilateral_change
UNILATERAL_CHANGE_TEMPLATES = [
    "We reserve the right to {change_verb} these {document} at any time {discretion}.",
    "We may {change_verb} or {change_verb2} these {document} {discretion} without {requirement}.",
    "The {company} retains the right to {change_verb} these {document} from time to time.",
    "We have the right to make {change_type_plural} to these {document} {discretion}.",
    "These {document} may be {change_verb}d {discretion} at any time.",
    "We can {change_verb} these {document} without {requirement}.",
    "The {company} may {unilateral_adv} {change_verb} these {document}.",
]

# Templates for opt_out_provided
OPT_OUT_TEMPLATES = [
    "If you {disagree_verb} with any {change_type}, you may {opt_out_action} your {account}.",
    "You can {opt_out_action} if you do not accept the {change_type_plural}.",
    "Continued use after {change_type_plural} constitutes acceptance. You may {opt_out_action} if you disagree.",
    "Your {opt_out_action} {account} is your {opt_out_method} to reject {change_type_plural}.",
    "If the {change_type_plural} are unacceptable, you should {opt_out_action}.",
    "You have the right to {opt_out_action} if you object to any {change_type}.",
    "When you disagree with {change_type_plural}, you may {opt_out_action} your {account} at any time.",
]

# Template variables
NOTIFY_VERBS = ["notify", "inform", "alert", "advise", "provide notice to"]
CHANGE_TYPES = ["change", "modification", "update", "amendment", "revision"]
DOCUMENTS = ["Terms", "Terms of Service", "Agreement", "User Agreement", "Policy"]
TIMEFRAMES = ["30 days", "14 days", "60 days", "two weeks", "one month", "seven days"]
NOTICE_TYPES = ["written notice", "email notification", "notice", "notification"]
CHANGE_VERBS = ["modify", "change", "update", "amend", "revise", "alter"]
DISCRETIONS = ["at our sole discretion", "at our discretion", "in our discretion", "at any time"]
REQUIREMENTS = ["prior notice", "your consent", "user approval", "advance warning"]
COMPANIES = ["Company", "Platform", "Service Provider", "Provider"]
UNILATERAL_ADVS = ["unilaterally", "at any time", "without notice"]
DISAGREE_VERBS = ["disagree", "object", "do not accept", "do not agree"]
OPT_OUT_ACTIONS = ["terminate", "close", "cancel", "discontinue", "stop using"]
ACCOUNTS = ["account", "subscription", "service", "membership"]
OPT_OUT_METHODS = ["remedy", "option", "right", "recourse"]


def generate_advance_notice_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic advance_notice examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(ADVANCE_NOTICE_TEMPLATES)
        
        example = template.format(
            notify_verb=rng.choice(NOTIFY_VERBS),
            notify_verb_cap=rng.choice(NOTIFY_VERBS).capitalize(),
            timeframe=rng.choice(TIMEFRAMES),
            change_type=rng.choice(CHANGE_TYPES),
            change_type_plural=rng.choice(CHANGE_TYPES) + "s",
            document=rng.choice(DOCUMENTS),
            document_cap=rng.choice(DOCUMENTS).capitalize(),
            notice_type=rng.choice(NOTICE_TYPES),
            change_verb=rng.choice(CHANGE_VERBS),
        )
        
        examples.append({
            "text": example,
            "label": "advance_notice",
            "meta": {
                "source": "synthetic",
                "generation_method": "template",
                "template_id": f"advance_notice_{i}",
            }
        })
    
    return examples


def generate_unilateral_change_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic unilateral_change examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(UNILATERAL_CHANGE_TEMPLATES)
        
        example = template.format(
            change_verb=rng.choice(CHANGE_VERBS),
            change_verb2=rng.choice(CHANGE_VERBS),
            document=rng.choice(DOCUMENTS),
            discretion=rng.choice(DISCRETIONS),
            requirement=rng.choice(REQUIREMENTS),
            company=rng.choice(COMPANIES),
            change_type_plural=rng.choice(CHANGE_TYPES) + "s",
            unilateral_adv=rng.choice(UNILATERAL_ADVS),
        )
        
        examples.append({
            "text": example,
            "label": "unilateral_change",
            "meta": {
                "source": "synthetic",
                "generation_method": "template",
                "template_id": f"unilateral_change_{i}",
            }
        })
    
    return examples


def generate_opt_out_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic opt_out_provided examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(OPT_OUT_TEMPLATES)
        
        example = template.format(
            disagree_verb=rng.choice(DISAGREE_VERBS),
            change_type=rng.choice(CHANGE_TYPES),
            change_type_plural=rng.choice(CHANGE_TYPES) + "s",
            opt_out_action=rng.choice(OPT_OUT_ACTIONS),
            account=rng.choice(ACCOUNTS),
            opt_out_method=rng.choice(OPT_OUT_METHODS),
        )
        
        examples.append({
            "text": example,
            "label": "opt_out_provided",
            "meta": {
                "source": "synthetic",
                "generation_method": "template",
                "template_id": f"opt_out_provided_{i}",
            }
        })
    
    return examples


def main() -> None:
    """Main function to drive the generation."""
    args = parse_args()
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    rng = random.Random(args.seed)
    
    print(f"Generating {args.per_label} examples per label...")
    
    advance_notice = generate_advance_notice_examples(args.per_label, rng)
    unilateral_change = generate_unilateral_change_examples(args.per_label, rng)
    opt_out = generate_opt_out_examples(args.per_label, rng)
    
    all_examples = advance_notice + unilateral_change + opt_out
    
    print(f"Writing {len(all_examples)} examples to {output_path}...")
    with output_path.open("w", encoding="utf-8") as f:
        for example in all_examples:
            f.write(json.dumps(example, ensure_ascii=False) + "\n")
    
    print(f"Successfully generated:")
    print(f"  - {len(advance_notice)} advance_notice examples")
    print(f"  - {len(unilateral_change)} unilateral_change examples")
    print(f"  - {len(opt_out)} opt_out_provided examples")
    
    print(f"\nSample examples:")
    print(f"\nadvance_notice:")
    for ex in advance_notice[:3]:
        print(f"  • {ex['text']}")
    print(f"\nunilateral_change:")
    for ex in unilateral_change[:3]:
        print(f"  • {ex['text']}")
    print(f"\nopt_out_provided:")
    for ex in opt_out[:3]:
        print(f"  • {ex['text']}")


if __name__ == "__main__":
    main()
