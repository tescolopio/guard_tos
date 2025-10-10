#!/usr/bin/env python3
"""Generate expanded synthetic examples for data_collection category.

Focus on underrepresented labels highlighted during 2025-10-09 evaluation:
- data_collection_extensive (retain broad monitoring coverage)
- purpose_specific (needs higher-variance intent boundaries)
- consent_explicit (add auditable, multi-step consent narratives)
- consent_implied (maintain baseline coverage)
- data_collection_minimal (reinforce minimization, retention, and opt-out stories)
"""

import argparse
import json
import math
import random
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple


LABELS = [
    "data_collection_extensive",
    "data_collection_minimal",
    "consent_explicit",
    "consent_implied",
    "purpose_specific",
    "purpose_broad",
]

SYNTHETIC_SOURCE = "synthetic_legal_enhanced_v2025.10.12"

CATEGORY = "data_collection"
DEFAULT_OUTPUT_PATH = Path("data/aug/data_collection/v2025.10.12/synthetic_targeted.jsonl")
DEFAULT_LABEL_COUNTS: Dict[str, int] = {
    "data_collection_extensive": 150,
    "purpose_broad": 120,
    "purpose_specific": 80,
    "consent_explicit": 80,
    "consent_implied": 40,
    "data_collection_minimal": 60,
}

Record = Dict[str, object]


def make_label_dict(target_label: str) -> Dict[str, float]:
    """Return a one-hot label dictionary matching processed dataset schema."""

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


def format_list(items: List[str]) -> str:
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} and {items[1]}"
    return ", ".join(items[:-1]) + f", and {items[-1]}"


def parse_label_counts(specs: Optional[List[str]]) -> Dict[str, int]:
    if not specs:
        return dict(DEFAULT_LABEL_COUNTS)

    counts: Dict[str, int] = {}
    for raw in specs:
        if "=" not in raw:
            raise SystemExit(f"Expected LABEL=COUNT but received '{raw}'")
        label, count_raw = raw.split("=", 1)
        label = label.strip()
        if label not in LABELS:
            raise SystemExit(f"Unknown label '{label}'. Supported labels: {', '.join(LABELS)}")
        try:
            count = int(count_raw)
        except ValueError as exc:
            raise SystemExit(f"Count for {label} must be an integer (got '{count_raw}')") from exc
        if count < 0:
            raise SystemExit("Counts must be non-negative")
        counts[label] = count

    for label, default_count in DEFAULT_LABEL_COUNTS.items():
        counts.setdefault(label, default_count)

    return counts


def make_label_dict(target_label: str) -> Dict[str, float]:
    """Return a one-hot label dictionary matching processed dataset schema."""

    return {label: 1.0 if label == target_label else 0.0 for label in LABELS}


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

PURPOSE_BROAD_PURPOSES = [
    "personalization",
    "targeted advertising",
    "analytics",
    "research and development",
    "product innovation",
    "safety monitoring",
    "regulatory compliance",
    "partnership enablement",
    "market expansion",
    "risk scoring",
    "machine learning training",
    "new business initiatives",
    "profiling",
    "cross-promotional campaigns",
    "business intelligence",
]

PURPOSE_BROAD_CHANGE_CLAUSES = [
    "We may expand these purposes over time to support other strategic objectives without further notice.",
    "We reserve the right to use your information for any additional business interests compatible with our operations.",
    "Future initiatives may introduce other purposes and we will rely on this clause to support them.",
    "This list is illustrative and may be updated as we discover new opportunities.",
]

PURPOSE_BROAD_CONTROL_SENTENCES = [
    "Even if you opt out of certain programs, we may continue processing for the remaining purposes.",
    "Granular controls are not available; declining one purpose does not restrict the others.",
    "User preferences apply narrowly and do not limit secondary uses described here.",
    "We process data across these purposes unless you delete your account entirely.",
]

PURPOSE_BROAD_MODAL_SENTENCES = [
    "including but not limited to {purposes_list}.",
    "for initiatives such as {purposes_list} and other related endeavors.",
    "covering programs like {purposes_list} among additional forthcoming projects.",
    "spanning {purposes_list} and any adjacent campaigns we may launch.",
]

