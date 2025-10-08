#!/usr/bin/env python3
"""Generate expanded synthetic examples for terms_changes category."""

import json
import random
from pathlib import Path
from typing import List


# === ADVANCE NOTICE TEMPLATES (Service commits to notice before changes) ===
ADVANCE_NOTICE_TEMPLATES = [
    "We will notify you at least {timeframe} before any changes to these Terms take effect.",
    "You will receive {notice_type} {timeframe} prior to modifications becoming effective.",
    "Terms changes will be announced {timeframe} before becoming effective.",
    "We provide {timeframe} advance notice of any amendments to these Terms.",
    "Changes will be communicated {timeframe} in advance via {channel}.",
    "We commit to notifying users {timeframe} before implementing modifications.",
    "You will be informed {timeframe} before changes take effect.",
    "Notice of amendments will be posted {timeframe} before the effective date.",
    "We will email users {timeframe} prior to any material changes.",
    "Changes require {timeframe} notice before implementation.",
    "The effective date will be at least {timeframe} after notice is provided.",
    "We guarantee {timeframe} advance notification of terms modifications.",
    "Users receive {timeframe} warning before changes become binding.",
    "Amendments are announced {timeframe} in advance on {channel}.",
    "We shall provide {notice_type} {timeframe} before updated Terms take effect.",
    "Material changes will be disclosed {timeframe} ahead of implementation.",
    "You will have {timeframe} notice before revisions become effective.",
    "Changes to these Terms will be posted {timeframe} before going live.",
    "We promise {timeframe} advance notice for any substantive modifications.",
    "Updated Terms are published {timeframe} before the effective date.",
]

# === UNILATERAL CHANGE TEMPLATES (Service can change terms without consent) ===
UNILATERAL_CHANGE_TEMPLATES = [
    "We reserve the right to modify these Terms at any time without prior notice.",
    "We may change, modify, or update these Terms at our sole discretion.",
    "These Terms may be amended at any time without user consent.",
    "We can modify these Terms unilaterally at our discretion.",
    "Changes to these Terms are effective immediately upon posting.",
    "We reserve the right to change these Terms without notification.",
    "These Terms may be updated at any time without advance warning.",
    "We have the right to modify these Terms at our sole discretion.",
    "Terms are subject to change without prior notice to users.",
    "We may unilaterally amend these Terms at any time.",
    "Changes become effective immediately without requiring user agreement.",
    "We can revise these Terms at any time without consulting users.",
    "These Terms may be modified without notice at our discretion.",
    "We reserve the right to make changes effective immediately.",
    "Terms updates are at our sole discretion and require no advance notice.",
    "We may alter these Terms at any time without user approval.",
    "Changes to these Terms are binding immediately upon publication.",
    "We have the right to update Terms without user consultation.",
    "These Terms are subject to unilateral modification at any time.",
    "We may revise Terms without providing advance notification.",
]

# === OPT-OUT PROVIDED TEMPLATES (Users can reject changes by discontinuing) ===
OPT_OUT_TEMPLATES = [
    "If you disagree with changes, you may terminate your account.",
    "Continued use after changes constitutes acceptance. You may opt out by discontinuing use.",
    "You can reject changes by closing your account before the effective date.",
    "If you do not accept the modified Terms, you must stop using the Service.",
    "You have the option to terminate if you disagree with amendments.",
    "Disagreement with changes gives you the right to cancel your subscription.",
    "You may opt out of amended Terms by ceasing use of the Service.",
    "If changes are unacceptable, you can discontinue your account.",
    "You can reject modifications by terminating your membership.",
    "Non-acceptance of changes requires you to stop using the platform.",
    "You have the right to cancel if you do not agree with updated Terms.",
    "If you object to changes, you may close your account without penalty.",
    "Continued use implies consent; you may opt out by leaving the Service.",
    "Disagreement with amendments allows you to terminate without fees.",
    "You can choose to discontinue use rather than accept modified Terms.",
    "If you do not wish to be bound by changes, cease using the Service.",
    "You may cancel your subscription if you disagree with Terms revisions.",
    "Non-acceptance of modifications requires account closure.",
    "You have the option to exit the Service if changes are unacceptable.",
    "If you reject updated Terms, you must terminate your account.",
]

# === TEMPLATE VARIABLES ===
TIMEFRAMES = [
    "30 days",
    "14 days",
    "7 days",
    "one month",
    "two weeks",
    "15 days",
    "60 days",
    "three weeks",
    "10 business days",
    "45 days"
]

NOTICE_TYPES = [
    "email notification",
    "written notice",
    "notification",
    "notice",
    "email",
    "in-app notification",
    "account notification"
]

CHANNELS = [
    "email",
    "our website",
    "the platform",
    "your account dashboard",
    "in-app messaging",
    "our Terms page",
    "email and website"
]


def generate_advance_notice_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic advance_notice examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(ADVANCE_NOTICE_TEMPLATES)
        
        example = template.format(
            timeframe=rng.choice(TIMEFRAMES),
            notice_type=rng.choice(NOTICE_TYPES),
            channel=rng.choice(CHANNELS),
        )
        
        examples.append({
            "text": example,
            "labels": ["advance_notice"],
            "source": "synthetic_expanded",
            "category": "terms_changes",
        })
    
    return examples


def generate_unilateral_change_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic unilateral_change examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(UNILATERAL_CHANGE_TEMPLATES)
        example = template  # No variable substitution needed
        
        examples.append({
            "text": example,
            "labels": ["unilateral_change"],
            "source": "synthetic_expanded",
            "category": "terms_changes",
        })
    
    return examples


def generate_opt_out_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic opt_out_provided examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(OPT_OUT_TEMPLATES)
        example = template  # No variable substitution needed
        
        examples.append({
            "text": example,
            "labels": ["opt_out_provided"],
            "source": "synthetic_expanded",
            "category": "terms_changes",
        })
    
    return examples


def main():
    """Generate expanded synthetic examples for terms changes."""
    rng = random.Random(42)
    
    # Generate balanced examples (67 per label = ~200 total, targeting 3 labels)
    print("Generating expanded synthetic examples for terms_changes...")
    
    advance_notice = generate_advance_notice_examples(67, rng)
    unilateral_change = generate_unilateral_change_examples(67, rng)
    opt_out = generate_opt_out_examples(66, rng)  # 66 to make exactly 200
    
    all_examples = advance_notice + unilateral_change + opt_out
    
    # Write to file
    output_path = Path("data/corpus/terms_changes_synthetic_expanded.jsonl")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with output_path.open("w") as f:
        for ex in all_examples:
            f.write(json.dumps(ex) + "\n")
    
    print(f"\nGenerated {len(all_examples)} total examples:")
    print(f"  ✓ advance_notice: {len(advance_notice)}")
    print(f"  ✓ unilateral_change: {len(unilateral_change)}")
    print(f"  ✓ opt_out_provided: {len(opt_out)}")
    print(f"\nWrote to: {output_path}")
    
    # Show samples
    print("\n" + "="*70)
    print("SAMPLE EXAMPLES")
    print("="*70)
    print("\n[ADVANCE NOTICE]")
    for ex in advance_notice[:3]:
        print(f"  • {ex['text']}")
    print("\n[UNILATERAL CHANGE]")
    for ex in unilateral_change[:3]:
        print(f"  • {ex['text']}")
    print("\n[OPT-OUT PROVIDED]")
    for ex in opt_out[:3]:
        print(f"  • {ex['text']}")


if __name__ == "__main__":
    main()
