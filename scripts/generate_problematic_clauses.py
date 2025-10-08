#!/usr/bin/env python3
"""Generate synthetic examples for rare problematic clause labels.

This script creates realistic synthetic examples for:
- consent_implied: Implied consent through continued use
- privacy_waiver: Waiver of privacy rights

These are rare in modern ToS but important for training classifiers to detect
problematic practices.

Example:
    python scripts/generate_problematic_clauses.py \
        --output data/aug/problematic_clauses.jsonl \
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


# Template components for consent_implied
CONSENT_IMPLIED_TEMPLATES = [
    # Pattern 1: "By [action] you [agree/consent]"
    "By {action} the {service}, you {agreement_verb} to {consequence}.",
    "By {action} or {action2} our {service}, you {agreement_verb} to {consequence}.",
    "{action} the {service} constitutes your {agreement_verb} to {consequence}.",
    
    # Pattern 2: "Continued use implies consent"
    "Your {continued} {action} of the {service} {implication_verb} {agreement_noun} to {consequence}.",
    "{continued} {action} {implication_verb} that you {agreement_verb} to {consequence}.",
    
    # Pattern 3: "Deemed to have consented"
    "You are {deemed_verb} to have {agreement_verb} to {consequence} upon {action} the {service}.",
    "By {action} the {service}, you will be {deemed_verb} to have {agreement_verb} to {consequence}.",
    
    # Pattern 4: "Automatic/default consent"
    "Your consent to {consequence} is {automatic_verb} upon {action} the {service}.",
]

ACTIONS = ["using", "accessing", "visiting", "continuing to use", "downloading"]
ACTIONS2 = ["viewing", "browsing", "navigating", "interacting with"]
SERVICE_TYPES = ["Service", "Platform", "Website", "Application", "Services", "Site", "App"]
AGREEMENT_VERBS = ["consent", "agree", "accept", "acknowledge"]
CONTINUED = ["continued", "ongoing", "further", "repeated"]
IMPLICATION_VERBS = ["constitutes", "implies", "indicates", "represents", "signifies"]
AGREEMENT_NOUNS = ["consent", "agreement", "acceptance"]
DEEMED_VERBS = ["deemed", "considered", "presumed", "assumed"]
AUTOMATIC_VERBS = ["automatic", "granted automatically", "provided by default", "assumed"]

CONSEQUENCES = [
    "our Privacy Policy",
    "these Terms of Service",
    "our data collection practices",
    "the collection and use of your personal information",
    "our use of cookies and tracking technologies",
    "the processing of your data as described herein",
    "our terms and conditions",
    "all provisions of this Agreement",
]


# Template components for privacy_waiver
PRIVACY_WAIVER_TEMPLATES = [
    # Pattern 1: "You waive your right to privacy"
    "By using the {service}, you {waiver_verb} any {right_type} to {privacy_aspect}.",
    "You {waiver_verb} your {right_type} to {privacy_aspect} when using our {service}.",
    
    # Pattern 2: "No expectation of privacy"
    "You have no {expectation_type} of {privacy_aspect} when using the {service}.",
    "Users should have no {expectation_type} of {privacy_aspect} regarding {monitored_thing}.",
    
    # Pattern 3: "Consent to monitoring"
    "You {agreement_verb} to {monitoring_type} of {monitored_thing}.",
    "By using the {service}, you {agreement_verb} that we may {monitoring_type} {monitored_thing}.",
    
    # Pattern 4: "Acknowledge monitoring may occur"
    "You {acknowledgment_verb} that {monitored_thing} may be {monitored_verb}.",
    "You {acknowledgment_verb} and {agreement_verb} that we may {monitoring_type} {monitored_thing} at any time.",
]

WAIVER_VERBS = ["waive", "forfeit", "surrender", "relinquish", "give up"]
RIGHT_TYPES = ["right", "expectation", "claim", "rights"]
PRIVACY_ASPECTS = [
    "privacy",
    "confidentiality",
    "private communications",
    "data privacy",
    "personal privacy",
]
EXPECTATION_TYPES = [
    "reasonable expectation",
    "expectation",
    "legitimate expectation",
]
MONITORING_TYPES = [
    "monitor", "monitoring", "surveillance", "tracking", "inspection",
    "review", "auditing"
]
MONITORED_THINGS = [
    "all communications",
    "your activity",
    "your usage",
    "all content you post",
    "your interactions",
    "communications on the platform",
    "all data transmitted",
]
ACKNOWLEDGMENT_VERBS = ["acknowledge", "understand", "recognize", "accept"]


def generate_consent_implied_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic consent_implied examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(CONSENT_IMPLIED_TEMPLATES)
        
        example = template.format(
            action=rng.choice(ACTIONS),
            action2=rng.choice(ACTIONS2),
            service=rng.choice(SERVICE_TYPES),
            agreement_verb=rng.choice(AGREEMENT_VERBS),
            continued=rng.choice(CONTINUED),
            implication_verb=rng.choice(IMPLICATION_VERBS),
            agreement_noun=rng.choice(AGREEMENT_NOUNS),
            deemed_verb=rng.choice(DEEMED_VERBS),
            automatic_verb=rng.choice(AUTOMATIC_VERBS),
            consequence=rng.choice(CONSEQUENCES),
        )
        
        examples.append({
            "text": example,
            "label": "consent_implied",
            "meta": {
                "source": "synthetic",
                "generation_method": "template",
                "template_id": f"consent_implied_{i}",
            }
        })
    
    return examples


def generate_privacy_waiver_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic privacy_waiver examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(PRIVACY_WAIVER_TEMPLATES)
        
        example = template.format(
            service=rng.choice(SERVICE_TYPES),
            waiver_verb=rng.choice(WAIVER_VERBS),
            right_type=rng.choice(RIGHT_TYPES),
            privacy_aspect=rng.choice(PRIVACY_ASPECTS),
            expectation_type=rng.choice(EXPECTATION_TYPES),
            monitoring_type=rng.choice(MONITORING_TYPES),
            monitored_thing=rng.choice(MONITORED_THINGS),
            agreement_verb=rng.choice(AGREEMENT_VERBS),
            acknowledgment_verb=rng.choice(ACKNOWLEDGMENT_VERBS),
            monitored_verb="monitored" if rng.random() > 0.5 else "tracked",
        )
        
        examples.append({
            "text": example,
            "label": "privacy_waiver",
            "meta": {
                "source": "synthetic",
                "generation_method": "template",
                "template_id": f"privacy_waiver_{i}",
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
    
    consent_implied = generate_consent_implied_examples(args.per_label, rng)
    privacy_waiver = generate_privacy_waiver_examples(args.per_label, rng)
    
    all_examples = consent_implied + privacy_waiver
    
    print(f"Writing {len(all_examples)} examples to {output_path}...")
    with output_path.open("w", encoding="utf-8") as f:
        for example in all_examples:
            f.write(json.dumps(example, ensure_ascii=False) + "\n")
    
    print(f"Successfully generated:")
    print(f"  - {len(consent_implied)} consent_implied examples")
    print(f"  - {len(privacy_waiver)} privacy_waiver examples")
    print(f"\nSample examples:")
    print(f"\nconsent_implied:")
    for ex in consent_implied[:3]:
        print(f"  • {ex['text']}")
    print(f"\nprivacy_waiver:")
    for ex in privacy_waiver[:3]:
        print(f"  • {ex['text']}")


if __name__ == "__main__":
    main()
