#!/usr/bin/env python3
"""Generate synthetic examples for account management labels.

Creates realistic synthetic examples for account_management category labels,
especially for rare/underrepresented practices like manual_cancellation and
auto_renewal_friction.

Example:
    python scripts/generate_account_management_examples.py \
        --output data/aug/account_management.jsonl \
        --per-label 25
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
        default=25,
        help="Number of examples to generate per label"
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducibility"
    )
    return parser.parse_args()


# Templates for manual_cancellation
MANUAL_CANCELLATION_TEMPLATES = [
    "To cancel your {subscription}, you must {contact_method} {contact_target}.",
    "{cancellation_action} requires {contact_method} {contact_target}.",
    "You can cancel by {contact_method} {contact_target} at least {timeframe} before {renewal_event}.",
    "{subscription_capitalized} cancellation is only available by {contact_method} {contact_target}.",
    "To {cancel_verb} your {subscription}, please {contact_method} {contact_target}.",
    "Cancellation requests must be submitted by {contact_method} {contact_target}.",
    "You must send a {written_type} to {contact_target} to cancel your {subscription}.",
    "{contact_target_capitalized} must be contacted via {contact_method} to process cancellation.",
]

# Templates for auto_renewal_friction  
AUTO_RENEWAL_TEMPLATES = [
    "Your {subscription} will automatically renew unless you cancel at least {timeframe} before the {renewal_event}.",
    "{subscription_capitalized} {auto_verb} {renew_verb} on the {renewal_event}. Cancel {timeframe} in advance to avoid charges.",
    "To avoid automatic renewal, you must cancel {timeframe} before your {renewal_event}.",
    "Cancellations made less than {timeframe} before renewal will not prevent the next billing cycle.",
    "Your {subscription} {auto_verb} {renew_verb} {frequency}. No refunds after renewal.",
    "{subscription_capitalized} continues automatically. You must cancel before {renewal_event} to stop charges.",
    "We will charge your payment method automatically on each {renewal_event} unless cancelled {timeframe} prior.",
]

# Templates for grace_period
GRACE_PERIOD_TEMPLATES = [
    "You have {grace_duration} after cancellation to reactivate your {subscription}.",
    "Your {subscription} data will be retained for {grace_duration} after {termination_event}.",
    "{account_or_data} can be restored within {grace_duration} of {termination_event}.",
    "We provide a {grace_duration} grace period during which you may {reactivation_verb} your {subscription}.",
    "After cancellation, your {account_or_data} remains accessible for {grace_duration}.",
    "You may reverse your cancellation within {grace_duration} of {termination_event}.",
]

# Template variables
SUBSCRIPTIONS = ["subscription", "account", "plan", "service", "membership"]
CONTACT_METHODS = ["contacting", "calling", "emailing", "writing to"]
CONTACT_TARGETS = ["customer support", "our support team", "customer service", "us", "our cancellation department"]
CANCEL_VERBS = ["cancel", "terminate", "close", "end"]
TIMEFRAMES = ["24 hours", "48 hours", "7 days", "14 days", "30 days", "one week", "two weeks"]
RENEWAL_EVENTS = ["renewal date", "billing date", "subscription end date", "next billing cycle"]
WRITTEN_TYPES = ["written notice", "cancellation letter", "formal request", "written request"]
AUTO_VERBS = ["automatically", "will automatically", "will"]
RENEW_VERBS = ["renew", "continue", "rebill", "charge"]
FREQUENCIES = ["monthly", "annually", "yearly", "each billing period"]
GRACE_DURATIONS = ["30 days", "60 days", "90 days", "14 days", "two weeks", "one month"]
TERMINATION_EVENTS = ["cancellation", "account closure", "termination", "deletion"]
REACTIVATION_VERBS = ["reactivate", "restore", "recover", "reinstate"]
ACCOUNT_OR_DATA = ["Your account", "Your data", "Account information", "Your content"]


def generate_manual_cancellation_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic manual_cancellation examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(MANUAL_CANCELLATION_TEMPLATES)
        
        example = template.format(
            subscription=rng.choice(SUBSCRIPTIONS),
            subscription_capitalized=rng.choice(SUBSCRIPTIONS).capitalize(),
            contact_method=rng.choice(CONTACT_METHODS),
            contact_target=rng.choice(CONTACT_TARGETS),
            contact_target_capitalized=rng.choice(CONTACT_TARGETS).capitalize(),
            cancellation_action=rng.choice(CANCEL_VERBS).capitalize() + "ling",
            cancel_verb=rng.choice(CANCEL_VERBS),
            timeframe=rng.choice(TIMEFRAMES),
            renewal_event=rng.choice(RENEWAL_EVENTS),
            written_type=rng.choice(WRITTEN_TYPES),
        )
        
        examples.append({
            "text": example,
            "label": "manual_cancellation",
            "meta": {
                "source": "synthetic",
                "generation_method": "template",
                "template_id": f"manual_cancellation_{i}",
            }
        })
    
    return examples


def generate_auto_renewal_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic auto_renewal_friction examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(AUTO_RENEWAL_TEMPLATES)
        
        example = template.format(
            subscription=rng.choice(SUBSCRIPTIONS),
            subscription_capitalized=rng.choice(SUBSCRIPTIONS).capitalize(),
            timeframe=rng.choice(TIMEFRAMES),
            renewal_event=rng.choice(RENEWAL_EVENTS),
            auto_verb=rng.choice(AUTO_VERBS),
            renew_verb=rng.choice(RENEW_VERBS),
            frequency=rng.choice(FREQUENCIES),
        )
        
        examples.append({
            "text": example,
            "label": "auto_renewal_friction",
            "meta": {
                "source": "synthetic",
                "generation_method": "template",
                "template_id": f"auto_renewal_friction_{i}",
            }
        })
    
    return examples


def generate_grace_period_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic grace_period examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(GRACE_PERIOD_TEMPLATES)
        
        example = template.format(
            subscription=rng.choice(SUBSCRIPTIONS),
            grace_duration=rng.choice(GRACE_DURATIONS),
            termination_event=rng.choice(TERMINATION_EVENTS),
            reactivation_verb=rng.choice(REACTIVATION_VERBS),
            account_or_data=rng.choice(ACCOUNT_OR_DATA),
        )
        
        examples.append({
            "text": example,
            "label": "grace_period",
            "meta": {
                "source": "synthetic",
                "generation_method": "template",
                "template_id": f"grace_period_{i}",
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
    
    manual_cancellation = generate_manual_cancellation_examples(args.per_label, rng)
    auto_renewal = generate_auto_renewal_examples(args.per_label, rng)
    grace_period = generate_grace_period_examples(args.per_label, rng)
    
    all_examples = manual_cancellation + auto_renewal + grace_period
    
    print(f"Writing {len(all_examples)} examples to {output_path}...")
    with output_path.open("w", encoding="utf-8") as f:
        for example in all_examples:
            f.write(json.dumps(example, ensure_ascii=False) + "\n")
    
    print(f"Successfully generated:")
    print(f"  - {len(manual_cancellation)} manual_cancellation examples")
    print(f"  - {len(auto_renewal)} auto_renewal_friction examples")
    print(f"  - {len(grace_period)} grace_period examples")
    
    print(f"\nSample examples:")
    print(f"\nmanual_cancellation:")
    for ex in manual_cancellation[:3]:
        print(f"  • {ex['text']}")
    print(f"\nauto_renewal_friction:")
    for ex in auto_renewal[:3]:
        print(f"  • {ex['text']}")
    print(f"\ngrace_period:")
    for ex in grace_period[:3]:
        print(f"  • {ex['text']}")


if __name__ == "__main__":
    main()
