#!/usr/bin/env python3
"""Quick manual testing of a trained model on sample texts.

Allows rapid validation of model behavior before full evaluation.
"""

import argparse
import json
from pathlib import Path
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer


def test_model(model_path: Path, test_texts: list, threshold: float = 0.5):
    """Test model on sample texts."""
    
    print("=" * 70)
    print(f"MANUAL MODEL TESTING: {model_path.name}")
    print("=" * 70)
    print()
    
    # Load model
    print("Loading model...")
    model = AutoModelForSequenceClassification.from_pretrained(model_path)
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model.eval()
    
    # Load category config to get labels
    config_path = model_path / "category_config.json"
    if config_path.exists():
        with config_path.open() as f:
            config = json.load(f)
            labels = config.get("label_list", [])
    else:
        labels = [f"label_{i}" for i in range(model.config.num_labels)]
    
    print(f"Model: {config.get('base_model', 'unknown')}")
    print(f"Category: {config.get('category', 'unknown')}")
    print(f"Labels: {len(labels)}")
    print(f"Threshold: {threshold}")
    print()
    
    # Test each text
    for i, text in enumerate(test_texts, 1):
        print("-" * 70)
        print(f"Test #{i}:")
        print(f"Text: {text[:100]}{'...' if len(text) > 100 else ''}")
        print()
        
        # Tokenize
        inputs = tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True
        )
        
        # Predict
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits[0]
            probs = torch.sigmoid(logits)
        
        # Show all probabilities
        print("Predictions:")
        predictions = []
        for label, prob in zip(labels, probs):
            prob_val = prob.item()
            is_predicted = prob_val >= threshold
            marker = "✅" if is_predicted else "  "
            print(f"  {marker} {label:30} {prob_val:.4f}")
            if is_predicted:
                predictions.append(f"{label} ({prob_val:.2f})")
        
        print()
        if predictions:
            print(f"Final: {', '.join(predictions)}")
        else:
            print("Final: No labels above threshold")
        print()
    
    print("=" * 70)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", required=True, help="Path to trained model directory")
    parser.add_argument("--threshold", type=float, default=0.5, help="Classification threshold")
    parser.add_argument("--text", action="append", help="Test text (can be repeated)")
    parser.add_argument("--file", help="File with test texts (one per line)")
    
    args = parser.parse_args()
    
    model_path = Path(args.model)
    if not model_path.exists():
        print(f"❌ Model not found: {model_path}")
        return 1
    
    # Collect test texts
    test_texts = []
    
    if args.text:
        test_texts.extend(args.text)
    
    if args.file:
        file_path = Path(args.file)
        if file_path.exists():
            with file_path.open() as f:
                test_texts.extend([line.strip() for line in f if line.strip()])
    
    # Default test texts if none provided
    if not test_texts:
        test_texts = [
            "We collect your email address, phone number, and browsing history for marketing purposes.",
            "You can delete your account at any time from the settings page.",
            "By agreeing to these terms, you waive your right to a jury trial.",
            "We may modify these terms at any time without prior notice.",
            "Your content will be analyzed by automated systems to improve our services.",
        ]
        print("ℹ️  No test texts provided. Using default samples.")
        print()
    
    test_model(model_path, test_texts, args.threshold)
    return 0


if __name__ == "__main__":
    exit(main())
