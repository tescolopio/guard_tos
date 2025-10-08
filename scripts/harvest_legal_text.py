#!/usr/bin/env python3
"""Harvests legal texts from public sources like EUR-Lex and legislative sites.

This script downloads raw legal documents (e.g., GDPR, CCPA) and stores them
in the appropriate `data/raw` directory, creating a versioned snapshot.

Example:
    python scripts/harvest_legal_text.py --source gdpr
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime
from pathlib import Path

import requests

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

# Source registry mapping a source key to its download configuration.
SOURCE_REGISTRY = {
    "gdpr": {
        "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679",
        "output_dir": "data/raw/gdpr_eur_2016_679",
        "filename": "gdpr.html",
    },
    "ccpa": {
        "url": "https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=3.&part=4.&title=1.81.5&lawCode=CIV",
        "output_dir": "data/raw/ccpa_california",
        "filename": "ccpa.html",
    },
}


def parse_args() -> argparse.Namespace:
    """Parses command-line arguments."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        required=True,
        choices=sorted(SOURCE_REGISTRY.keys()),
        help="The source to harvest.",
    )
    return parser.parse_args()


def harvest_source(source: str, url: str, output_dir: str, filename: str) -> None:
    """
    Fetches content from a URL and saves it to a versioned directory.
    """
    print(f"Harvesting '{source}' from {url}...")
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()  # Raise an exception for bad status codes
    except requests.RequestException as e:
        raise SystemExit(f"Error fetching {url}: {e}")

    today = datetime.utcnow().strftime("%Y%m%d")
    save_path = REPO_ROOT / output_dir / today
    save_path.mkdir(parents=True, exist_ok=True)

    file_path = save_path / filename
    with file_path.open("w", encoding="utf-8") as f:
        f.write(response.text)

    print(f"Successfully saved {source} content to {file_path}")


def main() -> None:
    """Main function to drive the harvesting process."""
    args = parse_args()
    source_config = SOURCE_REGISTRY[args.source]

    harvest_source(
        source=args.source,
        url=source_config["url"],
        output_dir=source_config["output_dir"],
        filename=source_config["filename"],
    )


if __name__ == "__main__":
    main()
