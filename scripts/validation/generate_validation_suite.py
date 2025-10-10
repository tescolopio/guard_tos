#!/usr/bin/env python3
"""Generate adversarial validation suite for testing model generalization."""

import json
import random
from pathlib import Path
from typing import Dict, List

# Adversarial transparency statements: mention algorithms/AI but humans decide
ADVERSARIAL_TRANSPARENCY = [
    "Our AI system flags content for review, but all removal decisions are made by trained staff.",
    "Algorithms highlight suspicious activity for investigation, though account actions require human approval.",
    "We use automated risk scoring to prioritize cases for manual review by our compliance team.",
    "Machine learning models surface potential violations, but moderators make the final determination.",
    "Our system automatically identifies patterns, and trained personnel evaluate each case before taking action.",
    "AI tools assist our team in detecting policy breaches, but humans decide whether to enforce consequences.",
    "Automated classifiers recommend actions to reviewers who have final authority over account decisions.",
    "The platform uses algorithms to detect issues, but staff must validate findings before applying penalties.",
    "Our automated system generates alerts for human moderators who determine appropriate responses.",
    "Machine learning helps identify content for review, though removal requires manual confirmation.",
    "AI-powered tools flag accounts for investigation, but specialists make eligibility determinations.",
    "Algorithms analyze behavior patterns to inform reviewers, who retain decision-making authority.",
    "The system automatically categorizes submissions, and trained staff verify before taking action.",
    "We employ automated detection to surface concerns for human evaluation and final judgment.",
    "Our models score risk factors, but account restrictions are imposed only after human review.",
    "AI assists in content triage, though moderators exercise discretion in enforcement decisions.",
    "Automated tools pre-screen applications, but underwriters make final approval determinations.",
    "The platform uses machine learning to identify candidates for review by decision-makers.",
    "Our system flags transactions algorithmically, yet analysts authorize any blocking actions.",
    "AI models classify content, but human reviewers validate classifications before action.",
    "Algorithms provide recommendations to staff who maintain full control over outcomes.",
    "Automated systems detect anomalies, and trained personnel investigate before concluding.",
    "We use AI for initial screening, but specialists conduct final assessments.",
    "Machine learning highlights issues for human consideration and ultimate resolution.",
    "Our automated tools support reviewers who retain exclusive authority over decisions.",
]

# Adversarial automated decisions: describe impacts but avoid explicit "decision" language
ADVERSARIAL_AUTOMATED_DECISIONS = [
    "The system applies account restrictions based on risk scores calculated by our models.",
    "Content visibility may be reduced when our algorithms identify policy concerns.",
    "Your account status reflects automated assessments of compliance with our standards.",
    "Pricing adjustments occur when machine learning models detect eligibility changes.",
    "Access to features depends on algorithmic evaluation of your activity patterns.",
    "Our automated systems adjust recommendations based on behavioral analysis.",
    "Account limitations result from continuous risk monitoring by AI models.",
    "Content placement in feeds follows algorithmic ranking of relevance and safety.",
    "Service availability changes when automated scoring indicates threshold violations.",
    "Your experience adapts based on machine learning classification of preferences.",
    "Feature access varies according to automated assessments of account standing.",
    "Our systems automatically adjust privileges when risk models detect concerning patterns.",
    "Content distribution reflects algorithmic determinations of community standards compliance.",
    "Account capabilities change in response to automated evaluation of user behavior.",
    "Access levels are modified by our systems when algorithms detect policy issues.",
    "Pricing tiers adjust automatically based on AI analysis of usage patterns.",
    "Your account permissions reflect ongoing automated monitoring of activity.",
    "Content reach is influenced by algorithmic scoring of quality and safety signals.",
    "Service features become restricted when our models identify non-compliance.",
    "Account status updates occur through automated processing of behavioral data.",
    "Your access is shaped by machine learning evaluation of risk factors.",
    "Content visibility adapts based on automated classification by our systems.",
    "Feature availability depends on algorithmic assessment of account health.",
    "Service restrictions apply when our automated monitoring detects violations.",
    "Your privileges are adjusted by systems analyzing compliance with our policies.",
]

