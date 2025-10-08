#!/usr/bin/env python3
"""Generate expanded synthetic examples for account management labels.

Creates realistic synthetic examples with more diversity and coverage.
Expanded from 75 to 200+ examples with better label balance.
"""

from __future__ import annotations

import json
import random
from pathlib import Path
from typing import List


# === EASY TERMINATION TEMPLATES (User-friendly cancellation) ===
EASY_TERMINATION_TEMPLATES = [
    "You may terminate your {subscription} at any time from your {location}.",
    "Cancel your {subscription} {timing} with just a few clicks in {location}.",
    "{subscription_capitalized} can be cancelled {timing} through your {location}.",
    "Termination is available {timing} via your {location}.",
    "You can {cancel_verb} your {subscription} {timing} without {obstacle}.",
    "Self-service cancellation is available {timing} in your {location}.",
    "{cancel_action} your {subscription} {timing} online - no {obstacle} required.",
    "You have the right to {cancel_verb} {timing} through {location}.",
    "To {cancel_verb}, simply visit your {location} and click '{button_text}'.",
    "{subscription_capitalized} may be terminated {timing} without penalty or {obstacle}.",
    "Cancel {timing} from {location} - effective immediately.",
    "No {obstacle} needed - just {cancel_verb} from your {location}.",
    "You can {cancel_verb} your {subscription} {timing} online or through our app.",
    "{subscription_capitalized} termination is instant and can be done {timing} via {location}.",
    "We offer {timing} cancellation through {location} with no questions asked.",
]

# === MANUAL CANCELLATION TEMPLATES (Friction through contact requirement) ===
MANUAL_CANCELLATION_TEMPLATES = [
    "To cancel your {subscription}, you must {contact_method} {contact_target}.",
    "{cancellation_action} requires {contact_method} {contact_target}.",
    "You can cancel by {contact_method} {contact_target} at least {timeframe} before {renewal_event}.",
    "{subscription_capitalized} cancellation is only available by {contact_method} {contact_target}.",
    "To {cancel_verb} your {subscription}, please {contact_method} {contact_target}.",
    "Cancellation requests must be submitted by {contact_method} {contact_target}.",
    "You must send a {written_type} to {contact_target} to cancel your {subscription}.",
    "{contact_target_capitalized} must be contacted via {contact_method} to process cancellation.",
    "Online cancellation is not available. Please {contact_method} {contact_target}.",
    "To {cancel_verb}, you must {contact_method} during {business_hours}.",
    "{subscription_capitalized} can only be cancelled by {contact_method} {contact_target}.",
    "Cancellations must be {contact_method} and confirmed by {contact_target}.",
    "You cannot cancel online. A {written_type} to {contact_target} is required.",
    "To stop billing, {contact_method} {contact_target} {timeframe} before renewal.",
    "{cancellation_action} is processed only after {contact_method} {contact_target}.",
]

# === AUTO RENEWAL FRICTION TEMPLATES (Restrictive renewal terms) ===
AUTO_RENEWAL_TEMPLATES = [
    "Your {subscription} will automatically renew unless you cancel at least {timeframe} before the {renewal_event}.",
    "{subscription_capitalized} {auto_verb} {renew_verb} on the {renewal_event}. Cancel {timeframe} in advance to avoid charges.",
    "To avoid automatic renewal, you must cancel {timeframe} before your {renewal_event}.",
    "Cancellations made less than {timeframe} before renewal will not prevent the next billing cycle.",
    "Your {subscription} {auto_verb} {renew_verb} {frequency}. No refunds after renewal.",
    "{subscription_capitalized} continues automatically. You must cancel before {renewal_event} to stop charges.",
    "We will charge your payment method automatically on each {renewal_event} unless cancelled {timeframe} prior.",
    "Automatic renewal occurs {frequency}. You must cancel {timeframe} in advance.",
    "{subscription_capitalized} {auto_verb} {renew_verb} for additional {term} unless you cancel by {renewal_event}.",
    "Cancel at least {timeframe} before renewal or you will be charged for the next {term}.",
    "Your {subscription} commits you to {term} periods. Each period {auto_verb} {renew_verb} automatically.",
    "After the initial {term}, your {subscription} {auto_verb} {renew_verb} {frequency} until cancelled.",
    "No refunds for automatic renewals. Cancel {timeframe} before {renewal_event} to avoid charges.",
    "{subscription_capitalized} will continue indefinitely and charge {frequency} unless you cancel.",
    "To stop automatic billing, cancel no later than {timeframe} before {renewal_event}.",
]