PURPOSE_BROAD_NEGATIVE_TEMPLATES = [
    "We collect {data_type} solely to {purpose}, and do not repurpose it for unrelated activities.",
    "Your {data_type} is limited to {purpose}; we prohibit wider reuse without a separate opt-in.",
    "Processing of {data_type} stays confined to {purpose} and expires after {retention_window}.",
    "We restrict {data_type} to {purpose} only, and any additional uses require explicit consent.",
]

# === DATA_COLLECTION_EXTENSIVE COMPONENTS (Broad, invasive practices) ===
EXTENSIVE_COLLECTION_OPENERS = [
    "We automatically collect",
    "Our systems continuously capture",
    "The service records",
    "We log",
    "We aggregate",
    "Our analytics stack harvests",
]

EXTENSIVE_DATA_TARGETS = [
    "every interaction you have with our services",
    "all content you create, upload, or modify",
    "complete device telemetry and diagnostic signals",
    "full clickstream activity and navigation paths",
    "all transaction details and metadata",
    "comprehensive behavioral, session, and engagement data",
]

EXTENSIVE_CHANNELS = [
    "across our websites, mobile apps, and connected devices",
    "throughout affiliated properties and partner integrations",
    "across in-product experiences, marketing campaigns, and support channels",
    "across online, offline, and in-store touchpoints",
    "throughout our ecosystem of services and third-party widgets",
]

EXTENSIVE_SOURCE_PHRASES = [
    "We also combine this information with data obtained from {source} to build richer profiles.",
    "In addition, we enrich these records using datasets from {source}.",
    "We augment the captured data with insights licensed from {source}.",
    "We correlate your usage with intelligence sourced from {source}.",
]

EXTENSIVE_SOURCES = [
    "commercial data brokers",
    "trusted analytics vendors",
    "advertising exchanges and measurement partners",
    "public records and demographic databases",
    "enterprise data marketplaces",
]

EXTENSIVE_SHARING_PHRASES = [
    "We then share these combined datasets with {recipient} for {purpose}.",
    "We make the resulting profile available to {recipient} supporting {purpose} initiatives.",
    "The comprehensive dataset is shared with {recipient} to enable {purpose}.",
    "We disclose the enriched information to {recipient} in support of {purpose}.",
]

EXTENSIVE_RECIPIENTS = [
    "advertising networks",
    "joint marketing partners",
    "analytics providers",
    "strategic affiliates and resellers",
    "risk and compliance vendors",
]

EXTENSIVE_PURPOSES = [
    "cross-channel personalization",
    "targeted advertising and measurement",
    "predictive product development",
    "expanded customer profiling initiatives",
    "fraud prevention and monetization programs",
]

EXTENSIVE_MONITORING_SENTENCES = [
    "This includes monitoring {detail} for optimization and governance purposes.",
    "We also monitor {detail} to maintain service quality and drive growth decisions.",
    "Our monitoring extends to {detail} to support experimentation and safety reviews.",
    "We continuously monitor {detail} to power personalization and enforcement pipelines.",
]

EXTENSIVE_MONITORING_DETAILS = [
    "activity across linked accounts and connected devices",
    "your interactions with partner platforms and embedded experiences",
    "messaging, collaboration, and transaction history within the service",
    "cross-session identifiers tied to marketing and sales funnels",
    "support tickets, feedback, and behavioral telemetry end-to-end",
]

EXTENSIVE_RETENTION_WINDOWS = [
    "18 months",
    "24 months",
    "5 years",
    "the lifetime of the account",
    "the duration of our commercial agreement",
]

EXTENSIVE_RETENTION_SENTENCES = [
    "We retain these assembled dossiers for at least {retention_window} across affiliated entities.",
    "The enriched profiles persist for {retention_window} to support longitudinal analysis.",
    "Profiles remain active for {retention_window}, even after you close associated services.",
    "Combined telemetry is archived for {retention_window} for governance, monetization, and product evolution.",
]

