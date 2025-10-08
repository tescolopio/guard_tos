#!/usr/bin/env python3
"""Generate expanded synthetic examples for algorithmic_decisions category."""

import json
import random
from pathlib import Path
from typing import List


# === AUTOMATED DECISION TEMPLATES ===
AUTOMATED_DECISION_TEMPLATES = [
    "We use automated systems to {action} {target}.",
    "Our platform employs algorithmic decision-making to {action} {target}.",
    "Automated processing is used to {action} {target}.",
    "Machine learning algorithms {action} {target}.",
    "AI systems automatically {action} {target}.",
    "Content decisions may be made automatically without human review.",
    "Our algorithms determine {target} based on various factors.",
    "Automated systems analyze and {action} {target}.",
    "We utilize artificial intelligence to {action} {target}.",
    "Algorithmic processes {action} {target}.",
    "Your {target} may be subject to automated decision-making.",
    "We apply automated systems for {action_gerund} {target}.",
    "The service uses AI to {action} {target}.",
    "Automated evaluation is employed to {action} {target}.",
    "Our system automatically processes and {action}s {target}.",
    "Machine learning models determine {target} without human intervention.",
    "Algorithmic tools are used to {action} {target}.",
    "We rely on automated systems for {action_gerund} {target}.",
    "Decisions about {target} are made algorithmically.",
    "AI-powered systems {action} {target} automatically.",
]

# === HUMAN REVIEW TEMPLATES ===
HUMAN_REVIEW_TEMPLATES = [
    "You have the right to request human review of automated decisions affecting your account.",
    "Users may appeal algorithmic decisions and obtain manual review.",
    "If you disagree with an automated decision, you can request human intervention.",
    "Human review is available upon request for all automated determinations.",
    "You can challenge any algorithmic decision by contacting support for manual review.",
    "We provide the option to appeal automated decisions to a human reviewer.",
    "Users may request that automated content decisions be reviewed by staff.",
    "If an AI system made a decision about your content, you may ask for human oversight.",
    "Manual review by trained personnel is available for any automated determination.",
    "You can contest automated decisions by requesting human review within 30 days.",
    "We offer human intervention for decisions made by automated systems.",
    "You have the right to challenge algorithmic determinations through human review.",
    "Users can request manual evaluation of any AI-based decision.",
    "Human oversight is provided upon request for automated processing decisions.",
    "You may appeal to a human moderator if you disagree with automated actions.",
    "We guarantee the right to human review of algorithmically-made determinations.",
    "You can ask for a person to review decisions made by our automated systems.",
    "Human reconsideration is available for all automated account decisions.",
    "Users have the right to object to automated decisions and request manual review.",
    "We provide human review as an alternative to purely algorithmic determinations.",
]

# === TRANSPARENCY STATEMENT TEMPLATES ===
TRANSPARENCY_TEMPLATES = [
    "Our algorithm considers factors such as {factor1}, {factor2}, and {factor3}.",
    "We aim to be transparent about how our algorithmic systems work.",
    "The automated system relies on criteria including {factor1} and {factor2}.",
    "Our AI uses signals like {factor1}, {factor2}, and {factor3} to make determinations.",
    "We explain how our algorithms process information: they analyze {factor1} and {factor2}.",
    "The system takes into account multiple factors such as {factor1}, {factor2}, and user history.",
    "Our algorithmic decision-making is based on {factor1}, {factor2}, and other relevant data.",
    "We provide transparency regarding our automated systems, which consider {factor1} and {factor2}.",
    "The platform's algorithm evaluates {factor1}, {factor2}, and {factor3} when making decisions.",
    "Our AI systems use various criteria including {factor1}, {factor2}, and engagement patterns.",
    "We disclose that our algorithms analyze {factor1}, {factor2}, and {factor3}.",
    "The automated system weighs factors such as {factor1} and {factor2}.",
    "Our algorithmic models consider inputs like {factor1}, {factor2}, and {factor3}.",
    "We are transparent about our AI's use of {factor1}, {factor2}, and similar signals.",
    "The algorithm processes {factor1}, {factor2}, and {factor3} to reach decisions.",
    "Our system's automated logic relies on {factor1} and {factor2}.",
    "We inform users that our algorithms factor in {factor1}, {factor2}, and {factor3}.",
    "The AI evaluates {factor1}, {factor2}, and additional contextual information.",
    "Our automated decision-making considers {factor1}, {factor2}, and {factor3}.",
    "We explain that algorithms use {factor1} and {factor2} among other criteria.",
]