# === GRACE PERIOD TEMPLATES (Post-cancellation access/restoration) ===
GRACE_PERIOD_TEMPLATES = [
    "You have {grace_duration} after cancellation to reactivate your {subscription}.",
    "Your {subscription} data will be retained for {grace_duration} after {termination_event}.",
    "{account_or_data} can be restored within {grace_duration} of {termination_event}.",
    "We provide a {grace_duration} grace period during which you may {reactivation_verb} your {subscription}.",
    "After cancellation, your {account_or_data} remains accessible for {grace_duration}.",
    "You may reverse your cancellation within {grace_duration} of {termination_event}.",
    "{subscription_capitalized} can be {reactivation_verb}ed if you change your mind within {grace_duration}.",
    "Your {account_or_data} will not be deleted for {grace_duration} after {termination_event}.",
    "We hold your data for {grace_duration} allowing you to {reactivation_verb} if needed.",
    "A {grace_duration} window is provided to {reactivation_verb} your {subscription} after {termination_event}.",
    "Following {termination_event}, you have {grace_duration} to {reactivation_verb} without losing data.",
    "Your account remains in our system for {grace_duration} post-{termination_event} for potential {reactivation}.",
    "{account_or_data} is preserved for {grace_duration} after you {cancel_verb} your {subscription}.",
    "If you {cancel_verb} by mistake, you can {reactivation_verb} within {grace_duration}.",
    "There is a {grace_duration} recovery period where your {subscription} can be {reactivation_verb}ed.",
]

# === TEMPLATE VARIABLES ===
SUBSCRIPTIONS = ["subscription", "account", "plan", "service", "membership", "premium account", "paid plan"]
LOCATIONS = ["account settings", "account dashboard", "profile page", "settings menu", "online portal", "user dashboard", "account management page"]
TIMINGS = ["at any time", "anytime", "instantly", "immediately", "at your convenience", "24/7", "whenever you wish"]
OBSTACLES = ["phone call", "written notice", "contacting support", "explanation", "waiting period", "fees", "penalties"]
CANCEL_VERBS = ["cancel", "terminate", "close", "end", "discontinue", "stop"]
CANCEL_ACTIONS = ["Cancel", "Terminate", "Close", "End", "Stop"]
BUTTON_TEXTS = ["Cancel Subscription", "End Membership", "Close Account", "Terminate Service", "Stop Billing"]

CONTACT_METHODS = ["contacting", "calling", "emailing", "writing to", "sending a letter to", "submitting a request via"]
CONTACT_TARGETS = ["customer support", "our support team", "customer service", "us", "our cancellation department", "member services", "account services"]
TIMEFRAMES = ["24 hours", "48 hours", "7 days", "14 days", "30 days", "one week", "two weeks", "one month", "five business days"]
RENEWAL_EVENTS = ["renewal date", "billing date", "subscription end date", "next billing cycle", "anniversary date", "term expiration"]
WRITTEN_TYPES = ["written notice", "cancellation letter", "formal request", "written request", "cancellation form", "termination notice"]
BUSINESS_HOURS = ["business hours", "office hours", "9am-5pm EST", "standard business hours"]

AUTO_VERBS = ["automatically", "will automatically", "will", "shall automatically"]
RENEW_VERBS = ["renew", "continue", "rebill", "charge", "bill", "extend"]
FREQUENCIES = ["monthly", "annually", "yearly", "each billing period", "quarterly", "every month", "each year"]
TERMS = ["month", "year", "billing period", "term", "subscription period", "quarter"]

GRACE_DURATIONS = ["30 days", "60 days", "90 days", "14 days", "two weeks", "one month", "three months", "45 days"]
TERMINATION_EVENTS = ["cancellation", "account closure", "termination", "deletion", "account termination"]
REACTIVATION_VERBS = ["reactivate", "restore", "recover", "reinstate", "resurrect"]
REACTIVATION = ["reactivation", "restoration", "recovery"]
ACCOUNT_OR_DATA = ["Your account", "Your data", "Account information", "Your content", "All data", "Your profile"]


def generate_easy_termination_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic easy_termination examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(EASY_TERMINATION_TEMPLATES)
        
        example = template.format(
            subscription=rng.choice(SUBSCRIPTIONS),
            subscription_capitalized=rng.choice(SUBSCRIPTIONS).capitalize(),
            location=rng.choice(LOCATIONS),
            timing=rng.choice(TIMINGS),
            obstacle=rng.choice(OBSTACLES),
            cancel_verb=rng.choice(CANCEL_VERBS),
            cancel_action=rng.choice(CANCEL_ACTIONS),
            button_text=rng.choice(BUTTON_TEXTS),
        )
        
        examples.append({
            "text": example,
            "labels": ["easy_termination"],
            "source": "synthetic_expanded",
            "category": "account_management",
        })
    
    return examples