# Cross-domain examples: same concepts in different industries
CROSS_DOMAIN_BANKING = [
    "Our automated credit decisioning system evaluates applications using machine learning models that analyze credit history, income, and other factors. Decisions are made instantly without human intervention.",
    "The bank employs algorithmic fraud detection that automatically blocks suspicious transactions to protect your account security.",
    "Loan approvals are determined by our AI-powered underwriting system based on creditworthiness assessment algorithms.",
    "Account closures may result from automated risk management processes that flag violations of banking regulations.",
    "Our systems automatically adjust credit limits based on algorithmic evaluation of payment patterns and account usage.",
]

CROSS_DOMAIN_HEALTHCARE = [
    "The platform uses AI algorithms to determine coverage eligibility for medical procedures based on policy terms and clinical guidelines.",
    "Our automated prior authorization system evaluates requests using machine learning models trained on approval criteria.",
    "Claim denials are issued by algorithmic processing systems that assess medical necessity and policy coverage.",
    "The app employs automated triage algorithms that classify symptoms and recommend levels of care urgency.",
    "Treatment plan adjustments are suggested by AI models analyzing patient data and clinical outcomes.",
]

CROSS_DOMAIN_SOCIAL_MEDIA = [
    "Our automated content moderation system removes posts that violate community guidelines using machine learning classifiers.",
    "Account suspensions are issued by algorithmic enforcement systems when patterns of violations are detected.",
    "Content reach and visibility are determined by our AI-powered recommendation algorithms.",
    "Advertiser eligibility is assessed by automated review systems that evaluate compliance with our policies.",
    "Profile verification decisions are made by machine learning models analyzing authenticity signals.",
]

CROSS_DOMAIN_ECOMMERCE = [
    "Product listings are automatically removed when our AI detection systems identify policy violations.",
    "Seller account status is determined by algorithmic evaluation of performance metrics and customer feedback.",
    "Refund eligibility is assessed by automated systems analyzing return policies and transaction data.",
    "Pricing for services adjusts automatically based on AI models predicting demand and availability.",
    "Account restrictions are applied by our systems when fraud detection algorithms identify suspicious behavior.",
]

CROSS_DOMAIN_SAAS = [
    "Access to premium features is controlled by automated licensing systems that verify subscription status.",
    "Account terminations occur when our automated compliance monitoring detects terms of service violations.",
    "Service tier assignments are determined by algorithmic analysis of usage patterns and entitlements.",
    "API rate limits are adjusted automatically based on AI models detecting abuse patterns.",
    "Data retention periods are set by automated policy enforcement systems applying regulatory requirements.",
]

# Edge cases: conditional, partial automation, hybrid
EDGE_CASES = [
    "We may use automated systems to make decisions about your account, subject to regulatory requirements.",
    "Initial content moderation is performed algorithmically, with subsequent human review in certain cases.",
    "The system could automatically restrict access if risk thresholds are exceeded, pending investigation.",
    "Preliminary assessments are made by AI, though final determinations may involve human judgment.",
    "Our automated processes might suspend accounts temporarily until manual verification is completed.",
    "Decisions about service eligibility are partially automated, with human oversight for appeals.",
    "The platform sometimes employs algorithmic enforcement, depending on the nature of the violation.",
    "We generally use automated decision-making for routine cases, reserving complex situations for staff review.",
    "Your account may be subject to automated restrictions unless you request human review within 30 days.",
    "The system typically makes decisions algorithmically, but exceptions exist for regulated activities.",
    "Automated processing usually determines outcomes, though manual intervention occurs in certain circumstances.",
    "Our AI systems provisionally classify content, with final confirmation in cases flagged as uncertain.",
    "Decisions are largely automated, subject to periodic human audits for quality assurance.",
    "The platform employs hybrid decision-making combining algorithmic assessment with human validation.",
    "Your account status reflects both automated evaluations and discretionary staff judgments.",
    "We use semi-automated processes where algorithms recommend actions that staff may confirm or override.",
    "Decisions about content visibility are partly algorithmic and partly based on curator discretion.",
    "The system makes preliminary determinations automatically, with human review triggered by confidence thresholds.",
    "Your access may be limited by automated systems, pending verification by our team.",
    "We employ algorithm-assisted decision-making where models inform rather than dictate outcomes.",
    "Account actions result from a combination of automated processing and human evaluation.",
    "The platform uses automated decisions as a first step, with escalation paths for contested cases.",
    "Your eligibility is assessed through both algorithmic scoring and manual underwriting for borderline cases.",
    "We utilize automated enforcement for clear violations, reserving ambiguous situations for human judgment.",
    "Decisions are made by our systems unless you exercise your right to request human review.",
]


