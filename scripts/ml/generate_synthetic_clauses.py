#!/usr/bin/env python3
"""Generate synthetic legal clauses for underrepresented labels.

This utility creates template-driven synthetic data in the same JSONL format
used by our processed datasets. The primary goal is to boost label support for
categories that suffer from class imbalance (e.g., Content Rights, Dispute
Resolution).

Example usage:

```
python scripts/ml/generate_synthetic_clauses.py \
    --category content_rights \
    --label commercial_use_claim:80 \
    --output data/aug/content_rights/v2025.10.08a/commercial_use_claim.synthetic.jsonl
```

You can also generate multiple labels in one invocation by repeating the flag:

```
python scripts/ml/generate_synthetic_clauses.py \
    --category dispute_resolution \
    --label class_action_waiver:90 \
    --label jury_trial_waiver:30 \
    --output data/aug/dispute_resolution/v2025.10.08a/synthetic.jsonl
```

The script intentionally focuses on high-precision single-label snippets. Each
record is a short clause that explicitly contains hallmarks of the requested
label, while the remaining labels in the category are marked as negative (0).

Synthetic data should still undergo manual spot checks before being merged into
training corpora.
"""

from __future__ import annotations

import argparse
import json
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Sequence

from category_config import CATEGORY_REGISTRY

# Pools of interchangeable terms used across templates to keep language varied
PLATFORMS = [
    "Acme Platform",
    "Nimbus Services",
    "Orbit Apps",
    "Helios Media",
    "Northwind Networks",
    "Vertex Labs",
]

JURISDICTIONS = [
    "State of California",
    "State of New York",
    "Province of Ontario",
    "Federal Republic of Germany",
    "Commonwealth of Australia",
]

NOTICE_PERIODS = [
    "30 days",
    "45 days",
    "60 days",
    "ninety (90) days",
    "two billing cycles",
]

ARBITRATION_FORUMS = [
    "American Arbitration Association",
    "JAMS",
    "London Court of International Arbitration",
    "Singapore International Arbitration Centre",
]

COMMON_SUFFIXES = [
    "This obligation survives termination of the Terms and applies worldwide.",
    "This clause will be interpreted broadly to effectuate its purpose across all {platform} offerings.",
    "Parties acknowledge that this provision is material consideration for access to the services.",
    "Applicable law of the {jurisdiction} governs the interpretation of this clause.",
    "The parties agree that {platform} may update notice requirements provided that comparable protection remains in place.",
]

CONTENT_RIGHTS_SUFFIXES = [
    "Contributor also agrees that {platform} may translate, adapt, or format the content to fit distribution channels.",
    "These rights extend to affiliated entities and authorized distribution partners of {platform}.",
    "Contributor acknowledges that removing the content from the services will not limit {platform}'s rights already granted.",
    "The parties agree that no further consideration is required for the rights described herein.",
    "Contributor remains responsible for securing any third-party permissions necessary for commercialization by {platform}.",
    "Contributor authorizes {platform} to package the submission in premium content collections curated for the {jurisdiction} market.",
    "The grant covers live events, experiential activations, and any new {platform} offerings introduced in the future.",
    "Contributor will cooperate with reasonable documentation requests evidencing the rights granted to {platform}.",
    "These permissions apply regardless of the medium, format, or channels that {platform} elects to pursue.",
    "Contributor confirms that no guild, union, or collective bargaining agreement restricts {platform}'s monetization of the content.",
]

IP_RETAINED_SUFFIXES = [
    "{platform} receives only the limited license expressly granted and no ownership passes to {platform} or its affiliates.",
    "All residual rights not expressly transferred remain vested in the submitting party.",
    "Upon termination, {platform} shall cease use of the content except as otherwise required by law.",
    "Nothing in this Agreement shall be construed as an assignment of intellectual property to {platform}.",
    "The contributor may grant similar licenses to other parties without restriction.",
    "All derivative works created by {platform} shall continue to acknowledge the contributor's underlying ownership.",
    "Contributor may revoke permissions for future campaigns upon ninety (90) days written notice to {platform}.",
    "Any enhancements or feedback provided to {platform} remain the property of the contributor unless separately assigned.",
    "Contributor's trademarks and brand assets remain under their exclusive control except as expressly licensed.",
    "{platform} agrees to execute documents reasonably requested to evidence the contributor's retained ownership rights.",
]

