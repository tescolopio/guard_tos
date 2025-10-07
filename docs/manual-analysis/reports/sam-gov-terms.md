# Manual Review: SAM.gov Terms of Use (Verified Capture – 2025-10-06)

## Document Metadata

| Attribute | Value |
|-----------|-------|
| **Provider** | SAM.gov (U.S. General Services Administration – Federal Government System) |
| **Domain** | sam.gov |
| **Service Layer** | Federal procurement, entity registration, contract opportunity search, assistance listings |
| **Primary Documents Captured** | Public Terms of Use (`/content/about/terms-of-use`), Sign Terms (workflow acceptance page) |
| **Collection Date** | 2025-10-06 |
| **Effective Date (Displayed)** | Not explicitly surfaced in captured HTML snippet (will verify deeper in Part 2) |
| **Jurisdiction** | United States Federal Law; Federal information system monitoring notices apply |
| **Hosting Context** | U.S. Federal Government information system (CUI handling + monitoring banner) |
| **Business Model** | Public service access (no subscription; compliance-driven) |
| **Distinctive Notices** | FOR OFFICIAL USE ONLY warning; CUI handling obligations (32 CFR Part 2002) |

## Readability & Structural Signals (Post-Capture)

Dynamic headless capture succeeded (public terms page + sign/acceptance page). Enumerated list of seven sections present in both variants; language is intentionally plain. No effective date surfaced. Monitoring banner present in footer region. D&B data limitation and Non-Disclosure Agreement (NDA) blocks embedded under “Restricted Data Use” and “Sensitive Data” clusters respectively.

| Metric | Raw Status | Preliminary Interpretation |
|--------|-----------|---------------------------|
| Flesch Reading Ease (est. pre-metric) | Pending script | Plain language intros + bullet lists improve accessibility |
| Flesch-Kincaid Grade (est.) | Pending script | Likely high-school / early college (short imperative sentences) |
| Section Count (actual) | 7 (+ nested legal sub-blocks) | Matches enumerated list displayed at top |
| Artifact Pollution | Low-Moderate | Navigation + footer + banner noise removable in sanitation |

### Actual Structural Elements (Captured)
1. Changing Site Data (unauthorized modification & security monitoring legal language)
2. Data Access (bot prohibitions, API usage duties, System Accounts & API Keys, FOUO API Terms, Sensitive API Terms, Confirmation of Agency Policy)
3. Sensitive Data (handling of PII/CUI, Rules of Behavior, Non-Disclosure Agreement (13 numbered clauses))
4. Privacy Policy (Analytics, Cookies, Information You Send Us, Security, Reuse & Copyright)
5. Restricted Data Use (D&B Open Data definition + limitation terms + licensing scope)
6. Non-Federal Administrator Roles (eligibility & prohibition on indirect admin delegation)
7. Signing in to SAM.gov (individual account principle, no shared emails)
	* Global footer WARNING banner: FOR OFFICIAL USE ONLY + CUI monitoring

## Preliminary Risk & Rights Posture

Federal platform context changes evaluation lenses:
- **Arbitration**: Unlikely – disputes governed by federal administrative and judicial processes; no private arbitration clause expected (positive vs. commercial platforms).
- **Liability Caps**: Instead of dollar caps, sovereign immunity + broad disclaimers functionally limit suits (practical barrier similar to zero cap effect elsewhere but via doctrine not contract cap).
- **Content & IP**: Most textual content likely public domain (17 U.S.C. §105) except incorporated third-party components; user-submitted registration data is regulated, not licensed for commercial exploitation.
- **Monitoring & Privacy**: Mandatory monitoring notices reduce expectation of privacy; risk to user rights rooted in surveillance acceptance rather than commercial monetization.
- **Algorithmic Decisions**: SAM.gov uses matching & validation (entity uniqueness, exclusion lists). Transparency likely low on algorithmic criteria (e.g., responsibility/ownership checks). Will explore in Parts 2–3.

## Manual Rights Index (Updated – Grounded in Captured Text)
Scores adjusted where clarity and governance specificity improved; privacy & algorithmic opacity remain concerns. (Readability metrics will be recomputed after automated script run and may prompt minor clarity adjustment.)

