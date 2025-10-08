#!/usr/bin/env python3
"""Generate expanded synthetic examples for data_collection category.

Focus on underrepresented labels:
- purpose_specific (need +53)
- consent_explicit (need +44)
- consent_implied (need +40)
- data_collection_minimal (need +35)
"""

import json
import random
from pathlib import Path
from typing import List


# === PURPOSE_SPECIFIC TEMPLATES (Specific, limited purposes) ===
PURPOSE_SPECIFIC_TEMPLATES = [
    "We collect {data_type} solely to {specific_purpose}.",
    "Your {data_type} is used only for {specific_purpose}.",
    "We process {data_type} exclusively to {specific_purpose}.",
    "{data_type_cap} is collected for the limited purpose of {specific_purpose}.",
    "We gather {data_type} strictly to {specific_purpose}.",
    "The purpose of collecting {data_type} is limited to {specific_purpose}.",
    "We only use {data_type} to {specific_purpose}.",
    "{data_type_cap} collection is restricted to {specific_purpose}.",
    "We process {data_type} for the specific purpose of {specific_purpose}.",
    "Your {data_type} will be used solely for {specific_purpose}.",
    "We collect {data_type} for the narrow purpose of {specific_purpose}.",
    "{data_type_cap} is processed only to {specific_purpose}.",
    "We limit our use of {data_type} to {specific_purpose}.",
    "The sole purpose of collecting {data_type} is to {specific_purpose}.",
    "{data_type_cap} is gathered exclusively for {specific_purpose}.",
]

# === CONSENT_EXPLICIT TEMPLATES (Clear, affirmative consent) ===
CONSENT_EXPLICIT_TEMPLATES = [
    "You must provide explicit consent before we collect {data_type}.",
    "We will only collect {data_type} with your express permission.",
    "Your affirmative consent is required for {data_type} collection.",
    "We ask for your explicit approval to collect {data_type}.",
    "You must opt-in to allow us to collect {data_type}.",
    "We require your clear consent before processing {data_type}.",
    "{data_type_cap} collection requires your express authorization.",
    "You must actively agree to {data_type} collection.",
    "We will not collect {data_type} without your explicit permission.",
    "Your specific consent is needed for us to gather {data_type}.",
    "We obtain your express consent before collecting {data_type}.",
    "You control whether we collect {data_type} through explicit opt-in.",
    "{data_type_cap} is only collected if you explicitly permit it.",
    "We request your affirmative agreement for {data_type} processing.",
    "You must check a box to consent to {data_type} collection.",
]

# === CONSENT_IMPLIED TEMPLATES (Passive/inferred consent) ===
CONSENT_IMPLIED_TEMPLATES = [
    "By using our Service, you consent to collection of {data_type}.",
    "Continued use of the platform implies consent to {data_type} collection.",
    "Your use of our Service constitutes agreement to collect {data_type}.",
    "By accessing our website, you agree to {data_type} collection.",
    "Use of our Service means you accept {data_type} processing.",
    "Accessing our platform implies consent for {data_type} collection.",
    "Your continued use indicates agreement to collect {data_type}.",
    "By proceeding, you consent to our collection of {data_type}.",
    "Use of our Service signifies acceptance of {data_type} collection.",
    "Accessing this site means you agree to {data_type} processing.",
    "Continued use implies your consent to collect {data_type}.",
    "By using our features, you consent to {data_type} collection.",
    "Your use of the Service constitutes consent for {data_type} processing.",
    "By continuing, you agree to our collection of {data_type}.",
    "Use of our platform indicates consent to {data_type} collection.",
]

# === DATA_COLLECTION_MINIMAL TEMPLATES (Limited data collection) ===
DATA_COLLECTION_MINIMAL_TEMPLATES = [
    "We collect only the minimum {data_type} necessary to {purpose}.",
    "We limit data collection to essential {data_type} required for {purpose}.",
    "Only necessary {data_type} is collected to {purpose}.",
    "We minimize {data_type} collection to what is strictly needed for {purpose}.",
    "We collect the least amount of {data_type} required to {purpose}.",
    "Data collection is limited to {data_type} essential for {purpose}.",
    "We only gather {data_type} that is absolutely necessary for {purpose}.",
    "Minimal {data_type} is collected - only what is needed to {purpose}.",
    "We restrict {data_type} collection to the minimum required for {purpose}.",
    "Only essential {data_type} is processed to {purpose}.",
    "We collect {data_type} on a need-to-know basis for {purpose}.",
    "Data minimization: we only collect {data_type} necessary for {purpose}.",
    "We limit our collection to {data_type} strictly required for {purpose}.",
    "Only the minimum {data_type} needed to {purpose} is collected.",
    "We gather only essential {data_type} required to {purpose}.",
]