MORAL_RIGHTS_SUFFIXES = [
    "Where the waiver is not permitted, contributor agrees not to assert such rights.",
    "Contributor further agrees that {platform} may edit, crop, or otherwise adapt the content without additional approval.",
    "This waiver applies to present and future forms, media, or formats developed by {platform}.",
    "Contributor acknowledges that {platform} may attribute the content to a user account name or remain anonymous at {platform}'s discretion.",
    "To the extent moral rights cannot be waived, contributor consents to acts that might otherwise infringe those rights.",
    "Contributor appoints {platform} as agent to assert any waivable rights necessary to effectuate this waiver.",
    "This consent includes adaptations required to meet accessibility standards or localization requirements in any {jurisdiction}.",
    "Contributor agrees not to bring claims alleging false attribution or alteration related to {platform}'s editorial decisions.",
    "Waiver remains effective even if {platform} sublicenses the content to affiliates or marketing partners.",
    "Contributor acknowledges receipt of adequate consideration for granting this waiver of moral rights.",
]

CLASS_ACTION_SUFFIXES = [
    "The arbitrator may award relief only in favor of the individual party seeking relief and only to the extent necessary to provide such relief.",
    "If this waiver is found unenforceable, the entirety of the arbitration agreement shall be null and void.",
    "This waiver applies equally to disputes heard in court if the arbitration clause is deemed unenforceable.",
    "Administrative fees and arbitrator compensation shall be governed by the rules of the selected forum.",
    "Notwithstanding the foregoing, the parties may seek injunctive relief in the courts of the {jurisdiction} to protect intellectual property rights.",
    "Any settlement shall apply solely to the named individual parties and shall not bind non-parties or absent class members.",
    "The parties delegate questions of enforceability of this waiver to the arbitrator consistent with the rules of the {forum}.",
    "If a claim proceeds in court, the dispute shall still be maintained on an individual basis without class procedures.",
    "The waiver extends to consolidated arbitrations unless the parties expressly agree otherwise in writing.",
    "Relief granted in arbitration will not affect other users or account holders who are not parties to the proceeding.",
]

JURY_TRIAL_SUFFIXES = [
    "Each party certifies that this waiver is made knowingly, voluntarily, and intentionally.",
    "If this waiver is deemed unenforceable, the controversy shall be tried before a judge without a jury.",
    "This waiver extends to any claims arising under statute, common law, or equity that relate to these Terms.",
    "The parties acknowledge that alternative dispute resolution forums remain available notwithstanding this waiver.",
    "The waiver is a material inducement for {platform} to enter into this Agreement.",
    "Each party has had the opportunity to consult with counsel regarding the implications of this waiver.",
    "Parties agree that any appeal shall be taken on the existing record without empaneling a jury at any level.",
    "This waiver survives termination of the Agreement and applies to post-termination disputes.",
    "The parties expressly agree that {jurisdiction} law governs the enforceability of this waiver.",
    "If a court declines to enforce the waiver, the matter shall still proceed as a bench trial to the extent permitted.",
]
@dataclass(frozen=True)
class Template:
    label: str
    patterns: Sequence[str]
    extra_positive_labels: Sequence[str] = ()
    suffixes: Sequence[str] = ()
    prefaces: Sequence[str] = ()

    def instantiate(self) -> str:
        pattern = random.choice(self.patterns)
        base = pattern.format(
            platform=random.choice(PLATFORMS),
            jurisdiction=random.choice(JURISDICTIONS),
            notice=random.choice(NOTICE_PERIODS),
            forum=random.choice(ARBITRATION_FORUMS),
        )
        if self.prefaces:
            prefix = random.choice(self.prefaces)
            base = prefix.format(
                platform=random.choice(PLATFORMS),
                jurisdiction=random.choice(JURISDICTIONS),
                notice=random.choice(NOTICE_PERIODS),
                forum=random.choice(ARBITRATION_FORUMS),
            ) + " " + base
        if self.suffixes:
            suffix = random.choice(self.suffixes)
            return base + " " + suffix.format(
                platform=random.choice(PLATFORMS),
                jurisdiction=random.choice(JURISDICTIONS),
                notice=random.choice(NOTICE_PERIODS),
                forum=random.choice(ARBITRATION_FORUMS),
            )
        return base
CONTENT_RIGHTS_PREFACES = [
    "For clarity,",
    "The parties further agree that",
    "Subject to applicable law,",
    "Each contributor understands that",
    "In consideration for access to {platform},",
]

DISPUTE_PREFACES = [
    "To the fullest extent permitted,",
    "Except where prohibited by the laws of the {jurisdiction},",
    "In entering these Terms,",
    "By accepting service usage,",
    "As a condition precedent to using {platform},",
]