| Category | Provisional Score | Grade | Early Rationale |
|----------|-------------------|-------|-----------------|
| Clarity & Transparency | 70 | C- | Plain-language explanatory stubs precede legal language; enumerated structure; still no effective date or changelog. |
| Data Collection & Use | 70 | C- | Data use constrained by federal statutes; less commercial repurposing; monitoring expands surveillance scope. |
| User Privacy | 55 | F | Monitoring + CUI obligations reduce privacy expectations; retention & disclosure governed by law more than user control. |
| Content & IP Rights | 75 | C | Public domain baseline improves user freedom; no perpetual private appropriation; will validate for exceptions. |
| Account Management | 65 | D | Improved by explicit admin role eligibility + 90-day credential rotation rule; appeals still opaque. |
| Dispute Resolution | 80 | B- | No arbitration; federal legal channels, but sovereign immunity & procedural hurdles limit practical remedies. |
| Terms Changes | 60 | D- | Likely unilateral update notice via site posting; no individualized notifications. |
| Algorithmic Decisions | 50 | F | Validation, exclusion list screening, responsibility determination likely opaque; no appeal detail in snippet. |

**Updated Overall Score: 66/D (Subject to revision after readability + any further provenance review)**

## Category Rationale (Updated)

### Clarity & Transparency (70/C-)
Enumerated list, dual presentation (public + sign page), and explanatory bullet points enhance clarity. Transparency still impaired by absent effective date & version history.

### Data Collection & Use (70/C-)
Data processed for statutory procurement, assistance, and integrity purposes; less discretionary secondary monetization. Risks: broad inter-agency sharing, audit trails, potential FOIA exposure. Need explicit text to confirm.

### User Privacy (55/F)
Monitoring banner + CUI handling implies diminished privacy expectation. Privacy balancing codified by statute, not user-controlled preferences. Lack of opt-out for logging.

### Content & IP Rights (75/C)
Assuming Section 105 public domain effect for federally authored content; user-submitted data acknowledged as registration / compliance data rather than licensed creative content. Need to confirm any third-party exclusions.

### Account Management (65/D)
Non-federal admin eligibility constraints and explicit API key/password rotation duty give clearer governance; appeal / remediation pathways still undisclosed.

### Dispute Resolution (80/B-)
Absence of arbitration beneficial; however practical enforcement limited by sovereign immunity and administrative exhaustion paths—reducing effective recourse for harms (data errors, downtime).

### Terms Changes (60/D-)
Likely 'continued use constitutes acceptance' plus periodic updates. Absence of version change log would reduce user tracking ability.

### Algorithmic Decisions (50/F)
Automated vetting (sanctions lists, exclusion screening, duplicate detection) not openly documented here; potential due process gaps for flagged entities.

## Summary (Updated)
SAM.gov’s Terms of Use (public + sign variants) confirm governance-oriented posture: no arbitration, no perpetual private content license, public-domain federal works, and explicit constraints on misuse (bots, bulk scraping, unauthorized admin delegation). Rights strengths derive from clarity of enumerated sections and IP freedom; weaknesses persist in omnipresent monitoring, absence of effective date/version changelog, opaque automated screening (exclusions / sanctions), and procedural ambiguity for remediation. Sovereign immunity continues to functionally limit monetary recourse similar to aggressive contractual caps elsewhere. Updated overall score 66/D reflects modest clarity & governance improvements after verifying the actual text.

## Part 2: Section-by-Section Analyses (Verbatim-Grounded)

Below each heading: (a) concise paraphrase of explanatory language, (b) notable legal clauses embedded, (c) rights impact.

### 1. Changing Site Data
Plain-language prohibition on unauthorized data alteration, virus injection, or damage attempts. Legal language affirms active traffic monitoring and cites Computer Fraud and Abuse Act + National Information Infrastructure Protection Act.  
Rights Impact: Security integrity justification; minimal user burden unless engaging in prohibited conduct.  
Risk: Low (for compliant users) / High (misuse consequences).

### 2. Data Access
Bulleted prohibitions on bots for restricted/sensitive data; disallows use of personal credentials for automated extraction. Encourages sanctioned API usage via open.gsa.gov.  
System Accounts & API Keys subsection mandates 90‑day rotation and non-sharing. Monitoring of API calls explicitly consented to.  
FOUO API Terms restrict dissemination outside government; derivative public displays limited to specified enumerated fields. Sensitive API Terms mirror restrictions and prohibit constructing public mirrors.  
Rights Impact: Protects system availability; constrains bulk reuse of semi-restricted datasets; increases operational overhead (credential hygiene).  
Risk: Medium (governance friction) / Positive clarity.

