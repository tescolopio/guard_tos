# Manual TOS Review Template

- **Document Title:** DuckDuckGo Terms of Service
- **Source Path:** test-pages/all-mocks/test-pages/curated-tos/DuckDuckGo Terms of Service.html
- **Collection Date:** 2025-10-05
- **Reviewer:** GitHub Copilot
- **Review Date:** 2025-10-05

## 1. Document Metadata

| Field | Value |
| --- | --- |
| Primary Domain | duckduckgo.com |
| Document Type | Terms of Service |
| Jurisdiction Notes | Governed by New York law with exclusive New York City venue; references U.S. export controls and EU Digital Services Act complaint channel. |
| Last Updated (from document) | March 7, 2024 |

## 2. Readability

| Metric | Score | Grade | Notes |
| --- | --- | --- | --- |
| Flesch Reading Ease | 35.05 | F | Short overall length but dense legal blocks in warranty and liability sections reduce approachability. |
| Flesch-Kincaid Grade Level | 12.65 | D | High school senior reading level due to compound sentences and defined legal phrases. |
| Gunning Fog Index | 15.87 | D | Concentrated jargon around export controls and liability increases complexity. |
| Manual Observations | — | — | Friendly tone up front, yet abrupt shifts to all-caps legal clauses can disorient readers; navigation relies on inline headings only. |

**Overall Readability Grade:** D (Hard)

## 3. User Rights Index (Manual)

| Category | Manual Score (0-100) | Grade | Key Evidence |
| --- | --- | --- | --- |
| Clarity & Transparency | 72 | C+ | Plain-language introductions for most sections, but reliance on external policies (Privacy, Acceptable Use) for critical details. |
| Data Collection & Use | 82 | B- | Strong anti-tracking statement and privacy-first positioning, yet specifics deferred to the Privacy Policy. |
| User Privacy | 80 | B- | Explicit commitment to not track users and limited data sharing claims; lacks granular controls or deletion mechanisms within the terms. |
| Content Rights | 60 | D | Feedback submissions grant DuckDuckGo a perpetual license without attribution or compensation. |
| Account Management | 65 | D+ | Access can be suspended for policy violations with little process transparency; export-control attestations required. |
| Dispute Resolution | 55 | D | Exclusive New York venue with no arbitration or informal resolution path may burden distant users despite EU complaints channel. |
| Terms Changes | 70 | C | Promises to post updates at a stable URL, but no proactive notice or opt-out beyond ceasing use. |
| Algorithmic Decisions | 62 | D+ | Limited discussion beyond Instant Answers disclosure; no insight into ranking or personalization safeguards. |

**Weighted URI Score (Manual):** 68

**Guardrail Notes:** Key watchpoints include the permanent feedback license, unilateral suspension authority, and reliance on New York courts without consumer-friendly alternatives.

## 4. Overall Summary

DuckDuckGo’s Terms of Service strike a privacy-forward tone—emphasizing the company’s non-tracking stance—while still embedding traditional platform protections. Users benefit from concise language and an explicit "We don’t track you" pledge, yet substantive detail on data handling lives in the Privacy Policy rather than the terms themselves. Liability and warranty clauses revert to standard all-caps disclaimers that sharply limit monetary relief, and venue is fixed in New York courts, which may be impractical for users outside the U.S. Overall risk is moderate: privacy commitments are positive, but dispute resolution access and perpetual rights to user feedback warrant continued monitoring.

## 5. Section Summaries

### Section Index

1. Authorization & Acceptable Use
2. Privacy Commitments
3. Feedback License
4. Third-Party Content & Instant Answers
5. Warranty Disclaimer
6. Limitation of Liability
7. Dispute Resolution & Governing Law
8. Changes & Notifications

### Section: Authorization & Acceptable Use
- **Manual Risk Level:** Medium
- **Rights Categories Impacted:** Account Management, Clarity & Transparency
- **Key Takeaways:** 
  - Use is conditioned on compliance with the Terms, service-specific addenda, and the DuckDuckGo Acceptable Use Policy.
  - Users must abide by export-control laws and represent they are not on restricted lists.