CONTENT_RIGHTS_TEMPLATES: Sequence[Template] = (
    Template(
        label="commercial_use_claim",
        patterns=[
            "{platform} reserves the unrestricted right to display, commercialize, and sublicense any user-submitted content in advertising, sponsorships, and paid partnerships without further approval or compensation to the contributor.",
            "By uploading materials, you irrevocably authorize {platform} to exploit the work for promotional campaigns, paid syndication, and third-party merchandising deals, and you waive any entitlement to royalties or revenue share stemming from such uses.",
            "User grants {platform} a perpetual license to monetize the submission across broadcast, streaming, and derivative merchandising channels, including but not limited to advertisements, sponsored placements, and branded content engagements.",
            "Contributor permits {platform} to broker exclusive or non-exclusive sponsorship integrations of the content within {jurisdiction} and abroad without additional approvals.",
            "Submitter grants {platform} the right to negotiate paid co-marketing activations and product placements utilizing the contribution in any media now known or later developed.",
        ],
        suffixes=CONTENT_RIGHTS_SUFFIXES,
        prefaces=CONTENT_RIGHTS_PREFACES,
    ),
    Template(
        label="ip_retained",
        patterns=[
            "Notwithstanding the license granted herein, the creator retains all title, ownership, and intellectual property rights in and to the uploaded works, subject only to the limited usage permissions expressly described in this Agreement.",
            "Except for the non-exclusive rights granted to {platform}, the party submitting content maintains full ownership of all copyrights, moral rights, and proprietary interests embodied in the material.",
            "The parties acknowledge that contributors preserve all intellectual property rights in their contributions and that no ownership in such works transfers to {platform}.",
            "Contributor represents that granting the non-exclusive license to {platform} does not impair their ability to exercise or transfer the copyrights and neighboring rights in the submitted materials.",
            "Contributor's relationship with {platform} remains non-exclusive, and the contributor reserves the right to distribute identical content to other platforms or broadcasters.",
            "The contributor confirms that any registered or unregistered intellectual property embedded in the submission remains solely owned by the contributor notwithstanding {platform}'s exploitation rights.",
        ],
        suffixes=IP_RETAINED_SUFFIXES,
        prefaces=CONTENT_RIGHTS_PREFACES,
    ),
    Template(
        label="moral_rights_waiver",
        patterns=[
            "You hereby irrevocably waive any claims based on moral rights, droit moral, or similar theories, including rights of attribution and integrity, to the fullest extent permitted by the laws of any jurisdiction.",
            "Wherever legally permissible, contributors waive enforcement of moral rights (including the right to be identified as the author and to object to derogatory treatment) with respect to materials submitted to {platform}.",
            "Artist agrees to forego and waive any and all moral rights or similar protections that might otherwise apply to edits, translations, or adaptations of the submitted content worldwide.",
            "Contributor declines to assert any moral rights that could interfere with {platform}'s ability to edit, reorganize, or combine the submission with other materials.",
            "Contributor expressly waives moral rights that might otherwise restrict {platform} from localizing the submission for the {jurisdiction} market or adapting it for accessibility purposes.",
        ],
        suffixes=MORAL_RIGHTS_SUFFIXES,
        prefaces=CONTENT_RIGHTS_PREFACES,
    ),
)


DISPUTE_RESOLUTION_TEMPLATES: Sequence[Template] = (
    Template(
        label="class_action_waiver",
        patterns=[
            "Any dispute shall be resolved in individual arbitration; the parties expressly waive any right to participate in a class action, class arbitration, private attorney general action, or any other representative proceeding.",
            "You and {platform} agree that disputes will be adjudicated solely on an individual basis and that neither party shall bring claims as a plaintiff or class member in any purported class or representative action.",
            "The parties irrevocably waive the ability to consolidate claims or proceed in any class, collective, or representative capacity before an arbitrator or court.",
            "Disputes between you and {platform} must be brought individually, and no arbitrator is empowered to hear consolidated or representative matters.",
        ],
        suffixes=CLASS_ACTION_SUFFIXES,
        prefaces=DISPUTE_PREFACES,
    ),
    Template(
        label="jury_trial_waiver",
        patterns=[
            "To the maximum extent permitted by law, each party knowingly waives any right to a trial by jury in any litigation arising from or relating to this Agreement or the transactions it contemplates.",
            "The parties agree that any litigation between them will be heard by a judge sitting without a jury, and each irrevocably waives the right to a jury trial in any such proceeding.",
            "Both parties hereby waive trial by jury with respect to any dispute, claim, or controversy arising out of or relating to this Agreement or the services provided.",
            "Each party agrees that any claims asserted against {platform} shall be tried exclusively before a judge of competent jurisdiction without a jury.",
        ],
        suffixes=JURY_TRIAL_SUFFIXES,
        prefaces=DISPUTE_PREFACES,
    ),
    Template(
        label="venue_selection",
        patterns=[
            "Exclusive jurisdiction and venue for proceedings shall reside in the state and federal courts located in the {jurisdiction}, and the parties consent to personal jurisdiction therein.",
            "All suits, actions, or proceedings shall be instituted exclusively in the courts of the {jurisdiction}, and each party waives any objection to venue in such courts.",
            "The parties agree that any litigation arising out of this Agreement shall be brought solely in courts situated in the {jurisdiction}, and both parties irrevocably submit to the exclusive jurisdiction of such courts.",
            "Each party consents to the exclusive venue of the courts of the {jurisdiction} and waives any argument that such forum is inconvenient or improper.",
            "Proceedings related to this Agreement must be filed and maintained in the {jurisdiction}, and the parties waive transfer motions seeking a different venue.",
            "For avoidance of doubt, the parties stipulate that the {jurisdiction} courts provide the exclusive forum for any dispute, and agree not to contest personal jurisdiction there.",
        ],
        prefaces=DISPUTE_PREFACES,
    ),
    Template(
        label="binding_arbitration",
        patterns=[
            "Any dispute or claim arising out of this Agreement shall be submitted to binding arbitration administered by the {forum} pursuant to its commercial rules, and the arbitrator's decision shall be final and enforceable in any court of competent jurisdiction.",
            "The parties agree to resolve disputes exclusively through binding arbitration conducted in the {jurisdiction} in accordance with the rules of the {forum}, and judgment on the award may be entered in any court with jurisdiction.",
        ],
        prefaces=DISPUTE_PREFACES,
    ),
)