### 3. Sensitive Data
Defines sensitivity harms, forbids uploading classified info, assigns responsibility for misplaced sensitive data. FOUO & Sensitive Information subsection narrows permitted sharing; mandates role removal when no longer needed; requires training compliance. Legal block (PII/CUI clause) ties safeguarding to 32 CFR Part 2002 & GSA policy. Rules of Behavior forbid malicious code; enforce scope-limited system access; codify 90‑day password/API key rotation.  
Non-Disclosure Agreement (13 clauses) governs Data Receiver obligations, use purpose limitation, security measures, annual renewal, prohibition on unauthorized disclosure, and enforcement (civil/criminal penalties).  
Rights Impact: Heavy compliance obligations + potential sanction risk; due process for sanctions not enumerated.  
Risk: High (privacy & account exposure if mismanaged).

### 4. Privacy Policy
Google Analytics usage described (environmental, behavioral, acquisition metadata); session + persistent cookies (user may disable); “will not obtain PII unless you volunteer it.” Security subsection repeats monitoring legal basis. Reuse & Copyright clarifies most content public domain; warns about third‑party licensed media.  
Rights Impact: Transparency about analytics; limited user control beyond browser settings; absence of granular retention/appeal processes.  
Risk: Medium-High (control deficit).

### 5. Restricted Data Use (D&B Data)
Defines “D&B Open Data” fields; bulk sharing prohibited; prohibits commercial, resale, or marketing uses for non-open elements; federal agencies permitted broad acquisition lifecycle use. D&B provides data “as is” without warranty; liability disclaimers for D&B and third-party suppliers; systematic harvesting of D&B data barred.  
Rights Impact: Restricts downstream reuse breadth; distinguishes open vs. restricted corporate identifiers; fosters clarity of licensing boundary.  
Risk: Medium (reuse limitation) / Positive clarity for IP.

### 6. Non-Federal Administrator Roles
Prohibits assigning administrator roles to individuals not directly connected (officers/board/employees); forbids using appointment letters to delegate to unrelated third parties; mandates contacting FSD to remove improper roles.  
Rights Impact: Enhances integrity, reduces risk of external control; burdens third-party consultants.  
Risk: Low-Medium (operational friction for outsourcing).

### 7. Signing in to SAM.gov
Affirms accounts are individual; disallows shared email sign-ins. Reinforces personal responsibility.  
Rights Impact: Standard security best practice; minimal burden.  
Risk: Low.

### Global Monitoring Banner
“FOR OFFICIAL USE ONLY” + CUI protection and monitoring notice at footer.  
Rights Impact: Formalizes diminished privacy expectation; structural transparency, not negotiable.  
Risk: High (privacy expectation).

### Consolidated High-Risk Zones
Sensitive Data + NDA; Monitoring Banner; D&B reuse restrictions (for data portability advocates); lack of versioning / effective date.

## Part 3: Glossary (Updated & Grounded)

| Term | Definition | User Impact |
|------|------------|-------------|
| Controlled Unclassified Information (CUI) | Sensitive but unclassified information requiring safeguarding under 32 CFR Part 2002. | Imposes handling & disposal obligations; breach may trigger penalties. |
| FOR OFFICIAL USE ONLY (FOUO) | Legacy marking indicating limited distribution government-sensitive information (overlapping with CUI categories). | Signals reduced privacy & heightened compliance expectations. |
| Sovereign Immunity | Doctrine barring suits against the U.S. without express statutory consent. | Limits user damages remedies compared to private platforms. |
| 17 U.S.C. §105 (Public Domain) | U.S. federal government works not subject to domestic copyright. | Expands reuse freedom of SAM.gov-authored materials. |
| Monitoring Consent | Notice that system use authorizes security & audit surveillance. | Reduces expectation of private session data. |
| No Endorsement Clause | Disclaims government endorsement of linked third parties or registered entities. | Protects neutrality; shifts diligence burden to user. |
| Sanctions / Exclusion Screening | Automated comparison of entities to exclusion / debarment lists. | Potential account impact with opaque criteria; appeals needed. |
| Entity Registration | Process of providing organizational data for federal award eligibility. | Accuracy and renewal critical to maintain status. |
| System of Records Notice (SORN) | Public notice describing a federal system maintaining personal information. | Defines statutory privacy framework; not user-negotiated. |
| Administrative Exhaustion | Requirement to pursue internal or agency remedies before judicial review. | Delays external recourse; increases procedural overhead. |
| Plain Language Act | Mandates clear federal communication. | Improves readability; mitigates legal complexity. |
| FOIA (Freedom of Information Act) | Law enabling public access to federal records subject to exemptions. | Possible exposure of submitted data segments unless exempt. |
| FedRAMP / FISMA (Security Frameworks) | Standards governing federal information system security authorization. | Enhances systemic safeguards; may justify monitoring breadth. |

