"""Shared category metadata for Terms Guardian ML pipelines."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


@dataclass
class CategoryConfig:
    """Per-category metadata used to configure training and reporting."""

    name: str
    label_list: List[str]
    description: str
    max_length: int = 512


CATEGORY_REGISTRY: Dict[str, CategoryConfig] = {
    "data_collection": CategoryConfig(
        name="data_collection",
        label_list=[
            "data_collection_extensive",
            "data_collection_minimal",
            "consent_explicit",
            "consent_implied",
            "purpose_specific",
            "purpose_broad",
        ],
        description="Data collection, consent, and purpose limitation clauses",
    ),
    "content_rights": CategoryConfig(
        name="content_rights",
        label_list=[
            "license_assignment",
            "ip_retained",
            "moral_rights_waiver",
            "commercial_use_claim",
        ],
        description="User-generated content and IP control clauses",
    ),
    "dispute_resolution": CategoryConfig(
        name="dispute_resolution",
        label_list=[
            "binding_arbitration",
            "class_action_waiver",
            "jury_trial_waiver",
            "venue_selection",
        ],
        description="Dispute resolution mechanics",
    ),
    "user_privacy": CategoryConfig(
        name="user_privacy",
        label_list=[
            "retention_disclosed",
            "deletion_offered",
            "access_rights",
            "privacy_waiver",
        ],
        description="User privacy rights including data access, deletion, retention, and waivers",
    ),
    # TODO: populate remaining categories (account_management, terms_changes, etc.)
}
