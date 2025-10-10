#!/usr/bin/env python3
"""Extract relevant snippets from Hugging Face datasets for manual labeling.

This script filters downloaded HF datasets for text containing keywords related to
automated decisions, algorithms, and AI to identify candidate snippets for
manual labeling in the algorithmic_decisions category.
"""

import argparse
import json
import re
from pathlib import Path
from typing import Dict, List, Set
import random


# Keywords indicating automated decision-making or algorithmic processing
KEYWORDS = {
    "algorithm", "algorithms", "algorithmic", "algorithmically",
    "automated", "automatic", "automatically", "automation",
    "AI", "artificial intelligence", "machine learning", "ML",
    "decision", "decisions", "decide", "decides", "determined",
    "bot", "bots", "system", "systems",
    "transparency", "transparent", "explain", "explains",
    "review", "appeal", "challenge", "contest",
    "data collection", "data processing", "privacy policy",
    "terms of service", "user agreement", "policy",
}

# Compile regex patterns for efficient matching
KEYWORD_PATTERNS = [
    re.compile(r'\b' + re.escape(kw) + r'\b', re.IGNORECASE)
    for kw in KEYWORDS
]


def contains_keywords(text: str, min_matches: int = 1) -> bool:
    """Check if text contains at least min_matches keywords."""
    matches = 0
    for pattern in KEYWORD_PATTERNS:
        if pattern.search(text):
            matches += 1
            if matches >= min_matches:
                return True
    return False


def extract_snippet(text: str, max_length: int = 500) -> str:
    """Extract a snippet of text around keywords, up to max_length."""
    # For now, just truncate to max_length
    # Could be enhanced to center on keywords
    if len(text) <= max_length:
        return text
    return text[:max_length] + "..."


def extract_from_reddit_format(record: Dict) -> List[str]:
    """Extract text from Reddit-style records (title + body)."""
    texts = []
    
    # Extract title
    if 'title' in record and record['title']:
        texts.append(record['title'])
    
    # Extract body
    if 'body' in record and record['body']:
        texts.append(record['body'])
    
    # Also check for generic 'text' field
    if 'text' in record and record['text']:
        texts.append(record['text'])
    
    return texts


def extract_from_generic_format(record: Dict) -> List[str]:
    """Extract text from generic records."""
    texts = []
    
    # Common text fields
    text_fields = ['text', 'content', 'body', 'description', 'clause', 'statement']
    
    for field in text_fields:
        if field in record and record[field]:
            texts.append(record[field])
    
    return texts


def process_dataset(
    input_file: Path,
    output_file: Path,
    min_keywords: int = 1,
    max_snippets: int = None,
    min_length: int = 50,
    max_length: int = 500,
    seed: int = 42,
) -> int:
    """Process dataset and extract relevant snippets.
    
    Args:
        input_file: Path to input JSONL file
        output_file: Path to output JSONL file
        min_keywords: Minimum number of keyword matches required
        max_snippets: Maximum number of snippets to extract (None = all)
        min_length: Minimum snippet length
        max_length: Maximum snippet length
        seed: Random seed for sampling
        
    Returns:
        Number of snippets extracted
    """
    random.seed(seed)
    
    print(f"Processing {input_file}...")
    print(f"  Min keywords: {min_keywords}")
    print(f"  Max snippets: {max_snippets or 'unlimited'}")
    print(f"  Length range: {min_length}-{max_length} chars")
    
    candidates: List[Dict] = []
    total_records = 0
    
    with input_file.open('r', encoding='utf-8') as f:
        for line in f:
            if not line.strip():
                continue
            
            total_records += 1
            record = json.loads(line)
            
            # Try different extraction strategies
            texts = extract_from_reddit_format(record)
            if not texts:
                texts = extract_from_generic_format(record)
            
            # Check each text field
            for text in texts:
                if not text or len(text) < min_length:
                    continue
                
                if contains_keywords(text, min_matches=min_keywords):
                    snippet = extract_snippet(text, max_length=max_length)
                    
                    candidates.append({
                        "text": snippet,
                        "source_dataset": input_file.parent.name,
                        "source_record_id": record.get('id', f"record_{total_records}"),
                        "full_text_length": len(text),
                        "category": "algorithmic_decisions",
                        "labels": {
                            "automated_decision": 0.0,
                            "human_review": 0.0,
                            "transparency_statement": 0.0,
                        },
                        "needs_labeling": True,
                        "original_record": {
                            "title": record.get('title', ''),
                            "link": record.get('full_link', record.get('url', '')),
                        }
                    })
    
    print(f"  Found {len(candidates)} candidate snippets from {total_records} records")
    
    # Sample if needed
    if max_snippets and len(candidates) > max_snippets:
        print(f"  Sampling {max_snippets} snippets...")
        candidates = random.sample(candidates, max_snippets)
    
    # Write output
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with output_file.open('w', encoding='utf-8') as f:
        for candidate in candidates:
            f.write(json.dumps(candidate, ensure_ascii=False) + '\n')
    
    print(f"✅ Wrote {len(candidates)} snippets to {output_file}")
    return len(candidates)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input",
        type=Path,
        required=True,
        help="Input JSONL file from downloaded HF dataset"
    )
    parser.add_argument(
        "--output",
        type=Path,
        required=True,
        help="Output JSONL file for extracted snippets"
    )
    parser.add_argument(
        "--min-keywords",
        type=int,
        default=1,
        help="Minimum keyword matches required (default: 1)"
    )
    parser.add_argument(
        "--max-snippets",
        type=int,
        help="Maximum number of snippets to extract (default: unlimited)"
    )
    parser.add_argument(
        "--min-length",
        type=int,
        default=50,
        help="Minimum snippet length in characters (default: 50)"
    )
    parser.add_argument(
        "--max-length",
        type=int,
        default=500,
        help="Maximum snippet length in characters (default: 500)"
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for sampling (default: 42)"
    )
    
    args = parser.parse_args()
    
    process_dataset(
        input_file=args.input,
        output_file=args.output,
        min_keywords=args.min_keywords,
        max_snippets=args.max_snippets,
        min_length=args.min_length,
        max_length=args.max_length,
        seed=args.seed,
    )


if __name__ == "__main__":
    main()