# === TEMPLATE VARIABLES ===
DATA_TYPES = [
    "personal information",
    "email addresses",
    "IP addresses",
    "device identifiers",
    "location data",
    "usage data",
    "contact information",
    "account details",
    "payment information",
    "browsing history",
    "user preferences",
    "demographic information",
    "profile data",
    "behavioral data",
    "technical information"
]

SPECIFIC_PURPOSES = [
    "provide the requested service",
    "process your transactions",
    "fulfill your orders",
    "send transactional emails",
    "verify your identity",
    "prevent fraud",
    "comply with legal obligations",
    "respond to your inquiries",
    "deliver the core functionality",
    "authenticate your account",
    "process payments",
    "provide customer support",
    "complete your registration",
    "enable account creation",
    "facilitate communication"
]

GENERAL_PURPOSES = [
    "provide and improve our services",
    "operate the platform",
    "deliver functionality",
    "maintain the service"
]


def generate_purpose_specific_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic purpose_specific examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(PURPOSE_SPECIFIC_TEMPLATES)
        data_type = rng.choice(DATA_TYPES)
        
        example = template.format(
            data_type=data_type,
            data_type_cap=data_type.capitalize(),
            specific_purpose=rng.choice(SPECIFIC_PURPOSES),
        )
        
        examples.append({
            "text": example,
            "labels": ["purpose_specific"],
            "source": "synthetic_expanded_phase2",
            "category": "data_collection",
        })
    
    return examples


def generate_consent_explicit_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic consent_explicit examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(CONSENT_EXPLICIT_TEMPLATES)
        data_type = rng.choice(DATA_TYPES)
        
        example = template.format(
            data_type=data_type,
            data_type_cap=data_type.capitalize(),
        )
        
        examples.append({
            "text": example,
            "labels": ["consent_explicit"],
            "source": "synthetic_expanded_phase2",
            "category": "data_collection",
        })
    
    return examples


def generate_consent_implied_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic consent_implied examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(CONSENT_IMPLIED_TEMPLATES)
        data_type = rng.choice(DATA_TYPES)
        
        example = template.format(
            data_type=data_type,
            data_type_cap=data_type.capitalize(),
        )
        
        examples.append({
            "text": example,
            "labels": ["consent_implied"],
            "source": "synthetic_expanded_phase2",
            "category": "data_collection",
        })
    
    return examples


def generate_data_collection_minimal_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic data_collection_minimal examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(DATA_COLLECTION_MINIMAL_TEMPLATES)
        data_type = rng.choice(DATA_TYPES)
        
        example = template.format(
            data_type=data_type,
            data_type_cap=data_type.capitalize(),
            purpose=rng.choice(GENERAL_PURPOSES),
        )
        
        examples.append({
            "text": example,
            "labels": ["data_collection_minimal"],
            "source": "synthetic_expanded_phase2",
            "category": "data_collection",
        })
    
    return examples


def main():
    """Generate expanded synthetic examples for data collection."""
    rng = random.Random(42)
    
    # Generate examples targeting the gaps
    print("Generating Phase 2 synthetic examples for data_collection...")
    
    purpose_specific = generate_purpose_specific_examples(53, rng)
    consent_explicit = generate_consent_explicit_examples(44, rng)
    consent_implied = generate_consent_implied_examples(40, rng)
    data_collection_minimal = generate_data_collection_minimal_examples(35, rng)
    
    all_examples = purpose_specific + consent_explicit + consent_implied + data_collection_minimal
    
    # Write to file
    output_path = Path("data/corpus/data_collection_synthetic_phase2.jsonl")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with output_path.open("w") as f:
        for ex in all_examples:
            f.write(json.dumps(ex) + "\n")
    
    print(f"\nGenerated {len(all_examples)} total examples:")
    print(f"  ✓ purpose_specific: {len(purpose_specific)}")
    print(f"  ✓ consent_explicit: {len(consent_explicit)}")
    print(f"  ✓ consent_implied: {len(consent_implied)}")
    print(f"  ✓ data_collection_minimal: {len(data_collection_minimal)}")
    print(f"\nWrote to: {output_path}")
    
    # Show samples
    print("\n" + "="*70)
    print("SAMPLE EXAMPLES")
    print("="*70)
    print("\n[PURPOSE SPECIFIC]")
    for ex in purpose_specific[:3]:
        print(f"  • {ex['text']}")
    print("\n[CONSENT EXPLICIT]")
    for ex in consent_explicit[:3]:
        print(f"  • {ex['text']}")
    print("\n[CONSENT IMPLIED]")
    for ex in consent_implied[:3]:
        print(f"  • {ex['text']}")
    print("\n[DATA COLLECTION MINIMAL]")
    for ex in data_collection_minimal[:3]:
        print(f"  • {ex['text']}")


if __name__ == "__main__":
    main()