- **Manual Notes:** Suspension language is broad, offering little guidance on remediation or notice before access is removed.

### Section: Privacy Commitments
- **Manual Risk Level:** Low
- **Rights Categories Impacted:** User Privacy, Data Collection & Use
- **Key Takeaways:** 
  - Company reiterates "We don’t track you" and directs users to the Privacy Policy for full practices.
  - Highlights privacy features spanning search, browsing, email, and app protections.
- **Manual Notes:** Positive messaging but lacks embedded controls (e.g., opt-outs, transparency reports) within the terms themselves.

### Section: Feedback License
- **Manual Risk Level:** Medium
- **Rights Categories Impacted:** Content Rights
- **Key Takeaways:** 
  - Any feedback provided grants DuckDuckGo a perpetual, royalty-free license to use suggestions without attribution or compensation.
- **Manual Notes:** Standard SaaS clause, yet scope is broad and could discourage power users from sharing proprietary insights.

### Section: Third-Party Content & Instant Answers
- **Manual Risk Level:** Medium
- **Rights Categories Impacted:** Clarity & Transparency, Algorithmic Decisions
- **Key Takeaways:** 
  - DuckDuckGo disclaims control over third-party sites and Instant Answer sources, offering no accuracy guarantees.
  - Users must contact hosting sites for takedowns; DuckDuckGo provides a reporting channel for IP complaints.
- **Manual Notes:** Transparency about sourcing is welcome, but lack of recourse if Instant Answers misstate facts leaves users exposed.

### Section: Warranty Disclaimer
- **Manual Risk Level:** High
- **Rights Categories Impacted:** Liability & Remedies
- **Key Takeaways:** 
  - Services provided "as is," with explicit denial of all implied warranties (merchantability, fitness, non-infringement).
  - No assurances on security, uptime, or error correction.
- **Manual Notes:** Aggressive disclaimer, though common in the industry; capitalized formatting underscores its importance.

### Section: Limitation of Liability
- **Manual Risk Level:** High
- **Rights Categories Impacted:** Liability & Remedies, Dispute Resolution
- **Key Takeaways:** 
  - Excludes consequential and punitive damages; caps total liability at the greater of fees paid in prior 12 months or $100.
  - Applies to the company, subsidiaries, and associated parties.
- **Manual Notes:** $100 cap is low given free usage, effectively leaving minimal recovery options for most users.

### Section: Dispute Resolution & Governing Law
- **Manual Risk Level:** Medium
- **Rights Categories Impacted:** Dispute Resolution
- **Key Takeaways:** 
  - New York law governs; lawsuits must be filed in New York state or federal courts.
  - EEA users receive an internal complaints channel under the EU Digital Services Act.
- **Manual Notes:** No arbitration or class-action waiver, but the single venue requirement can deter non-U.S. claimants and lacks small-claims carve-outs.

### Section: Changes & Notifications
- **Manual Risk Level:** Medium
- **Rights Categories Impacted:** Terms Changes
- **Key Takeaways:** 
  - Updates posted at the terms URL with effective "Last updated" date and banner for substantive changes.
  - Continued use signals acceptance of new terms.
- **Manual Notes:** Transparency via public posting is helpful; still no commitment to direct notice or archived change logs.

## 6. Uncommon / Legal Terms Requiring Definitions

| Term | Manual Definition / Context | Reference |
| --- | --- | --- |
| "Acceptable Use Policy" | Ancillary rules governing prohibited conduct (spam, security testing, harassment) linked from the terms. | Authorization section |
| "Instant Answers" | DuckDuckGo’s knowledge panel results that surface synthesized information from third-party sources. | Third-Party Content section |
| "Export Controls" | U.S. regulations restricting access by sanctioned individuals or countries, which users must attest they comply with. | Authorization section |

## 7. Additional Observations

- Shorter document length and conversational tone improve accessibility compared with peers, yet legal clauses remain highly standardized.
- Internal complaints handling process for EEA users is a positive compliance signal but lacks detail on timelines or outcomes.
- No guidance on data portability or account deletion, suggesting users must rely on privacy tools or external documentation for lifecycle controls.

---

**Attachments:** None.