TEMPLATE_REGISTRY = {
    "content_rights": CONTENT_RIGHTS_TEMPLATES,
    "dispute_resolution": DISPUTE_RESOLUTION_TEMPLATES,
}


def make_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--category", required=True, choices=TEMPLATE_REGISTRY.keys())
    parser.add_argument(
        "--label",
        action="append",
        metavar="LABEL:COUNT",
        required=True,
        help=(
            "Label generation request in the form 'label:count'. "
            "Repeat this flag to cover multiple labels."
        ),
    )
    parser.add_argument(
        "--output",
        required=True,
        type=Path,
        help="Path to write generated JSONL content",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=20251008,
        help="Random seed for reproducibility",
    )
    parser.add_argument(
        "--dedupe",
        action="store_true",
        help="Drop duplicate texts before writing output",
    )
    return parser


def main() -> None:
    parser = make_parser()
    args = parser.parse_args()
    random.seed(args.seed)

    templates = TEMPLATE_REGISTRY.get(args.category)
    if not templates:
        parser.error(f"No templates defined for category {args.category}")

    requested: Dict[str, int] = {}
    for entry in args.label:
        if ":" not in entry and "=" not in entry:
            parser.error("--label entries must be LABEL:COUNT")
        label_part, count_part = entry.replace("=", ":", 1).split(":", 1)
        try:
            count = int(count_part)
        except ValueError as exc:
            parser.error(f"Invalid count '{count_part}' for label '{label_part}'")
            raise exc  # pragma: no cover
        if count <= 0:
            parser.error("Counts must be positive integers")
        requested[label_part] = requested.get(label_part, 0) + count

    config = CATEGORY_REGISTRY[args.category]
    output_dir = args.output.expanduser().parent
    output_dir.mkdir(parents=True, exist_ok=True)

    generated: List[Dict[str, object]] = []
    seen_texts: set[str] = set()

    template_map = {template.label: template for template in templates}

    max_multiplier = 10

    for label_name, count in requested.items():
        if label_name not in template_map:
            parser.error(f"No template available for label '{label_name}' in category '{args.category}'")
        template = template_map[label_name]
        attempts = 0
        produced = 0
        while produced < count:
            attempts += 1
            if attempts > count * max_multiplier:
                parser.error(
                    "Unable to generate enough unique samples; consider expanding template pools or disabling --dedupe",
                )
            text = template.instantiate()
            if args.dedupe and text in seen_texts:
                continue
            record_labels = {lbl: 0.0 for lbl in config.label_list}
            record_labels[label_name] = 1.0
            for extra in template.extra_positive_labels:
                if extra in record_labels:
                    record_labels[extra] = 1.0
            generated.append({
                "text": text,
                "labels": record_labels,
                "source": "synthetic",
                "generator": "template_v1",
            })
            if args.dedupe:
                seen_texts.add(text)
            produced += 1

    if args.dedupe:
        assert len(seen_texts) == len(generated)

    with args.output.open("w", encoding="utf-8") as handle:
        for record in generated:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")

    print(f"Wrote {len(generated)} synthetic examples to {args.output}")


if __name__ == "__main__":
    main()