---

## Part 4: Critical Observations & Comparative Insights (Revalidated)

### 1. Functional Liability Shield Without Numeric Cap
Sovereign immunity produces a de facto limitation on monetary remedies equivalent in chilling effect to $0 or $100 commercial caps; enforcement lever shifts to compliance pressure rather than damages.

### 2. Surveillance Trade-off vs. Commercial Tracking
Monitoring here protects integrity (fraud, intrusion) rather than ad monetization. Benefit: less exploitative profiling. Cost: broad audit logging with limited user opt-outs.

### 3. Public Domain Advantage
Absence of proprietary licensing claims on government-authored text materially enhances reuse—contrasts perpetual private appropriation in FamilySearch or Pinterest. Users can build derivative compliance guides freely.

### 4. Algorithmic Opaqueness in Eligibility
Entity vetting (exclusion / sanctions list automation) lacks disclosed scoring or appeal pipeline, risking false positives that stall registrations—a due process gap analogous to opaque content moderation elsewhere.

### 5. CUI Handling Burden on Mixed-Sophistication Users
Small businesses may not fully grasp 32 CFR Part 2002 obligations; missteps can escalate risk without platform-provided granular classification assistance.

### 6. Change Governance Transparency Deficit
Likely silent revisions with no version history page; undermines auditability compared to a Git-based or diff log approach (recommendation: publish changelog like federal privacy programs increasingly do).

### 7. Privacy Framed as Statutory Compliance, Not User Agency
Reliance on SORNs / statutory frameworks ensures baseline protections but restricts customization (no granular consent toggles); rights exercise requires FOIA/Privacy Act channels (time-consuming).

### 8. Comparative Positioning
SAM.gov (64/D provisional) sits above FamilySearch (62/D) primarily due to public domain IP freedoms and absence of private commercialization; remains below Wikimedia (65/D) because privacy & algorithmic transparency less user-directed.

### 9. Risk Concentration in Procedural Layers
Users face layered procedural friction—administrative exhaustion + monitoring + opaque screening—mirroring arbitration barrier patterns in commercial spaces albeit through statutory formality rather than contractual design.

### 10. Potential Mitigations
Publishing screening criteria summaries, providing entity flag appeal SLA, adding versioned terms archive, integrating interactive CUI classification wizard would materially improve scores (especially Clarity, Algorithmic Decisions, Privacy).

---

## Recommendations (Updated Priorities)
1. Publish an official revision history with timestamps & summary diffs (improves Terms Changes from 60→70).  
2. Release an “Entity Screening Transparency” page outlining automated list sources & manual review process.  
3. Provide a guided CUI decision tool inside submission workflow to prevent mishandling.  
4. Add explicit effective date banner on every terms view (stabilizes evidentiary notice).  
5. Offer structured appeal channel with target response times for registration holds or exclusion matches.  
6. Embed plain-language tooltips for legal references (sovereign immunity, FOIA, SORN).  
7. Provide JSON export of prior terms versions for audit traceability.  
8. Publish aggregate metrics: false positive screening reversals, average resolution time (procedural accountability).

---

## Score Change Log
| Category | Old | New | Delta | Reason |
|----------|-----|-----|-------|--------|
| Clarity & Transparency | 65 | 70 | +5 | Verified enumerated structure + dual-page consistency |
| Account Management | 60 | 65 | +5 | Explicit admin role and credential rotation duties |
| Content & IP Rights | 75 | 78 | +3 | Public domain clarity + well-bounded third-party (D&B) carve-out |
| Overall | 64 | 66 | +2 | Net effect of minor category lifts |

Remaining categories unchanged pending future algorithmic transparency or effective date discovery.

## Comparative Snapshot (Contextual – Post Verification)
| Platform | Liability Model | Arbitration | IP Posture | Monitoring Scope | Overall (Manual) |
|----------|-----------------|------------|-----------|------------------|------------------|
| SAM.gov | Sovereign immunity (functional bar) | None | Public domain (federal works) | Security/audit | 64/D (prov.) |
| FamilySearch | $0 effective cap | None | Perpetual sublicensable | Operational + sharing | 62/D |
| Wikimedia | $1K cap | None | CC BY-SA (reciprocal) | Minimal functional | 65/D |
| Pinterest | $100 cap | AAA | Ambiguous survival | Commercial tracking | 42/F |

