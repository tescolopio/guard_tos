#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Generates a text-based dashboard from model evaluation CSVs."""

import pandas as pd
import argparse
import os

# Constants for report paths
VALIDATION_LOG_PATH = "reports/eval/validation_metrics_log.csv"
ALGORITHMIC_DECISIONS_METRICS_PATH = "reports/eval/algorithmic_decisions_metrics.csv"

def display_welcome_banner():
    """Prints a welcome banner for the dashboard."""
    print("=" * 80)
    print(" " * 25 + "GuardTOS Model Performance Dashboard")
    print("=" * 80)
    print(f"Last Updated: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

def load_data(path, required=False):
    """Loads a CSV file into a pandas DataFrame."""
    if not os.path.exists(path):
        if required:
            raise FileNotFoundError(f"Required report file not found: {path}")
        print(f"Warning: Report file not found at '{path}'. Section will be skipped.")
        return None
    return pd.read_csv(path)

def show_latest_validation_summary(df):
    """Displays the most recent validation run summary."""
    if df is None or df.empty:
        return

    print("-" * 80)
    print("Latest Validation Run Summary")
    print("-" * 80)

    latest_run = df.sort_values(by="run_id", ascending=False).iloc[0]
    run_id = latest_run["run_id"]
    notes = latest_run.get("notes", "N/A")

    print(f"Run ID: {run_id}")
    print(f"Notes: {notes}\n")

    summary_df = df[df["run_id"] == run_id][["label", "precision", "recall", "f1", "precision_delta", "recall_delta"]]
    
    # Prioritize key labels
    key_labels = ["data_collection_extensive", "purpose_broad", "automated_decision"]
    key_metrics = summary_df[summary_df["label"].isin(key_labels)]
    other_metrics = summary_df[~summary_df["label"].isin(key_labels)]

    print("Key Label Performance:")
    print(key_metrics.to_string(index=False))
    
    if not other_metrics.empty:
        print("\nOther Labels:")
        print(other_metrics.to_string(index=False))

def show_algorithmic_decision_trends(df):
    """Displays trends for the 'automated_decision' label."""
    if df is None or df.empty:
        return

    print("\n" + "-" * 80)
    print("Trend: 'automated_decision' Precision & Recall")
    print("-" * 80)

    trend_df = df[df["label"] == "automated_decision"].copy()
    if trend_df.empty:
        print("No data available for 'automated_decision'.")
        return

    trend_df = trend_df.sort_values(by="current_run_id")
    
    print(trend_df[["current_run_id", "precision", "recall", "f1", "precision_delta", "recall_delta"]].to_string(index=False))
    
    # Highlight the most recent change
    if len(trend_df) > 1:
        latest = trend_df.iloc[-1]
        print(f"\nLatest Change ({latest['current_run_id']}): Precision changed by {latest['precision_delta']:.4f}, Recall by {latest['recall_delta']:.4f}")


def main():
    """Main function to generate and display the dashboard."""
    parser = argparse.ArgumentParser(description="Generate a text-based performance dashboard.")
    parser.add_argument(
        "--validation-log",
        default=VALIDATION_LOG_PATH,
        help=f"Path to the validation metrics log CSV. Defaults to '{VALIDATION_LOG_PATH}'.",
    )
    parser.add_argument(
        "--algo-metrics",
        default=ALGORITHMIC_DECISIONS_METRICS_PATH,
        help=f"Path to the algorithmic decisions metrics CSV. Defaults to '{ALGORITHMIC_DECISIONS_METRICS_PATH}'.",
    )
    args = parser.parse_args()

    display_welcome_banner()

    # Load data
    validation_df = load_data(args.validation_log)
    algo_df = load_data(args.algo_metrics)

    # Display sections
    show_latest_validation_summary(validation_df)
    show_algorithmic_decision_trends(algo_df)
    
    print("\n" + "=" * 80)
    print("End of Report")
    print("=" * 80)


if __name__ == "__main__":
    main()
