// Constants for legal patterns
const LEGAL_PATTERNS = {
  RIGHTS: {
    POSITIVE: [
      "right to",
      "you may",
      "user can",
      "permitted to",
      "allowed to",
      "grant",
      "entitled to",
      "option to",
    ],
    NEGATIVE: [
      "shall not",
      "may not",
      "prohibited",
      "restricted from",
      "forbidden",
      "waive",
      "forfeit",
      "surrender",
    ],
    OBLIGATIONS: [
      "must",
      "required to",
      "shall",
      "obligated to",
      "responsible for",
      "duty to",
      "agree to",
      "consent to",
    ],
  },
  PRIVACY: [
    "personal data",
    "data protection",
    "privacy policy",
    "confidential",
    "information collection",
    "data retention",
    "data sharing",
    "data usage",
  ],
  LIABILITY: [
    "liability",
    "indemnify",
    "hold harmless",
    "disclaimer of warranties",
    "limitation of liability",
    "no liability",
    "exclusion of liability",
    "liable for",
  ],
  DISPUTE_RESOLUTION: [
    "arbitration",
    "mediation",
    "dispute resolution",
    "governing law",
    "jurisdiction",
    "venue",
    "legal proceedings",
    "settlement",
  ],
  TERMINATION: [
    "terminate",
    "termination",
    "end of agreement",
    "breach of contract",
    "cancel",
    "suspend",
    "revocation",
    "expiration",
  ],
  PAYMENT: [
    "payment terms",
    "fees",
    "charges",
    "billing",
    "refund",
    "invoice",
    "payment due",
    "late payment",
  ],
  INTELLECTUAL_PROPERTY: [
    "intellectual property",
    "copyright",
    "trademark",
    "patent",
    "license",
    "ownership",
    "proprietary rights",
    "use of content",
  ],
  MISCELLANEOUS: [
    "entire agreement",
    "severability",
    "amendment",
    "waiver",
    "assignment",
    "force majeure",
    "notices",
    "third-party beneficiaries",
  ],
  DEFINITIONS:
    /(?:^|\n)\s*["']?\w+["']?\s+(?:shall |means |refers to |is defined as )/im,
  LEGAL_HEADERS:
    /(?:^|\n)(?:terms|privacy|policy|agreement|notice|disclaimer|conditions)/i,
};

// Export the legal patterns
if (typeof window !== "undefined") {
  window.LEGAL_PATTERNS = LEGAL_PATTERNS;
}

// Export for Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = { LEGAL_PATTERNS };
}