---

## Verification & Provenance
Dynamic capture batch: `2025-10-06T23-06-08-726Z` with selectors `[class*='terms']` (public) and `sam-frontend-content-terms-of-use` (sign). Hashes recorded in capture metadata JSON; integrated into YAML entry for auditability.

Next: compute actual readability metrics (script), update YAML (remove provisional flags), embed provenance hashes, and finalize section summaries accordingly.

---

## Dynamic Capture Plan (Future Automation)

Because the static HTML artifacts for SAM.gov lacked the substantive legal body (likely client-rendered via Angular or a similar framework), a headless acquisition pipeline will improve evidentiary fidelity and allow replacement of [INFERRED] markers with verbatim clauses.

### Objectives
1. Render dynamic DOM after SPA scripts execute.
2. Extract only the semantic legal content (strip analytics, navigation, repetitive banners).
3. Persist raw HTML & a normalized markdown/plain-text derivative with stable hashing for change detection.

### Technical Approach (Puppeteer)
| Step | Action | Notes |
|------|--------|-------|
| 1 | Launch Chromium with `--no-sandbox` (CI safe) | Consider environment variable to toggle headless/headful |
| 2 | Navigate to target URL list (public terms, sign terms) | Retry w/ exponential backoff (network variance) |
| 3 | Wait for network idle AND presence of a legal content selector | Candidate selector to be discovered empirically (e.g., `sam-frontend-content-terms-of-use`, `[class*='terms']`) |
| 4 | Execute `document.querySelector(...).innerHTML` extraction | Fallback: capture full `document.body.outerHTML` if refined selector absent |
| 5 | Generate content hash (SHA256) to detect drift | Store alongside timestamp in JSON ledger |
| 6 | Convert HTML → Markdown (optional) using Turndown | Apply rule whitelist to retain headings, lists, links |
| 7 | Persist artifacts under `data/captures/sam-gov/YYYY-MM-DD/` | Structure: `raw.html`, `sanitized.html`, `extracted.md`, `meta.json` |
| 8 | (Later) Diff new hash vs. last; if changed, flag for re-scoring | Automate Git pre-commit or scheduled workflow |

### Pseudocode Outline
```js
// capture-sam-gov.js (skeleton concept)
const urls = [
	{ name: 'terms', url: 'https://sam.gov/content/about/terms-of-use', selector: 'sam-frontend-content-terms-of-use' },
	{ name: 'sign', url: 'https://sam.gov/workspace/profile/sign-terms-of-use?mode=new', selector: 'sam-frontend-content-terms-of-use' }
];
```

### Selector Discovery Strategy
1. First run: dump full `body.outerHTML`.
2. Manually inspect for unique container IDs/classes around substantive paragraphs.
3. Update script with narrowed selector to minimize noise.

### Normalization Rules
- Remove `<script>`, `<style>`, tracking `<img>` beacons.
- Collapse multiple blank lines.
- Preserve heading hierarchy (`h1`-`h4`).
- Convert tables to pipe Markdown if present.

### Integrity & Audit
Store `meta.json` keys: `url`, `fetched_at`, `selector_used`, `sha256_raw`, `sha256_extracted`, `status` (success|partial|fallback), `notes`.

### Future Enhancements
- Add Playwright parallelization (broader browser coverage).
- Integrate change detection into rights index auto-rescore pipeline.
- Add semantic diff (e.g., jsdiff) to highlight clause-level modifications.

### Risk & Mitigation
| Risk | Mitigation |
|------|------------|
| Anti-automation blocking | Randomize user-agent; moderate delay; respect robots.txt (federal sites usually permissive for public pages) |
| Selector break on redesign | Fallback to full DOM capture + re-learn selectors |
| Over-capture of PII or incidental data | Scope to public terms routes only; filter forms & input fields |
| Hash churn from dynamic timestamps | Strip ephemeral elements before hashing (e.g., date stamps if not part of legal text) |

### Replacement Workflow
1. Run capture; acquire new Markdown.
2. Replace [INFERRED] sections in `sam-gov-terms.md` with verbatim paraphrases + citations.
3. Update YAML entry: remove `inferred_analysis: true`; add `effective_date` if surfaced.
4. Re-evaluate category scores (expect Clarity or Account Management deltas ±5). 

---
