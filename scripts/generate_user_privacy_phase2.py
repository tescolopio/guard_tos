#!/usr/bin/env python3
"""Generate expanded synthetic examples for user_privacy category.

Focus on underrepresented labels:
- privacy_waiver (need +56)
- deletion_offered (need +45)
- retention_disclosed (need +45)
- access_rights (need +11)
"""

import json
import random
from pathlib import Path
from typing import List


# === PRIVACY_WAIVER TEMPLATES (User waives privacy rights) ===
PRIVACY_WAIVER_TEMPLATES = [
    "By using our Service, you waive certain privacy rights under {law}.",
    "You agree to waive your right to {privacy_right} as permitted by law.",
    "Use of the Service constitutes a waiver of {privacy_right}.",
    "You waive any right to object to data processing for {purpose}.",
    "By accepting these Terms, you waive privacy protections related to {data_type}.",
    "You agree not to exercise your {privacy_right} for {data_type}.",
    "Your privacy rights under {law} are limited by these Terms.",
    "You waive the right to {privacy_action} regarding {data_type}.",
    "By proceeding, you waive certain data protection rights under {law}.",
    "You agree to waive {privacy_right} for {purpose}.",
    "Use of this Service constitutes consent to waive {privacy_right}.",
    "You waive any claims related to {privacy_right} under {law}.",
    "By using our platform, you agree not to assert {privacy_right}.",
    "Your {privacy_right} is waived to the maximum extent permitted by law.",
    "You waive the right to {privacy_action} under {law}.",
]

# === DELETION_OFFERED TEMPLATES (Right to delete data) ===
DELETION_OFFERED_TEMPLATES = [
    "You can request deletion of your {data_type} at any time.",
    "You have the right to delete your {data_type} by {method}.",
    "We offer {data_type} deletion upon request.",
    "You may request that we delete your {data_type}.",
    "We provide the option to delete your {data_type} {timing}.",
    "You can delete your {data_type} through {location}.",
    "We will delete your {data_type} upon your request.",
    "You have the right to erasure of {data_type}.",
    "We offer account and {data_type} deletion at your request.",
    "You can request permanent deletion of {data_type}.",
    "We provide {data_type} deletion services {timing}.",
    "You may delete your {data_type} by {method}.",
    "We honor deletion requests for {data_type}.",
    "You have the right to request deletion of {data_type}.",
    "We allow you to delete {data_type} {timing}.",
]

# === RETENTION_DISCLOSED TEMPLATES (Data retention period disclosed) ===
RETENTION_DISCLOSED_TEMPLATES = [
    "We retain {data_type} for {retention_period}.",
    "Your {data_type} is stored for {retention_period}.",
    "{data_type_cap} is kept for {retention_period} after {event}.",
    "We hold {data_type} for a period of {retention_period}.",
    "Data retention: {data_type} is retained for {retention_period}.",
    "We store {data_type} for {retention_period} from {event}.",
    "{data_type_cap} will be retained for {retention_period}.",
    "We keep your {data_type} for {retention_period}.",
    "Retention period for {data_type}: {retention_period}.",
    "We maintain {data_type} for {retention_period} after {event}.",
    "{data_type_cap} is preserved for {retention_period}.",
    "We hold onto {data_type} for {retention_period}.",
    "Your {data_type} is retained for {retention_period} following {event}.",
    "We store {data_type} for {retention_period} as required by {law}.",
    "{data_type_cap} retention period: {retention_period}.",
]

# === ACCESS_RIGHTS TEMPLATES (Right to access data) ===
ACCESS_RIGHTS_TEMPLATES = [
    "You have the right to access your {data_type}.",
    "You can request a copy of your {data_type} at any time.",
    "We provide access to your {data_type} upon request.",
    "You may view your {data_type} through {location}.",
    "You have the right to obtain your {data_type}.",
    "We offer access to {data_type} by {method}.",
    "You can download your {data_type} {timing}.",
    "You have the right to request access to {data_type}.",
    "We provide a copy of your {data_type} upon request.",
    "You can access your {data_type} through {location}.",
    "You may request disclosure of {data_type} we hold.",
    "We grant access to your {data_type} {timing}.",
    "You have the right to review your {data_type}.",
    "You can obtain a copy of {data_type} by {method}.",
    "We provide access to {data_type} within {timeframe}.",
]

# === TEMPLATE VARIABLES ===
DATA_TYPES = [
    "personal data",
    "personal information",
    "user data",
    "account information",
    "profile data",
    "contact information",
    "usage information",
    "behavioral data",
    "transaction history",
    "communication records",
    "stored data",
    "collected information",
    "submitted data",
    "all personal data"
]

LAWS = [
    "GDPR",
    "CCPA",
    "applicable law",
    "local privacy laws",
    "data protection regulations",
    "PIPEDA",
    "privacy legislation"
]

PRIVACY_RIGHTS = [
    "data portability",
    "right to be forgotten",
    "right to erasure",
    "right to object",
    "opt-out rights",
    "privacy rights",
    "data protection rights",
    "right to restrict processing",
    "right to data portability",
    "right to access"
]

PRIVACY_ACTIONS = [
    "object to processing",
    "restrict data use",
    "request portability",
    "opt-out of marketing",
    "file privacy complaints",
    "challenge data accuracy"
]