def make_record(text: str, expected_label: str, category: str, source: str) -> Dict:
    """Create a test record."""
    labels = {
        "automated_decision": 1.0 if expected_label == "automated_decision" else 0.0,
        "human_review": 1.0 if expected_label == "human_review" else 0.0,
        "transparency_statement": 1.0 if expected_label == "transparency_statement" else 0.0,
    }
    
    return {
        "text": text,
        "labels": labels,
        "expected_label": expected_label,
        "test_category": category,
        "source": source,
        "category": "algorithmic_decisions",
    }


def generate_validation_suite(output_path: Path, seed: int = 42) -> None:
    """Generate complete validation suite."""
    random.seed(seed)
    
    suite: List[Dict] = []
    
    # Adversarial transparency (should be NEGATIVE for automated_decision)
    for text in ADVERSARIAL_TRANSPARENCY:
        suite.append(make_record(
            text=text,
            expected_label="NEGATIVE",  # These are NOT automated decisions
            category="adversarial_transparency",
            source="synthetic_validation_v2025.10.13",
        ))
    
    # Adversarial automated decisions (should be POSITIVE for automated_decision)
    for text in ADVERSARIAL_AUTOMATED_DECISIONS:
        suite.append(make_record(
            text=text,
            expected_label="automated_decision",
            category="adversarial_automated_decision",
            source="synthetic_validation_v2025.10.13",
        ))
    
    # Cross-domain examples (should be POSITIVE for automated_decision)
    cross_domain = (
        CROSS_DOMAIN_BANKING +
        CROSS_DOMAIN_HEALTHCARE +
        CROSS_DOMAIN_SOCIAL_MEDIA +
        CROSS_DOMAIN_ECOMMERCE +
        CROSS_DOMAIN_SAAS
    )
    for text in cross_domain:
        suite.append(make_record(
            text=text,
            expected_label="automated_decision",
            category="cross_domain",
            source="synthetic_validation_v2025.10.13",
        ))
    
    # Edge cases (MIXED - mark as ambiguous for analysis)
    for text in EDGE_CASES:
        suite.append(make_record(
            text=text,
            expected_label="AMBIGUOUS",  # These require judgment
            category="edge_case",
            source="synthetic_validation_v2025.10.13",
        ))
    
    # Shuffle
    random.shuffle(suite)
    
    # Write output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open('w', encoding='utf-8') as f:
        for record in suite:
            f.write(json.dumps(record, ensure_ascii=False) + '\n')
    
    print(f"✅ Generated {len(suite)} validation examples")
    print(f"   - Adversarial transparency: {len(ADVERSARIAL_TRANSPARENCY)}")
    print(f"   - Adversarial automated decisions: {len(ADVERSARIAL_AUTOMATED_DECISIONS)}")
    print(f"   - Cross-domain: {len(cross_domain)}")
    print(f"   - Edge cases: {len(EDGE_CASES)}")
    print(f"   - Output: {output_path}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/validation/algorithmic_decisions_generalization_suite_v2025.10.13.jsonl"),
        help="Output path for validation suite"
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed"
    )
    
    args = parser.parse_args()
    generate_validation_suite(args.output, args.seed)
