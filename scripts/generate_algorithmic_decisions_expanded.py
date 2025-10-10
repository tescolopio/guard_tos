#!/usr/bin/env python3
"""Generate expanded synthetic examples for algorithmic_decisions category."""

import argparse
import json
import math
import random
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple


LABELS = [
    "automated_decision",
    "human_review",
    "transparency_statement",
]

SYNTHETIC_SOURCE = "synthetic_algorithmic_decisions_v2025.10.12"
CATEGORY = "algorithmic_decisions"
DEFAULT_OUTPUT_PATH = Path("data/aug/algorithmic_decisions/v2025.10.12/synthetic_targeted.jsonl")
DEFAULT_LABEL_COUNTS: Dict[str, int] = {
    "automated_decision": 180,
    "human_review": 90,
    "transparency_statement": 90,
}

Record = Dict[str, object]


def make_label_dict(target_label: str) -> Dict[str, float]:
    """Return a one-hot mapping for algorithmic decision labels."""

    return {label: 1.0 if label == target_label else 0.0 for label in LABELS}


def make_record(
    *,
    text: str,
    target_label: str,
    source: str,
    notes: Optional[str],
    category: str = CATEGORY,
) -> Record:
    record: Record = {
        "text": text,
        "labels": make_label_dict(target_label),
        "source": source,
        "category": category,
    }
    if notes:
        record["notes"] = notes
    return record


def make_negative_record(
    *,
    text: str,
    source: str,
    notes: Optional[str],
    category: str = CATEGORY,
) -> Record:
    record: Record = {
        "text": text,
        "labels": {label: 0.0 for label in LABELS},
        "source": source,
        "category": category,
    }
    if notes:
        record["notes"] = notes
    return record