PURPOSES = [
    "marketing purposes",
    "analytics",
    "advertising",
    "research",
    "service improvement",
    "legitimate interests"
]

METHODS = [
    "contacting support",
    "emailing us",
    "using your account settings",
    "submitting a request form",
    "calling customer service",
    "through our privacy portal"
]

LOCATIONS = [
    "your account settings",
    "your privacy dashboard",
    "the account management page",
    "your profile page",
    "our privacy center",
    "the user portal"
]

TIMINGS = [
    "at any time",
    "anytime",
    "within 30 days",
    "upon request",
    "free of charge",
    "without undue delay"
]

RETENTION_PERIODS = [
    "6 months",
    "one year",
    "two years",
    "three years",
    "5 years",
    "seven years",
    "as long as necessary",
    "the duration of your account",
    "30 days",
    "90 days",
    "12 months",
    "24 months"
]

EVENTS = [
    "account closure",
    "last login",
    "your last interaction",
    "termination",
    "service discontinuation",
    "data collection"
]

TIMEFRAMES = [
    "30 days of your request",
    "one month",
    "a reasonable timeframe",
    "45 days",
    "60 days"
]


def generate_privacy_waiver_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic privacy_waiver examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(PRIVACY_WAIVER_TEMPLATES)
        
        example = template.format(
            law=rng.choice(LAWS),
            privacy_right=rng.choice(PRIVACY_RIGHTS),
            privacy_action=rng.choice(PRIVACY_ACTIONS),
            data_type=rng.choice(DATA_TYPES),
            purpose=rng.choice(PURPOSES),
        )
        
        examples.append({
            "text": example,
            "labels": ["privacy_waiver"],
            "source": "synthetic_expanded_phase2",
            "category": "user_privacy",
        })
    
    return examples


def generate_deletion_offered_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic deletion_offered examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(DELETION_OFFERED_TEMPLATES)
        
        example = template.format(
            data_type=rng.choice(DATA_TYPES),
            method=rng.choice(METHODS),
            location=rng.choice(LOCATIONS),
            timing=rng.choice(TIMINGS),
        )
        
        examples.append({
            "text": example,
            "labels": ["deletion_offered"],
            "source": "synthetic_expanded_phase2",
            "category": "user_privacy",
        })
    
    return examples


def generate_retention_disclosed_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic retention_disclosed examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(RETENTION_DISCLOSED_TEMPLATES)
        data_type = rng.choice(DATA_TYPES)
        
        example = template.format(
            data_type=data_type,
            data_type_cap=data_type.capitalize(),
            retention_period=rng.choice(RETENTION_PERIODS),
            event=rng.choice(EVENTS),
            law=rng.choice(LAWS),
        )
        
        examples.append({
            "text": example,
            "labels": ["retention_disclosed"],
            "source": "synthetic_expanded_phase2",
            "category": "user_privacy",
        })
    
    return examples


def generate_access_rights_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic access_rights examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(ACCESS_RIGHTS_TEMPLATES)
        
        example = template.format(
            data_type=rng.choice(DATA_TYPES),
            method=rng.choice(METHODS),
            location=rng.choice(LOCATIONS),
            timing=rng.choice(TIMINGS),
            timeframe=rng.choice(TIMEFRAMES),
        )
        
        examples.append({
            "text": example,
            "labels": ["access_rights"],
            "source": "synthetic_expanded_phase2",
            "category": "user_privacy",
        })
    
    return examples


def main():
    """Generate expanded synthetic examples for user privacy."""
    rng = random.Random(42)
    
    # Generate examples targeting the gaps
    print("Generating Phase 2 synthetic examples for user_privacy...")
    
    privacy_waiver = generate_privacy_waiver_examples(56, rng)
    deletion_offered = generate_deletion_offered_examples(45, rng)
    retention_disclosed = generate_retention_disclosed_examples(45, rng)
    access_rights = generate_access_rights_examples(11, rng)
    
    all_examples = privacy_waiver + deletion_offered + retention_disclosed + access_rights
    
    # Write to file
    output_path = Path("data/corpus/user_privacy_synthetic_phase2.jsonl")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with output_path.open("w") as f:
        for ex in all_examples:
            f.write(json.dumps(ex) + "\n")
    
    print(f"\nGenerated {len(all_examples)} total examples:")
    print(f"  ✓ privacy_waiver: {len(privacy_waiver)}")
    print(f"  ✓ deletion_offered: {len(deletion_offered)}")
    print(f"  ✓ retention_disclosed: {len(retention_disclosed)}")
    print(f"  ✓ access_rights: {len(access_rights)}")
    print(f"\nWrote to: {output_path}")
    
    # Show samples
    print("\n" + "="*70)
    print("SAMPLE EXAMPLES")
    print("="*70)
    print("\n[PRIVACY WAIVER]")
    for ex in privacy_waiver[:3]:
        print(f"  • {ex['text']}")
    print("\n[DELETION OFFERED]")
    for ex in deletion_offered[:3]:
        print(f"  • {ex['text']}")
    print("\n[RETENTION DISCLOSED]")
    for ex in retention_disclosed[:3]:
        print(f"  • {ex['text']}")
    print("\n[ACCESS RIGHTS]")
    for ex in access_rights[:3]:
        print(f"  • {ex['text']}")


if __name__ == "__main__":
    main()