# === TEMPLATE VARIABLES ===
ACTIONS = [
    "moderate",
    "evaluate",
    "assess",
    "review",
    "analyze",
    "determine",
    "process",
    "rank",
    "filter",
    "classify",
    "score",
    "prioritize",
    "recommend",
    "select"
]

ACTIONS_GERUND = [
    "moderating",
    "evaluating",
    "assessing",
    "reviewing",
    "analyzing",
    "determining",
    "processing",
    "ranking",
    "filtering",
    "classifying",
    "scoring",
    "prioritizing"
]

TARGETS = [
    "user content",
    "account eligibility",
    "pricing",
    "service availability",
    "content visibility",
    "recommendations",
    "user behavior",
    "risk assessments",
    "spam detection",
    "content moderation decisions",
    "account status",
    "access permissions",
    "content recommendations",
    "search results",
    "feed ranking",
    "policy violations",
    "content quality",
    "user engagement",
    "account verification",
    "fraud detection"
]

TRANSPARENCY_FACTORS = [
    "user engagement",
    "content quality",
    "community standards compliance",
    "previous behavior patterns",
    "account age",
    "interaction history",
    "violation reports",
    "spam indicators",
    "authenticity signals",
    "user preferences",
    "safety considerations",
    "regulatory compliance",
    "relevance scores",
    "click-through rates",
    "content freshness",
    "source credibility",
    "user reputation",
    "temporal patterns",
    "geographic signals",
    "device information"
]


def generate_automated_decision_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic automated_decision examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(AUTOMATED_DECISION_TEMPLATES)
        
        example = template.format(
            action=rng.choice(ACTIONS),
            action_gerund=rng.choice(ACTIONS_GERUND),
            target=rng.choice(TARGETS),
        )
        
        examples.append({
            "text": example,
            "labels": ["automated_decision"],
            "source": "synthetic_expanded",
            "category": "algorithmic_decisions",
        })
    
    return examples


def generate_human_review_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic human_review examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(HUMAN_REVIEW_TEMPLATES)
        example = template  # No variable substitution needed
        
        examples.append({
            "text": example,
            "labels": ["human_review"],
            "source": "synthetic_expanded",
            "category": "algorithmic_decisions",
        })
    
    return examples


def generate_transparency_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic transparency_statement examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(TRANSPARENCY_TEMPLATES)
        
        # Sample 3 unique factors
        factors = rng.sample(TRANSPARENCY_FACTORS, 3)
        
        example = template.format(
            factor1=factors[0],
            factor2=factors[1],
            factor3=factors[2] if "{factor3}" in template else "",
        )
        
        examples.append({
            "text": example,
            "labels": ["transparency_statement"],
            "source": "synthetic_expanded",
            "category": "algorithmic_decisions",
        })
    
    return examples


def main():
    """Generate expanded synthetic examples for algorithmic decisions."""
    rng = random.Random(42)
    
    # Generate balanced examples (67-66 per label = 200 total)
    print("Generating expanded synthetic examples for algorithmic_decisions...")
    
    automated_decision = generate_automated_decision_examples(67, rng)
    human_review = generate_human_review_examples(67, rng)
    transparency = generate_transparency_examples(66, rng)
    
    all_examples = automated_decision + human_review + transparency
    
    # Write to file
    output_path = Path("data/corpus/algorithmic_decisions_synthetic_expanded.jsonl")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with output_path.open("w") as f:
        for ex in all_examples:
            f.write(json.dumps(ex) + "\n")
    
    print(f"\nGenerated {len(all_examples)} total examples:")
    print(f"  ✓ automated_decision: {len(automated_decision)}")
    print(f"  ✓ human_review: {len(human_review)}")
    print(f"  ✓ transparency_statement: {len(transparency)}")
    print(f"\nWrote to: {output_path}")
    
    # Show samples
    print("\n" + "="*70)
    print("SAMPLE EXAMPLES")
    print("="*70)
    print("\n[AUTOMATED DECISION]")
    for ex in automated_decision[:3]:
        print(f"  • {ex['text']}")
    print("\n[HUMAN REVIEW]")
    for ex in human_review[:3]:
        print(f"  • {ex['text']}")
    print("\n[TRANSPARENCY STATEMENT]")
    for ex in transparency[:3]:
        print(f"  • {ex['text']}")


if __name__ == "__main__":
    main()
