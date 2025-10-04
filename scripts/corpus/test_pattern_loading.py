#!/usr/bin/env python3
"""Test script to validate pattern YAML files load correctly.

Usage:
    python scripts/corpus/test_pattern_loading.py
"""

from pathlib import Path
import sys

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

from scripts.corpus.build_category_dataset import (
    get_patterns_for_category,
    load_patterns_from_yaml,
)

PRIORITY_CATEGORIES = [
    "dispute_resolution",
    "data_collection",  # Note: file is data_collection.yaml
    "user_privacy",
]

# Test texts for each category
TEST_CASES = {
    "dispute_resolution": {
        "binding_arbitration": "Any disputes shall be resolved through binding arbitration under AAA rules.",
        "class_action_waiver": "You agree to resolve disputes on an individual basis and waive class action rights.",
        "jury_trial_waiver": "Both parties waive the right to a jury trial.",
        "venue_selection": "Exclusive venue shall be in the courts of New York.",
    },
    "data_collection": {
        "data_collection_extensive": "We collect personal information including location, browsing history, and third-party data.",
        "consent_explicit": "You must opt in to our data collection practices.",
        "purpose_broad": "We may use your information for any lawful purpose.",
    },
    "user_privacy": {
        "retention_disclosed": "We retain personal data for 12 months after account closure.",
        "deletion_offered": "You have the right to request deletion of your personal data.",
        "access_rights": "You can access and download a copy of your personal information.",
        "privacy_waiver": "You waive any expectation of privacy in communications.",
    },
}


def main():
    print("=" * 80)
    print("Pattern YAML Loading Test")
    print("=" * 80)
    
    all_passed = True
    
    for category in PRIORITY_CATEGORIES:
        print(f"\n{'=' * 80}")
        print(f"Testing: {category}")
        print("=" * 80)
        
        # Load patterns
        patterns = load_patterns_from_yaml(category)
        
        if not patterns:
            print(f"❌ FAILED: No patterns loaded for {category}")
            all_passed = False
            continue
        
        print(f"✅ Loaded {len(patterns)} labels:")
        for label_name, pattern_list in patterns.items():
            print(f"   - {label_name}: {len(pattern_list)} patterns")
        
        # Test pattern matching
        test_cases = TEST_CASES.get(category, {})
        if test_cases:
            print(f"\nPattern Matching Tests:")
            for label, test_text in test_cases.items():
                if label in patterns:
                    matched = False
                    for pattern in patterns[label]:
                        if pattern.search(test_text):
                            matched = True
                            break
                    
                    if matched:
                        print(f"   ✅ {label}: matched")
                    else:
                        print(f"   ⚠️  {label}: no match (test: '{test_text[:50]}...')")
                else:
                    print(f"   ⚠️  {label}: not in loaded patterns")
    
    print(f"\n{'=' * 80}")
    if all_passed:
        print("✅ All pattern files loaded successfully!")
    else:
        print("❌ Some pattern files failed to load")
        sys.exit(1)
    print("=" * 80)


if __name__ == "__main__":
    main()
