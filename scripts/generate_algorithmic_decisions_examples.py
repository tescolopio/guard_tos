#!/usr/bin/env python3
"""Generate synthetic examples for algorithmic_decisions category."""

import json
from pathlib import Path

# Templates for automated_decision label
AUTOMATED_DECISION_TEMPLATES = [
    "Our platform uses automated systems to {action} {target}.",
    "We employ algorithmic decision-making to {action} {target}.",
    "Automated processing may be used to {action} {target}.",
    "Machine learning algorithms help us {action} {target}.",
    "AI systems automatically {action} {target}.",
    "Content decisions may be made automatically without human review.",
    "Our algorithms determine {target} based on various factors.",
    "Automated systems process and evaluate {target}.",
    "We use artificial intelligence to {action} {target}.",
    "Algorithmic systems analyze and {action} {target}.",
]

AUTOMATED_ACTIONS = [
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
]

AUTOMATED_TARGETS = [
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
]

# Templates for human_review label
HUMAN_REVIEW_TEMPLATES = [
    "You have the right to request human review of automated decisions affecting your account.",
    "Users may appeal algorithmic decisions and obtain manual review by our staff.",
    "If you disagree with an automated decision, you can request human intervention.",
    "Human review is available upon request for all automated determinations.",
    "You can challenge any algorithmic decision by contacting our support team for manual review.",
    "We provide the option to appeal automated decisions to a human reviewer.",
    "Users may request that automated content moderation decisions be reviewed by staff.",
    "If an AI system made a decision about your content, you may ask for human oversight.",
    "Manual review by trained personnel is available for any automated determination.",
    "You can contest automated decisions by requesting human review within 30 days.",
]

# Templates for transparency_statement label  
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
]

TRANSPARENCY_FACTORS = [
    "user engagement",
    "content quality",
    "community standards",
    "previous behavior",
    "account age",
    "interaction history",
    "violation reports",
    "spam indicators",
    "authenticity signals",
    "user preferences",
    "safety considerations",
    "regulatory compliance",
]


def generate_examples():
    """Generate synthetic examples for all labels."""
    examples = []
    
    # Generate automated_decision examples
    for template in AUTOMATED_DECISION_TEMPLATES:
        if "{action}" in template and "{target}" in template:
            for action in AUTOMATED_ACTIONS[:3]:  # Use 3 actions per template
                for target in AUTOMATED_TARGETS[:1]:  # Use 1 target per action
                    text = template.format(action=action, target=target)
                    examples.append({
                        "text": text,
                        "labels": ["automated_decision"],
                        "source": "synthetic",
                        "category": "algorithmic_decisions"
                    })
        else:
            examples.append({
                "text": template,
                "labels": ["automated_decision"],
                "source": "synthetic",
                "category": "algorithmic_decisions"
            })
    
    # Generate human_review examples
    for template in HUMAN_REVIEW_TEMPLATES:
        examples.append({
            "text": template,
            "labels": ["human_review"],
            "source": "synthetic",
            "category": "algorithmic_decisions"
        })
    
    # Generate transparency_statement examples
    import itertools
    factor_combos = list(itertools.combinations(TRANSPARENCY_FACTORS, 3))[:10]  # Get 10 combinations
    
    for i, template in enumerate(TRANSPARENCY_TEMPLATES):
        factors = factor_combos[i % len(factor_combos)]
        if "{factor1}" in template:
            text = template.format(
                factor1=factors[0],
                factor2=factors[1],
                factor3=factors[2] if "{factor3}" in template else ""
            )
        else:
            text = template
        
        examples.append({
            "text": text,
            "labels": ["transparency_statement"],
            "source": "synthetic",
            "category": "algorithmic_decisions"
        })
    
    return examples


def main():
    examples = generate_examples()
    
    # Write to JSONL
    output_path = Path("data/corpus/algorithmic_decisions_synthetic.jsonl")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with output_path.open("w", encoding="utf-8") as f:
        for ex in examples:
            f.write(json.dumps(ex) + "\n")
    
    print(f"Generated {len(examples)} synthetic examples")
    print(f"Wrote to {output_path}")
    
    # Print label counts
    label_counts = {}
    for ex in examples:
        for label in ex["labels"]:
            label_counts[label] = label_counts.get(label, 0) + 1
    
    print("\nLabel distribution:")
    for label, count in sorted(label_counts.items()):
        print(f"  {label}: {count}")


if __name__ == "__main__":
    main()