def write_jsonl(path: Path, records: List[Record]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")


def load_jsonl(path: Path) -> List[Record]:
    with path.open("r", encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def dedupe_records(records: List[Record]) -> List[Record]:
    seen: set[str] = set()
    deduped: List[Record] = []
    for record in records:
        text = record.get("text")
        if not isinstance(text, str):
            raise ValueError("Each record must include text")
        normalized = text.strip()
        if normalized in seen:
            continue
        seen.add(normalized)
        deduped.append(record)
    return deduped


def parse_label_counts(specs: Optional[List[str]]) -> Dict[str, int]:
    if not specs:
        return dict(DEFAULT_LABEL_COUNTS)

    counts: Dict[str, int] = {}
    for raw in specs:
        if "=" not in raw:
            raise SystemExit(f"Expected LABEL=COUNT but received '{raw}'")
        label, value = raw.split("=", 1)
        label = label.strip()
        if label not in LABELS:
            raise SystemExit(f"Unknown label '{label}'. Known labels: {', '.join(LABELS)}")
        try:
            count = int(value)
        except ValueError as exc:
            raise SystemExit(f"Count for {label} must be an integer (got '{value}')") from exc
        if count < 0:
            raise SystemExit("Counts must be non-negative")
        counts[label] = count

    for label, default_count in DEFAULT_LABEL_COUNTS.items():
        counts.setdefault(label, default_count)

    return counts

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
    "Our automated enforcement pipeline may {enforcement_action} {enforcement_target} without manual review.",
    "Risk scoring models automatically {risk_action} {risk_target} using behavioral signals.",
    "The service runs continuous machine learning assessments that {enforcement_action} {enforcement_target}.",
    "Automated classifiers {risk_action} {risk_target} to uphold community and safety standards.",
    "AI moderation queues automatically {enforcement_action} {enforcement_target} once thresholds are met.",
]

AUTOMATED_DECISION_REGULATED_CONTEXTS = [
    "Credit scoring pipelines automatically approve or decline applications under Fair Credit Reporting Act workflows.",
    "Employment screening algorithms auto-issue eligibility determinations aligned with EEOC guidance.",
    "Fraud detection engines automatically block high-risk transactions flagged by Bank Secrecy Act scenarios.",
    "Content moderation stacks auto-remove posts and suspend accounts to comply with trust and safety policies.",
    "Risk scoring services automatically escalate accounts for enhanced due diligence under AML programs.",
    "Ride safety systems auto-deactivate drivers when telematics models identify hazardous behavior.",
    "Advertising review models auto-reject creatives that breach platform integrity standards.",
]

AUTOMATED_DECISION_LEGAL_SENTENCES = [
    "These automated decisions may fall under GDPR Article 22 and equivalent jurisdictional rules.",
    "We provide adverse action notices in line with FCRA when a model denies a credit request.",
    "ICO and FTC guidance on automated enforcement inform our governance controls.",
    "We align with CFPB expectations for algorithmic lending decisions and maintain audit logs.",
    "Regulated workflows include bias monitoring and fairness reviews before deployment.",
]

AUTOMATED_DECISION_OUTCOME_SENTENCES = [
    "Outcomes are delivered instantly via in-product notifications and follow-up email notices.",
    "Decisions trigger automated messaging and appeal options in your account dashboard.",
    "We log each automated outcome for regulator review and internal auditing.",
    "Audit trails capture the features used so our privacy office can investigate challenges.",
]

AUTOMATED_DECISION_NEGATIVE_TEMPLATES = [
    "Our analytics provide risk scores to advisers, but a human makes the final determination.",
    "Algorithms surface recommendations only; staff must approve any enforcement actions.",
    "We use automated tools for triage while manual reviewers decide the ultimate outcome.",
    "Machine scoring highlights suspicious activity, yet account suspensions require human oversight.",
    "Predictive models prioritize cases for analysts instead of issuing binding decisions.",
    "Our system explains factors but leaves eligibility determinations to trained personnel.",
]

# === TRANSPARENCY HARD NEGATIVES (Phase 2) ===
# These templates mimic transparency statements that mention algorithms
# but do NOT constitute automated decisions (target false positive patterns)
TRANSPARENCY_HARD_NEGATIVE_TEMPLATES = [
    "We aim to be transparent about how our algorithmic systems work.",
    "We explain how our algorithms process information: they analyze {factor1} and {factor2}.",
    "Our algorithmic models consider inputs like {factor1}, {factor2}, and {factor3}.",
    "The automated system relies on criteria including {factor1} and {factor2}.",
    "We are committed to transparency regarding our use of {factor1} and {factor2} in automated systems.",
    "Our platform provides information about how algorithms analyze {factor1} and {factor2}.",
    "We disclose that our systems process {factor1}, {factor2}, and {factor3} algorithmically.",
    "The service is transparent about algorithmic analysis of {factor1} and {factor2}.",
    "We inform users that our algorithms consider {factor1}, {factor2}, and other signals.",
    "Our transparency practices include explaining how algorithms use {factor1} and {factor2}.",
    "We document how our automated systems analyze {factor1}, {factor2}, and {factor3}.",
    "The platform shares details about algorithmic processing of {factor1} and {factor2}.",
    "We are open about our algorithms' use of {factor1}, {factor2}, and similar factors.",
    "Our systems use algorithms to analyze {factor1} and {factor2} for informational purposes.",
    "We publish information on how automated tools process {factor1}, {factor2}, and {factor3}.",
    "The service explains that algorithms help sort content based on {factor1} and {factor2}.",
    "We provide transparency reports describing algorithmic use of {factor1} and {factor2}.",
    "Our platform clarifies how automated systems categorize {factor1} and {factor2}.",
    "We are transparent: algorithms analyze {factor1}, {factor2}, and {factor3} to provide suggestions.",
    "The service shares how automated tools organize {factor1} and {factor2} for display purposes.",
    # Emphasis on "help," "assist," "support" (no decisional language)
    "Algorithms help us organize {factor1} and {factor2} to improve user experience.",
    "Our automated systems assist in categorizing {factor1}, {factor2}, and {factor3}.",
    "We use algorithms to support ranking based on {factor1} and {factor2}.",
    "Automated tools help process {factor1} and {factor2} for presentation purposes.",
    "Our systems use algorithms to assist with sorting {factor1}, {factor2}, and {factor3}.",
    # Explicit non-decision language
    "While algorithms analyze {factor1} and {factor2}, all final decisions require human review.",
    "Our systems process {factor1} and {factor2} algorithmically, but humans make the decisions.",
    "Algorithms evaluate {factor1}, {factor2}, and {factor3} to provide recommendations only.",
    "We use automated analysis of {factor1} and {factor2}, though decisions remain manual.",
    "Our platform employs algorithms for {factor1} and {factor2} analysis without automated enforcement.",
    # General transparency/explainability statements
    "We believe in algorithmic transparency and explain our use of {factor1} and {factor2}.",
    "The service is committed to explaining how automated processes handle {factor1}.",
    "Our transparency initiatives include documentation of algorithmic {factor1} analysis.",
    "We publish regular reports on how algorithms process {factor1}, {factor2}, and {factor3}.",
    "The platform provides users with information about algorithmic use of {factor1} and {factor2}.",
    # Mentions "automated" or "algorithm" with neutral/informational verbs
    "Our automated systems collect {factor1} and {factor2} for analysis purposes.",
    "Algorithms monitor {factor1}, {factor2}, and {factor3} to generate insights.",
    "We use automated tools to track {factor1} and {factor2} for reporting.",
    "Our systems algorithmically index {factor1}, {factor2}, and {factor3}.",
    "The service uses algorithms to organize {factor1} and {factor2} in search results.",
    # Meta-statements about policy/approach (not actual decisions)
    "We are developing new transparency standards for algorithmic processing of {factor1}.",
    "Our approach to algorithmic accountability involves explaining {factor1} and {factor2} usage.",
    "The platform is committed to responsible use of algorithms analyzing {factor1}.",
    "We follow best practices for transparent algorithmic handling of {factor1} and {factor2}.",
    "Our governance framework addresses algorithmic processing of {factor1}, {factor2}, and {factor3}.",
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
    "You may request a {role} to review automated outcomes by contacting our {channel}.",
    "Submit an appeal via the {channel} within {timeframe} to trigger manual intervention.",
    "We escalate contested automated decisions to our {role} team when you {appeal_action}.",
    "Reach out to the {channel} if you want a {role} to revisit the automated decision.",
    "Human oversight is available: {appeal_action} within {timeframe} and our {role} will respond.",
    "Manual review can be requested from our {role} group through the {channel}.",
    "Open a case in the {channel} so a {role} can assess the automated determination.",
    "Appeal an algorithmic decision by {appeal_action}; a {role} will complete the review.",
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

ENFORCEMENT_ACTIONS = [
    "flag",
    "suspend",
    "restrict",
    "deprioritize",
    "limit",
    "remove",
    "escalate",
]

RISK_ACTIONS = [
    "score",
    "evaluate",
    "classify",
    "screen",
    "categorize",
    "triage",
]

ENFORCEMENT_TARGETS = [
    "user content",
    "account access",
    "account status",
    "profile visibility",
    "feature availability",
    "recommendation placement",
    "advertising eligibility",
    "transaction approvals",
]

RISK_TARGETS = [
    "account risk profiles",
    "incoming transactions",
    "new registrations",
    "content submissions",
    "payment attempts",
    "user sessions",
]

HUMAN_REVIEW_CHANNELS = [
    "support portal",
    "privacy inbox",
    "compliance hotline",
    "account dashboard",
    "help center",
    "in-product appeal form",
    "appeals center",
    "trust and safety queue",
    "compliance request form",
]

HUMAN_REVIEW_ROLES = [
    "compliance specialist",
    "support agent",
    "appeals moderator",
    "risk analyst",
    "trust and safety reviewer",
    "customer care specialist",
    "policy specialist",
    "appeals coordinator",
    "trust escalation agent",
]

HUMAN_REVIEW_TIMEFRAMES = [
    "14 days",
    "30 days",
    "45 days",
    "7 days",
    "10 business days",
    "21 days",
    "60 days",
    "5 business days",
]

HUMAN_REVIEW_ACTIONS = [
    "submit a support ticket",
    "complete the appeals form",
    "email our appeals team",
    "contact customer care",
    "open a case in the dashboard",
    "submit an appeal ticket",
    "chat with the support team",
    "upload the appeal documentation",
    "call the compliance hotline",
]

HUMAN_REVIEW_SUFFIXES = [
    " Contact our {channel} within {timeframe} for manual escalation by a {role}.",
    " {appeal_action_cap} and our {role} will respond within {timeframe}.",
    " Our {role} team monitors the {channel} to assist with appeals.",
    " Reach the {channel} so a {role} can complete the review.",
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


def generate_automated_decision_examples(
    count: int,
    rng: random.Random,
    source: str,
    notes: Optional[str],
) -> List[Record]:
    """Generate synthetic automated_decision examples."""

    examples: List[Record] = []

    for _ in range(count):
        template = rng.choice(AUTOMATED_DECISION_TEMPLATES)
        base = template.format(
            action=rng.choice(ACTIONS),
            action_gerund=rng.choice(ACTIONS_GERUND),
            target=rng.choice(TARGETS),
            enforcement_action=rng.choice(ENFORCEMENT_ACTIONS),
            risk_action=rng.choice(RISK_ACTIONS),
            enforcement_target=rng.choice(ENFORCEMENT_TARGETS),
            risk_target=rng.choice(RISK_TARGETS),
        )

        context_sentence = rng.choice(AUTOMATED_DECISION_REGULATED_CONTEXTS)
        legal_sentence = rng.choice(AUTOMATED_DECISION_LEGAL_SENTENCES)
        outcome_sentence = rng.choice(AUTOMATED_DECISION_OUTCOME_SENTENCES)

        text = " ".join([base, context_sentence, legal_sentence, outcome_sentence])

        examples.append(
            make_record(
                text=text,
                target_label="automated_decision",
                source=source,
                notes=notes,
            )
        )

    return examples


def generate_human_review_examples(
    count: int,
    rng: random.Random,
    source: str,
    notes: Optional[str],
) -> List[Record]:
    """Generate synthetic human_review examples."""

    examples: List[Record] = []

    for _ in range(count):
        template = rng.choice(HUMAN_REVIEW_TEMPLATES)
        example = template.format(
            channel=rng.choice(HUMAN_REVIEW_CHANNELS),
            role=rng.choice(HUMAN_REVIEW_ROLES),
            timeframe=rng.choice(HUMAN_REVIEW_TIMEFRAMES),
            appeal_action=rng.choice(HUMAN_REVIEW_ACTIONS),
        )

        if HUMAN_REVIEW_SUFFIXES and rng.random() < 0.7:
            suffix_channel = rng.choice(HUMAN_REVIEW_CHANNELS)
            suffix_role = rng.choice(HUMAN_REVIEW_ROLES)
            suffix_timeframe = rng.choice(HUMAN_REVIEW_TIMEFRAMES)
            suffix_action = rng.choice(HUMAN_REVIEW_ACTIONS)
            suffix = rng.choice(HUMAN_REVIEW_SUFFIXES).format(
                channel=suffix_channel,
                role=suffix_role,
                timeframe=suffix_timeframe,
                appeal_action=suffix_action,
                appeal_action_cap=suffix_action[0].upper() + suffix_action[1:],
            )
            example = example + suffix

        examples.append(
            make_record(
                text=example,
                target_label="human_review",
                source=source,
                notes=notes,
            )
        )

    return examples


def generate_transparency_examples(
    count: int,
    rng: random.Random,
    source: str,
    notes: Optional[str],
) -> List[Record]:
    """Generate synthetic transparency_statement examples."""

    examples: List[Record] = []

    for _ in range(count):
        template = rng.choice(TRANSPARENCY_TEMPLATES)

        factors = rng.sample(TRANSPARENCY_FACTORS, 3)

        example = template.format(
            factor1=factors[0],
            factor2=factors[1],
            factor3=factors[2] if "{factor3}" in template else "",
        )

        examples.append(
            make_record(
                text=example,
                target_label="transparency_statement",
                source=source,
                notes=notes,
            )
        )

    return examples


def generate_automated_decision_negatives(
    count: int,
    rng: random.Random,
    source: str,
    notes: Optional[str],
) -> List[Record]:
    """Generate contrastive negatives for automated decisions."""

    negatives: List[Record] = []
    for _ in range(count):
        template = rng.choice(AUTOMATED_DECISION_NEGATIVE_TEMPLATES)
        text = template
        negatives.append(
            make_negative_record(
                text=text,
                source=source,
                notes=notes,
            )
        )

    return negatives


def generate_transparency_hard_negatives(
    count: int,
    rng: random.Random,
    source: str,
    notes: Optional[str],
) -> List[Record]:
    """Generate hard negatives: transparency statements that mention algorithms but aren't decisions.
    
    These target the false positive pattern where the model confuses transparency
    statements about algorithms with actual automated decision-making.
    """

    negatives: List[Record] = []
    for _ in range(count):
        template = rng.choice(TRANSPARENCY_HARD_NEGATIVE_TEMPLATES)
        
        # Fill in factor placeholders if present
        if "{factor" in template:
            factors = rng.sample(TRANSPARENCY_FACTORS, 3)
            text = template.format(
                factor1=factors[0],
                factor2=factors[1],
                factor3=factors[2],
            )
        else:
            text = template
            
        negatives.append(
            make_negative_record(
                text=text,
                source=source,
                notes=notes,
            )
        )

    return negatives


GENERATOR_REGISTRY: Dict[str, Callable[[int, random.Random, str, Optional[str]], List[Record]]] = {
    "automated_decision": generate_automated_decision_examples,
    "human_review": generate_human_review_examples,
    "transparency_statement": generate_transparency_examples,
}

NEGATIVE_GENERATOR_REGISTRY: Dict[str, Callable[[int, random.Random, str, Optional[str]], List[Record]]] = {
    "automated_decision": generate_automated_decision_negatives,
    "transparency_hard_negative": generate_transparency_hard_negatives,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_PATH,
        help="Destination for positive examples (default: %(default)s)",
    )
    parser.add_argument(
        "--label",
        action="append",
        dest="labels",
        metavar="LABEL=COUNT",
        help="Override default count for a label (repeatable)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed (default: %(default)s)",
    )
    parser.add_argument(
        "--source",
        type=str,
        default=SYNTHETIC_SOURCE,
        help="Source string recorded with generated examples",
    )
    parser.add_argument(
        "--notes",
        type=str,
        default="",
        help="Optional provenance notes",
    )
    parser.add_argument(
        "--emit-negatives",
        action="store_true",
        help="Generate contrastive negatives for automated_decision",
    )
    parser.add_argument(
        "--negative-ratio",
        type=float,
        default=0.3,
        help="Multiplier applied to automated_decision positives for negatives (default: %(default)s)",
    )
    parser.add_argument(
        "--emit-transparency-hard-negatives",
        action="store_true",
        help="Generate transparency hard negatives (statements mentioning algorithms but not decisions)",
    )
    parser.add_argument(
        "--transparency-hard-negative-count",
        type=int,
        default=150,
        help="Number of transparency hard negatives to generate (default: %(default)s)",
    )
    parser.add_argument(
        "--negatives-output",
        type=Path,
        help="Optional override path for negative examples",
    )
    parser.add_argument(
        "--extra-jsonl",
        action="append",
        type=Path,
        default=[],
        help="Additional JSONL files to append to the positive set",
    )
    parser.add_argument(
        "--extra-negative-jsonl",
        action="append",
        type=Path,
        default=[],
        help="Additional JSONL files to append to the negative set",
    )
    parser.add_argument(
        "--no-dedupe",
        action="store_true",
        help="Skip deduplication of generated text",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview generation without writing outputs",
    )
    return parser.parse_args()


def build_examples(
    label_counts: Dict[str, int],
    *,
    rng: random.Random,
    source: str,
    notes: Optional[str],
    include_negatives: bool,
    negative_ratio: float,
    include_transparency_hard_negatives: bool,
    transparency_hard_negative_count: int,
    negative_source_suffix: str = "_hard_negative",
) -> Tuple[List[Record], List[Record], Dict[str, int]]:
    positives: List[Record] = []
    negatives: List[Record] = []
    summary: Dict[str, int] = {}

    for label, count in label_counts.items():
        generator = GENERATOR_REGISTRY.get(label)
        if generator is None:
            raise SystemExit(f"No generator registered for {label}")
        if count <= 0:
            summary[label] = 0
            continue
        generated = generator(count, rng, source, notes)
        summary[label] = len(generated)
        positives.extend(generated)

    if include_negatives:
        negative_source = f"{source}{negative_source_suffix}"
        for label, count in label_counts.items():
            generator = NEGATIVE_GENERATOR_REGISTRY.get(label)
            if generator is None or count <= 0:
                continue
            target_count = max(1, math.ceil(count * negative_ratio)) if negative_ratio > 0 else 0
            if target_count == 0:
                continue
            label_notes = f"contrastive_negative_for={label}"
            if notes:
                label_notes = f"{label_notes}; {notes}"
            negatives.extend(generator(target_count, rng, negative_source, label_notes))

    if include_transparency_hard_negatives:
        transparency_negative_source = f"{source}_transparency_hard_negative"
        transparency_generator = NEGATIVE_GENERATOR_REGISTRY.get("transparency_hard_negative")
        if transparency_generator and transparency_hard_negative_count > 0:
            transparency_notes = "hard_negative_for=automated_decision; targets FP pattern: transparency statements"
            if notes:
                transparency_notes = f"{transparency_notes}; {notes}"
            negatives.extend(
                transparency_generator(
                    transparency_hard_negative_count,
                    rng,
                    transparency_negative_source,
                    transparency_notes,
                )
            )

    return positives, negatives, summary


def main() -> None:
    args = parse_args()
    label_counts = parse_label_counts(args.labels)
    notes = args.notes if args.notes else None

    rng = random.Random(args.seed)

    positives, negatives, summary = build_examples(
        label_counts,
        rng=rng,
        source=args.source,
        notes=notes,
        include_negatives=args.emit_negatives,
        negative_ratio=args.negative_ratio,
        include_transparency_hard_negatives=args.emit_transparency_hard_negatives,
        transparency_hard_negative_count=args.transparency_hard_negative_count,
    )

    for extra_path in args.extra_jsonl:
        if not extra_path.exists():
            print(f"Warning: extra JSONL {extra_path} not found; skipping")
            continue
        positives.extend(load_jsonl(extra_path))

    for extra_negative_path in args.extra_negative_jsonl:
        if not extra_negative_path.exists():
            print(f"Warning: extra negative JSONL {extra_negative_path} not found; skipping")
            continue
        negatives.extend(load_jsonl(extra_negative_path))

    if not args.no_dedupe:
        positives = dedupe_records(positives)
        negatives = dedupe_records(negatives)

    total = len(positives)
    negative_total = len(negatives)

    print("Summary:")
    for label, count in summary.items():
        print(f"  • {label}: {count}")
    print(f"  • total positives: {total}")
    if args.emit_negatives or args.emit_transparency_hard_negatives:
        print(f"  • total negatives: {negative_total}")

    if args.dry_run:
        print("Dry run enabled; skipping file writes")
        return

    write_jsonl(args.output, positives)
    print(f"Wrote {total} positive examples to {args.output}")

    if (args.emit_negatives or args.emit_transparency_hard_negatives) and negative_total:
        if args.negatives_output is not None:
            negatives_path = args.negatives_output
        else:
            negatives_dir = args.output.parent / "hard_negatives"
            negatives_dir.mkdir(parents=True, exist_ok=True)
            negatives_path = negatives_dir / f"{args.output.stem}_negatives.jsonl"
        write_jsonl(negatives_path, negatives)
        print(f"Wrote {negative_total} negative examples to {negatives_path}")
    elif args.negatives_output:
        print("No negative examples generated; negatives output path ignored")


if __name__ == "__main__":
    main()