EXTENSIVE_ENRICHMENT_SENTENCES = [
    "We link offline purchase histories and loyalty data provided by {partner} to extend the profile graph.",
    "Device fingerprinting and household graphing from {partner} are merged to resolve identities across channels.",
    "We append risk and intent scores sourced from {partner} to prioritize engagement.",
    "Ingestion pipelines stitch in propensity models acquired from {partner} to enable predictive outreach.",
]

EXTENSIVE_PARTNERS = [
    "credit bureaus",
    "retail consortium exchanges",
    "marketing attribution desks",
    "telemetry clearinghouses",
    "identity resolution vendors",
]

EXTENSIVE_COMPUTE_SENTENCES = [
    "Continuous scoring jobs execute hourly so we can refresh eligibility and propensity models.",
    "We run automated enrichment workflows that recompute cross-channel personas daily.",
    "Streaming analytics monitor anomalies and feed machine learning training pipelines in real time.",
    "Schedulers replay event archives to refine segmentation and lookalike models continuously.",
]

EXTENSIVE_NEGATIVE_TEMPLATES = [
    "We limit telemetry collection to aggregated analytics and disable any cross-device correlation beyond the active session.",
    "Only coarse metrics are captured for diagnostics; we do not ingest raw content or persistent identifiers.",
    "We do not combine data from external brokers, and sharing with third parties is restricted to anonymized reports.",
    "Monitoring is scoped to uptime and security logs; behavioral tracking for marketing is explicitly out of scope.",
    "Retention is capped at {retention_window}, after which raw telemetry is deleted and only summaries remain.",
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

RETENTION_WINDOWS = [
    "24 hours",
    "48 hours",
    "72 hours",
    "7 days",
    "30 days",
    "one billing cycle",
    "the onboarding period",
]

PURPOSE_SPECIFIC_REVIEW_TEAMS = [
    "Privacy Review Board",
    "Data Governance Council",
    "Compliance Office",
    "Trust & Safety Committee",
    "Legal Oversight Group",
]

PURPOSE_SPECIFIC_SCOPE_SENTENCES = [
    "We collect {data_type} solely so the system can {specific_purpose} for your account.",
    "Access to {data_type} is restricted to workflows that directly {specific_purpose}.",
    "Product teams may only request {data_type} when it is required to {specific_purpose}.",
    "Collection of {data_type} is tied to service paths that must {specific_purpose} and nothing more.",
]

PURPOSE_SPECIFIC_CONTROL_SENTENCES = [
    "{team} verifies new launches weekly to confirm they align with that narrow purpose.",
    "Each change is reviewed by the {team} to ensure no broader collection occurs.",
    "The {team} blocks deployments that attempt to repurpose {data_type} beyond the stated need.",
    "Rollouts are halted by the {team} unless they prove the use case still strictly {specific_purpose}.",
]

PURPOSE_SPECIFIC_RETENTION_SENTENCES = [
    "Automated jobs delete {data_type} gathered for {specific_purpose} after {retention_window}.",
    "We audit storage to ensure {data_type} for that purpose is purged within {retention_window}.",
    "{data_type_cap} collected for this purpose expires after {retention_window} unless you renew the request.",
    "Any {data_type} tied to that purpose is masked or deleted once {retention_window} passes.",
]

PURPOSE_SPECIFIC_LEGAL_REFERENCES = [
    "We rely on Article 6(1)(b) of the GDPR so {data_type} may be processed strictly to {specific_purpose}.",
    "The clause is grounded in GDPR Recital 39, limiting {data_type} to what is necessary to {specific_purpose}.",
    "California Civil Code §1798.100 requires we collect {data_type} only when needed to {specific_purpose}.",
    "Under CCPA §1798.120 we must use {data_type} solely to {specific_purpose} when honoring consumer choices.",
]

PURPOSE_SPECIFIC_LEGAL_LIMITS = [
    "Technical safeguards ensure {data_type} is ring-fenced to workflows that {specific_purpose} and nothing further.",
    "Contracts with processors prohibit any reuse of {data_type} beyond {specific_purpose}.",
    "Access control reviews confirm {data_type} never flows into analytics beyond {specific_purpose}.",
    "We require service providers to certify {data_type} will not be repurposed outside {specific_purpose}.",
]

PURPOSE_SPECIFIC_LEGAL_ENFORCEMENT = [
    "Compliance teams log every access and escalate deviations within 24 hours.",
    "We document audits for regulators and maintain evidence of adherence for seven years.",
    "Supervisory authorities can inspect the logs, so we retain immutable records of each request handler.",
    "Quarterly reviews are filed with our DPO to demonstrate we honored the stated purpose.",
]

MINIMAL_SCOPE_SENTENCES = [
    "We collect only the minimum {data_type} required to {purpose} for the core service.",
    "Intake flows strip fields so that {data_type} captured to {purpose} never exceeds what engineers approved.",
    "Our configuration limits how much {data_type} we ingest when you {purpose}.",
    "Collection pipelines are tuned to gather just the {data_type} essential to {purpose}.",
]

MINIMAL_CONTROL_SENTENCES = [
    "Dynamic minimization rules stop optional fields from being persisted.",
    "Engineers receive alerts if logging attempts to ingest extra {data_type} beyond the minimum.",
    "We sandbox experimental features until they prove they can operate without additional {data_type}.",
    "Customer support cannot request more {data_type} without a documented exception.",
]

MINIMAL_RETENTION_SENTENCES = [
    "Raw {data_type} is purged after {retention_window} or sooner if you close the feature.",
    "An automated purge removes {data_type} once {retention_window} has elapsed.",
    "We mask stored {data_type} after {retention_window} to keep diagnostics anonymous.",
    "Retention tooling enforces a {retention_window} ceiling for any {data_type} collected.",
]

MINIMAL_DISCLOSURE_SENTENCES = [
    "We never share this {data_type} with third parties and only report aggregated metrics.",
    "{data_type_cap} remains on region-scoped servers and is excluded from marketing exports.",
    "Only system health dashboards can reference anonymized forms of this {data_type}.",
    "Analytics jobs run on synthetic substitutes so the original {data_type} stays private.",
]

CONSENT_SURFACES = [
    "account dashboard",
    "mobile onboarding flow",
    "billing upgrade wizard",
    "enterprise admin console",
    "support escalation form",
]

CONSENT_VERIFICATION_STEPS = [
    "a double opt-in email",
    "a recorded confirmation call",
    "a time-stamped consent banner",
    "a signed digital acknowledgement",
    "multi-factor approval from the account owner",
]

CONSENT_EXPLICIT_SCOPE_SENTENCES = [
    "We only enable {data_type} collection after you provide explicit authorization.",
    "{data_type_cap} capture stays disabled until you approve it in writing.",
    "Our systems block {data_type} ingestion without an affirmative consent decision from you.",
    "We cannot collect {data_type} unless you deliver a deliberate opt-in signal.",
]

CONSENT_EXPLICIT_METHOD_SENTENCES = [
    "The {surface} walks you through {verification_step} before the toggle turns on.",
    "You must complete {verification_step} inside the {surface} to activate this processing.",
    "A consent wizard in the {surface} captures your signature using {verification_step} before proceeding.",
    "We log your decision via {verification_step} within the {surface} prior to enabling access.",
]

CONSENT_EXPLICIT_WITHDRAWAL_SENTENCES = [
    "You may revoke consent at any time and collection stops within 24 hours.",
    "Withdrawing consent immediately disables the related collection jobs.",
    "You can revisit the consent center to pause collection and we honor the change in near real time.",
    "We surface a persistent banner so you can reverse the decision whenever you like.",
]

CONSENT_EXPLICIT_AUDIT_SENTENCES = [
    "All confirmations are stored in an auditable ledger for compliance reviews.",
    "We archive the consent record with IP, timestamp, and operator for regulators.",
    "Compliance teams review the consent log weekly to verify authenticity.",
    "Every opt-in generates an immutable entry that our audit staff reconciles monthly.",
]

CONSENT_EXPLICIT_STATUTES = [
    "CCPA §1798.125 requires us to obtain your express opt-in before data sharing incentives apply.",
    "We enforce GDPR Article 7, which mandates demonstrable, affirmative consent before processing begins.",
    "Virginia CDPA §59.1-574 prohibits us from handling sensitive personal data without your explicit approval.",
    "Colorado Privacy Act §6-1-1308 compels us to secure an opt-in before collecting biometric identifiers.",
]

CONSENT_EXPLICIT_LEGAL_METHODS = [
    "Our consent portal captures a signed disclosure referencing the statute and retains it alongside the decision.",
    "Legal attestation screens in the {surface} outline statutory rights before you complete {verification_step}.",
    "We present a layered notice summarizing the law and record your acknowledgment through {verification_step}.",
    "The wizard cites the governing law and stores the executed {verification_step} as evidence.",
]

CONSENT_EXPLICIT_LEGAL_ENFORCEMENT = [
    "If regulators request proof, we disclose the consent ledger demonstrating adherence to the statute.",
    "Non-compliant toggles are disabled automatically and flagged for the privacy office.",
    "We send quarterly compliance packs listing every explicit consent collected under the statute.",
    "Audit routines compare active processing jobs to the consent ledger to ensure alignment.",
]


def generate_purpose_specific_examples(
    count: int,
    rng: random.Random,
    source: str,
    notes: Optional[str],
) -> List[Record]:
    """Generate synthetic purpose_specific examples."""
    examples: List[Record] = []

    for _ in range(count):
        data_type = rng.choice(DATA_TYPES)
        specific_purpose = rng.choice(SPECIFIC_PURPOSES)

        if rng.random() < 0.45:
            template = rng.choice(PURPOSE_SPECIFIC_TEMPLATES)
            text = template.format(
                data_type=data_type,
                data_type_cap=data_type.capitalize(),
                specific_purpose=specific_purpose,
            )
        else:
            scope_sentence = rng.choice(PURPOSE_SPECIFIC_SCOPE_SENTENCES).format(
                data_type=data_type,
                data_type_cap=data_type.capitalize(),
                specific_purpose=specific_purpose,
            )
            control_sentence = rng.choice(PURPOSE_SPECIFIC_CONTROL_SENTENCES).format(
                specific_purpose=specific_purpose,
                team=rng.choice(PURPOSE_SPECIFIC_REVIEW_TEAMS),
                data_type=data_type,
                data_type_cap=data_type.capitalize(),
            )
            retention_sentence = rng.choice(PURPOSE_SPECIFIC_RETENTION_SENTENCES).format(
                data_type=data_type,
                data_type_cap=data_type.capitalize(),
                specific_purpose=specific_purpose,
                retention_window=rng.choice(RETENTION_WINDOWS),
            )
            legal_sentence = rng.choice(PURPOSE_SPECIFIC_LEGAL_REFERENCES).format(
                data_type=data_type,
                specific_purpose=specific_purpose,
            )
            limiter_sentence = rng.choice(PURPOSE_SPECIFIC_LEGAL_LIMITS).format(
                data_type=data_type,
                specific_purpose=specific_purpose,
            )
            enforcement_sentence = rng.choice(PURPOSE_SPECIFIC_LEGAL_ENFORCEMENT)
            text = " ".join([
                scope_sentence,
                legal_sentence,
                control_sentence,
                limiter_sentence,
                retention_sentence,
                enforcement_sentence,
            ])

        examples.append(
            make_record(
                text=text,
                target_label="purpose_specific",
                source=source,
                notes=notes,
            )
        )
    
    return examples


def generate_consent_explicit_examples(
    count: int,
    rng: random.Random,
    source: str,
    notes: Optional[str],
) -> List[Record]:
    """Generate synthetic consent_explicit examples."""
    examples: List[Record] = []

    for _ in range(count):
        data_type = rng.choice(DATA_TYPES)

        if rng.random() < 0.4:
            template = rng.choice(CONSENT_EXPLICIT_TEMPLATES)
            text = template.format(
                data_type=data_type,
                data_type_cap=data_type.capitalize(),
            )
        else:
            surface = rng.choice(CONSENT_SURFACES)
            verification_step = rng.choice(CONSENT_VERIFICATION_STEPS)
            scope_sentence = rng.choice(CONSENT_EXPLICIT_SCOPE_SENTENCES).format(
                data_type=data_type,
                data_type_cap=data_type.capitalize(),
            )
            method_sentence = rng.choice(CONSENT_EXPLICIT_METHOD_SENTENCES).format(
                surface=surface,
                verification_step=verification_step,
            )
            withdrawal_sentence = rng.choice(CONSENT_EXPLICIT_WITHDRAWAL_SENTENCES)
            audit_sentence = rng.choice(CONSENT_EXPLICIT_AUDIT_SENTENCES)
            statute_sentence = rng.choice(CONSENT_EXPLICIT_STATUTES)
            legal_method_sentence = rng.choice(CONSENT_EXPLICIT_LEGAL_METHODS).format(
                surface=surface,
                verification_step=verification_step,
            )
            enforcement_sentence = rng.choice(CONSENT_EXPLICIT_LEGAL_ENFORCEMENT)
            text = " ".join([
                scope_sentence,
                method_sentence,
                statute_sentence,
                legal_method_sentence,
                withdrawal_sentence,
                audit_sentence,
                enforcement_sentence,
            ])

        examples.append(
            make_record(
                text=text,
                target_label="consent_explicit",
                source=source,
                notes=notes,
            )
        )
    
    return examples


def generate_consent_implied_examples(
    count: int,
    rng: random.Random,
    source: str,
    notes: Optional[str],
) -> List[Record]:
    """Generate synthetic consent_implied examples."""
    examples: List[Record] = []

    for _ in range(count):
        template = rng.choice(CONSENT_IMPLIED_TEMPLATES)
        data_type = rng.choice(DATA_TYPES)
        
        example = template.format(
            data_type=data_type,
            data_type_cap=data_type.capitalize(),
        )
        
        examples.append(
            make_record(
                text=example,
                target_label="consent_implied",
                source=source,
                notes=notes,
            )
        )
    
    return examples


def generate_data_collection_minimal_examples(
    count: int,
    rng: random.Random,
    source: str,
    notes: Optional[str],
) -> List[Record]:
    """Generate synthetic data_collection_minimal examples."""
    examples: List[Record] = []

    for _ in range(count):
        data_type = rng.choice(DATA_TYPES)
        purpose = rng.choice(GENERAL_PURPOSES)

        if rng.random() < 0.4:
            template = rng.choice(DATA_COLLECTION_MINIMAL_TEMPLATES)
            text = template.format(
                data_type=data_type,
                data_type_cap=data_type.capitalize(),
                purpose=purpose,
            )
        else:
            scope_sentence = rng.choice(MINIMAL_SCOPE_SENTENCES).format(
                data_type=data_type,
                data_type_cap=data_type.capitalize(),
                purpose=purpose,
            )
            control_sentence = rng.choice(MINIMAL_CONTROL_SENTENCES).format(
                data_type=data_type,
                data_type_cap=data_type.capitalize(),
                purpose=purpose,
            )
            retention_sentence = rng.choice(MINIMAL_RETENTION_SENTENCES).format(
                data_type=data_type,
                data_type_cap=data_type.capitalize(),
                retention_window=rng.choice(RETENTION_WINDOWS),
            )
            disclosure_sentence = rng.choice(MINIMAL_DISCLOSURE_SENTENCES).format(
                data_type=data_type,
                data_type_cap=data_type.capitalize(),
            )
            text = " ".join([
                scope_sentence,
                control_sentence,
                retention_sentence,
                disclosure_sentence,
            ])

        examples.append(
            make_record(
                text=text,
                target_label="data_collection_minimal",
                source=source,
                notes=notes,
            )
        )
    
    return examples


def generate_data_collection_extensive_examples(
    count: int,
    rng: random.Random,
    source: str,
    notes: Optional[str],
) -> List[Record]:
    """Generate synthetic data_collection_extensive examples."""

    examples: List[Record] = []

    for _ in range(count):
        collect_sentence = (
            f"{rng.choice(EXTENSIVE_COLLECTION_OPENERS)} {rng.choice(EXTENSIVE_DATA_TARGETS)} "
            f"{rng.choice(EXTENSIVE_CHANNELS)}."
        )

        combine_sentence = rng.choice(EXTENSIVE_SOURCE_PHRASES).format(
            source=rng.choice(EXTENSIVE_SOURCES)
        )

        share_sentence = rng.choice(EXTENSIVE_SHARING_PHRASES).format(
            recipient=rng.choice(EXTENSIVE_RECIPIENTS),
            purpose=rng.choice(EXTENSIVE_PURPOSES),
        )

        monitoring_sentence = rng.choice(EXTENSIVE_MONITORING_SENTENCES).format(
            detail=rng.choice(EXTENSIVE_MONITORING_DETAILS)
        )

        retention_sentence = rng.choice(EXTENSIVE_RETENTION_SENTENCES).format(
            retention_window=rng.choice(EXTENSIVE_RETENTION_WINDOWS)
        )

        enrichment_sentence = rng.choice(EXTENSIVE_ENRICHMENT_SENTENCES).format(
            partner=rng.choice(EXTENSIVE_PARTNERS)
        )

        compute_sentence = rng.choice(EXTENSIVE_COMPUTE_SENTENCES)

        text = " ".join([
            collect_sentence,
            combine_sentence,
            enrichment_sentence,
            share_sentence,
            monitoring_sentence,
            retention_sentence,
            compute_sentence,
        ])

        examples.append(
            make_record(
                text=text,
                target_label="data_collection_extensive",
                source=source,
                notes=notes,
            )
        )

    return examples


def generate_purpose_broad_examples(
    count: int,
    rng: random.Random,
    source: str,
    notes: Optional[str],
) -> List[Record]:
    """Generate synthetic purpose_broad examples."""

    examples: List[Record] = []

    for _ in range(count):
        data_type = rng.choice(DATA_TYPES)
        sample_size = rng.randint(3, min(6, len(PURPOSE_BROAD_PURPOSES)))
        sampled = rng.sample(PURPOSE_BROAD_PURPOSES, k=sample_size)
        purposes_list = format_list(sampled)

        opener = (
            f"We may leverage {data_type} across a broad spectrum of programs "
            f"{rng.choice(PURPOSE_BROAD_MODAL_SENTENCES).format(purposes_list=purposes_list)}"
        )

        change_sentence = rng.choice(PURPOSE_BROAD_CHANGE_CLAUSES)
        control_sentence = rng.choice(PURPOSE_BROAD_CONTROL_SENTENCES)

        fallback_sentence = (
            "These uses span subsidiaries, affiliates, and partners who help execute the initiatives."
        )

        text = " ".join([
            opener,
            change_sentence,
            control_sentence,
            fallback_sentence,
        ])

        examples.append(
            make_record(
                text=text,
                target_label="purpose_broad",
                source=source,
                notes=notes,
            )
        )

    return examples


def generate_data_collection_extensive_negatives(
    count: int,
    rng: random.Random,
    source: str,
    notes: Optional[str],
) -> List[Record]:
    """Generate contrastive negatives for the extensive label."""

    negatives: List[Record] = []
    for _ in range(count):
        template = rng.choice(EXTENSIVE_NEGATIVE_TEMPLATES)
        text = template.format(retention_window=rng.choice(RETENTION_WINDOWS))
        negatives.append(
            make_negative_record(
                text=text,
                source=source,
                notes=notes,
            )
        )

    return negatives


def generate_purpose_broad_negatives(
    count: int,
    rng: random.Random,
    source: str,
    notes: Optional[str],
) -> List[Record]:
    """Generate contrastive negatives for purpose_broad."""

    negatives: List[Record] = []
    for _ in range(count):
        template = rng.choice(PURPOSE_BROAD_NEGATIVE_TEMPLATES)
        text = template.format(
            data_type=rng.choice(DATA_TYPES),
            purpose=rng.choice(SPECIFIC_PURPOSES),
            retention_window=rng.choice(RETENTION_WINDOWS),
        )
        negatives.append(
            make_negative_record(
                text=text,
                source=source,
                notes=notes,
            )
        )

    return negatives


GENERATOR_REGISTRY: Dict[str, Callable[[int, random.Random, str, Optional[str]], List[Record]]] = {
    "data_collection_extensive": generate_data_collection_extensive_examples,
    "data_collection_minimal": generate_data_collection_minimal_examples,
    "consent_explicit": generate_consent_explicit_examples,
    "consent_implied": generate_consent_implied_examples,
    "purpose_specific": generate_purpose_specific_examples,
    "purpose_broad": generate_purpose_broad_examples,
}

NEGATIVE_GENERATOR_REGISTRY: Dict[str, Callable[[int, random.Random, str, Optional[str]], List[Record]]] = {
    "data_collection_extensive": generate_data_collection_extensive_negatives,
    "purpose_broad": generate_purpose_broad_negatives,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_PATH,
        help="Path to write generated positive examples (default: %(default)s)",
    )
    parser.add_argument(
        "--label",
        action="append",
        dest="labels",
        metavar="LABEL=COUNT",
        help="Override default count for a label; repeat for multiple labels",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed used for generation (default: %(default)s)",
    )
    parser.add_argument(
        "--source",
        type=str,
        default=SYNTHETIC_SOURCE,
        help="Source string to assign to generated records (default: %(default)s)",
    )
    parser.add_argument(
        "--notes",
        type=str,
        default="",
        help="Optional provenance notes stored with each record",
    )
    parser.add_argument(
        "--emit-negatives",
        action="store_true",
        help="Generate contrastive hard negatives for supported labels",
    )
    parser.add_argument(
        "--negative-ratio",
        type=float,
        default=0.35,
        help="Multiplier applied to positive counts when generating negatives (default: %(default)s)",
    )
    parser.add_argument(
        "--negatives-output",
        type=Path,
        help="Optional override for where to write negative examples",
    )
    parser.add_argument(
        "--extra-jsonl",
        action="append",
        type=Path,
        default=[],
        help="Additional JSONL files to append to the positive set (e.g., curated samples)",
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
        help="Generate examples but do not write output files",
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
    negative_source_suffix: str = "_hard_negative",
) -> Tuple[List[Record], List[Record], Dict[str, int]]:
    positives: List[Record] = []
    negatives: List[Record] = []
    summary: Dict[str, int] = {}

    for label, count in label_counts.items():
        generator = GENERATOR_REGISTRY.get(label)
        if generator is None:
            raise SystemExit(f"No generator registered for label '{label}'")
        if count <= 0:
            summary[label] = 0
            continue
        generated = generator(count, rng, source, notes)
        summary[label] = len(generated)
        positives.extend(generated)

    if include_negatives:
        negative_source = f"{source}{negative_source_suffix}"
        for label, count in label_counts.items():
            negative_generator = NEGATIVE_GENERATOR_REGISTRY.get(label)
            if negative_generator is None or count <= 0:
                continue
            target_count = max(1, math.ceil(count * negative_ratio)) if negative_ratio > 0 else 0
            if target_count == 0:
                continue
            label_notes = f"contrastive_negative_for={label}"
            if notes:
                label_notes = f"{label_notes}; {notes}"
            negatives.extend(
                negative_generator(target_count, rng, negative_source, label_notes)
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
    if args.emit_negatives:
        print(f"  • total negatives: {negative_total}")

    if args.dry_run:
        print("Dry run enabled; nothing written to disk")
        return

    write_jsonl(args.output, positives)
    print(f"Wrote {total} positive examples to {args.output}")

    if args.emit_negatives and negative_total:
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