def generate_manual_cancellation_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic manual_cancellation examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(MANUAL_CANCELLATION_TEMPLATES)
        
        example = template.format(
            subscription=rng.choice(SUBSCRIPTIONS),
            subscription_capitalized=rng.choice(SUBSCRIPTIONS).capitalize(),
            contact_method=rng.choice(CONTACT_METHODS),
            contact_target=rng.choice(CONTACT_TARGETS),
            contact_target_capitalized=rng.choice(CONTACT_TARGETS).capitalize(),
            cancellation_action=rng.choice(CANCEL_ACTIONS) + "ing",
            cancel_verb=rng.choice(CANCEL_VERBS),
            timeframe=rng.choice(TIMEFRAMES),
            renewal_event=rng.choice(RENEWAL_EVENTS),
            written_type=rng.choice(WRITTEN_TYPES),
            business_hours=rng.choice(BUSINESS_HOURS),
        )
        
        examples.append({
            "text": example,
            "labels": ["manual_cancellation"],
            "source": "synthetic_expanded",
            "category": "account_management",
        })
    
    return examples


def generate_auto_renewal_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic auto_renewal_friction examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(AUTO_RENEWAL_TEMPLATES)
        
        example = template.format(
            subscription=rng.choice(SUBSCRIPTIONS),
            subscription_capitalized=rng.choice(SUBSCRIPTIONS).capitalize(),
            timeframe=rng.choice(TIMEFRAMES),
            renewal_event=rng.choice(RENEWAL_EVENTS),
            auto_verb=rng.choice(AUTO_VERBS),
            renew_verb=rng.choice(RENEW_VERBS),
            frequency=rng.choice(FREQUENCIES),
            term=rng.choice(TERMS),
        )
        
        examples.append({
            "text": example,
            "labels": ["auto_renewal_friction"],
            "source": "synthetic_expanded",
            "category": "account_management",
        })
    
    return examples


def generate_grace_period_examples(count: int, rng: random.Random) -> List[dict]:
    """Generate synthetic grace_period examples."""
    examples = []
    
    for i in range(count):
        template = rng.choice(GRACE_PERIOD_TEMPLATES)
        subscription_choice = rng.choice(SUBSCRIPTIONS)
        
        example = template.format(
            subscription=subscription_choice,
            subscription_capitalized=subscription_choice.capitalize(),
            grace_duration=rng.choice(GRACE_DURATIONS),
            termination_event=rng.choice(TERMINATION_EVENTS),
            reactivation_verb=rng.choice(REACTIVATION_VERBS),
            reactivation=rng.choice(REACTIVATION),
            account_or_data=rng.choice(ACCOUNT_OR_DATA),
            cancel_verb=rng.choice(CANCEL_VERBS),
        )
        
        examples.append({
            "text": example,
            "labels": ["grace_period"],
            "source": "synthetic_expanded",
            "category": "account_management",
        })
    
    return examples


def main():
    """Generate expanded synthetic examples for account management."""
    rng = random.Random(42)
    
    # Generate balanced examples (50 per label = 200 total)
    print("Generating expanded synthetic examples...")
    
    easy_termination = generate_easy_termination_examples(50, rng)
    manual_cancellation = generate_manual_cancellation_examples(50, rng)
    auto_renewal = generate_auto_renewal_examples(50, rng)
    grace_period = generate_grace_period_examples(50, rng)
    
    all_examples = easy_termination + manual_cancellation + auto_renewal + grace_period
    
    # Write to file
    output_path = Path("data/corpus/account_management_synthetic_expanded.jsonl")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with output_path.open("w", encoding="utf-8") as f:
        for ex in all_examples:
            f.write(json.dumps(ex) + "\n")
    
    print(f"\nGenerated {len(all_examples)} total examples:")
    print(f"  ✓ easy_termination: {len(easy_termination)}")
    print(f"  ✓ manual_cancellation: {len(manual_cancellation)}")
    print(f"  ✓ auto_renewal_friction: {len(auto_renewal)}")
    print(f"  ✓ grace_period: {len(grace_period)}")
    print(f"\nWrote to: {output_path}")
    
    # Show samples
    print("\n" + "="*70)
    print("SAMPLE EXAMPLES")
    print("="*70)
    print("\n[EASY TERMINATION]")
    for ex in easy_termination[:3]:
        print(f"  • {ex['text']}")
    print("\n[MANUAL CANCELLATION]")
    for ex in manual_cancellation[:3]:
        print(f"  • {ex['text']}")
    print("\n[AUTO RENEWAL FRICTION]")
    for ex in auto_renewal[:3]:
        print(f"  • {ex['text']}")
    print("\n[GRACE PERIOD]")
    for ex in grace_period[:3]:
        print(f"  • {ex['text']}")


if __name__ == "__main__":
    main()
