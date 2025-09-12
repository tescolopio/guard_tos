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
  // Clause-level patterns for rights scoring rubric
  CLAUSES: {
    HIGH_RISK: {
      ARBITRATION: /(binding\s+)?arbitration|arbitral\s+tribunal/i,
      CLASS_ACTION_WAIVER: /class\s+action\s+waiver|waive\s+.*class\s+action/i,
      UNILATERAL_CHANGES:
        /we\s+may\s+modify|we\s+reserve\s+the\s+right\s+to\s+change/i,
      DATA_SALE_OR_SHARING:
        /sell\s+your\s+data|share\s+your\s+personal\s+data/i,
      AUTO_RENEWAL_FRICTION: /auto-?renew(al)?|automatic\s+renewal/i,
      NEGATIVE_OPTION_BILLING: /negative\s+option/i,
      DELEGATION_ARBITRABILITY:
        /exclusive\s+authority\s+to\s+determine\s+arbitrability|arbitrator\s+shall\s+decide\s+arbitrability/i,
    },
    MEDIUM_RISK: {
      ARBITRATION_CARVEOUTS:
        /arbitration\s+except\s+for|small\s+claims\s+court/i,
      VAGUE_CONSENT: /consent\s+.*(implied|deemed)/i,
      LIMITED_RETENTION_DISCLOSURE:
        /retain\s+your\s+data\s+for\s+(a|an)\s+period/i,
      MORAL_RIGHTS_WAIVER:
        /waive\s+(any|all)\s+moral\s+rights|moral\s+rights\s+waive/i,
      JURY_TRIAL_WAIVER:
        /waive\s+(the\s+)?(right\s+to\s+)?(a\s+)?jury\s+trial|jury\s+trial\s+waiver/i,
    },
    POSITIVES: {
      CLEAR_OPT_OUT: /opt-?out\s+(procedure|process)/i,
      SELF_SERVICE_DELETION:
        /(delete|erase)\s+your\s+account|remove\s+your\s+data/i,
      NO_DATA_SALE: /we\s+do\s+not\s+sell\s+(your\s+)?(personal\s+)?data/i,
      TRANSPARENT_RETENTION:
        /(retain|store)\s+data\s+for\s+\d+\s+(days|months|years)/i,
    },
  },
};

// Export the legal patterns
if (typeof window !== "undefined") {
  window.LEGAL_PATTERNS = LEGAL_PATTERNS;
}

// Export for Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = { LEGAL_PATTERNS };
}
