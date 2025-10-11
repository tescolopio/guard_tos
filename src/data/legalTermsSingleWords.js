/**
 * @file legalTermsSingleWords.js
 * @description Single-word legal terms for efficient detection in ToS documents
 * @version 1.0.0
 * @date 2025-10-11
 * 
 * This list contains individual legal words (not phrases) that commonly appear
 * in Terms of Service, Privacy Policies, and other legal documents.
 * These terms are optimized for word-by-word matching during text analysis.
 */

const legalTermsSingleWords = [
  // Core legal terms
  'agreement', 'terms', 'conditions', 'service', 'user', 'policy', 'privacy',
  'legal', 'notice', 'disclaimer', 'warranty', 'liability', 'indemnity',
  
  // Agreement and binding language
  'agree', 'accept', 'consent', 'acknowledge', 'binding', 'bound', 'contract',
  'contractual', 'obligation', 'obligated', 'covenant', 'undertake',
  
  // Rights and permissions
  'rights', 'license', 'grant', 'permission', 'authorize', 'entitled',
  'permitted', 'allowed', 'prohibited', 'restrict', 'restriction',
  
  // Dispute resolution
  'arbitration', 'arbitrator', 'arbitral', 'dispute', 'litigation', 'mediation',
  'tribunal', 'jurisdiction', 'venue', 'governing', 'forum',
  
  // Waivers and limitations
  'waive', 'waiver', 'waiving', 'forfeit', 'relinquish', 'surrender',
  'limitation', 'limited', 'exclude', 'exclusion', 'disclaim',
  
  // Class actions
  'class', 'collective', 'representative', 'consolidated', 'joinder',
  
  // Liability and damages
  'liable', 'damages', 'indemnify', 'indemnification', 'compensate',
  'compensation', 'remedy', 'remedies', 'consequential', 'incidental',
  'punitive', 'exemplary',
  
  // Termination
  'terminate', 'termination', 'suspend', 'suspension', 'cancel',
  'cancellation', 'revoke', 'revocation', 'discontinue',
  
  // Modifications
  'modify', 'modification', 'amend', 'amendment', 'change', 'update',
  'revise', 'revision', 'alter', 'alteration',
  
  // Data and privacy
  'data', 'personal', 'information', 'collect', 'collection', 'processing',
  'process', 'share', 'sharing', 'transfer', 'disclose', 'disclosure',
  'retention', 'storage', 'delete', 'deletion', 'erasure',
  
  // GDPR/CCPA terms
  'gdpr', 'ccpa', 'controller', 'processor', 'subject', 'portability',
  'consent', 'withdraw', 'opt-out', 'opt-in',
  
  // Intellectual property
  'intellectual', 'property', 'copyright', 'trademark', 'patent',
  'proprietary', 'infringement', 'infringe',
  
  // Content and usage
  'content', 'material', 'submission', 'upload', 'post', 'publish',
  'reproduce', 'distribution', 'derivative', 'sublicense',
  
  // Payment and billing
  'payment', 'fee', 'charge', 'billing', 'subscription', 'renewal',
  'auto-renew', 'refund', 'purchase', 'transaction',
  
  // Compliance and law
  'comply', 'compliance', 'violation', 'violate', 'breach', 'enforce',
  'enforcement', 'applicable', 'regulation', 'statute', 'law',
  
  // Legal formalities
  'hereby', 'herein', 'hereinafter', 'thereof', 'therein', 'thereunder',
  'hereof', 'hereunder', 'whereas', 'whereby', 'notwithstanding',
  'pursuant', 'aforementioned', 'foregoing', 'aforesaid',
  
  // Representations and warranties
  'represent', 'representation', 'warrant', 'warranties', 'guarantee',
  'assurance', 'certify', 'certification',
  
  // Indemnification
  'defend', 'hold', 'harmless', 'indemnitor', 'indemnitee', 'losses',
  
  // Force majeure
  'force', 'majeure', 'act', 'god', 'unforeseen', 'beyond', 'control',
  
  // Severability and integration
  'severable', 'severability', 'entire', 'integration', 'supersede',
  'merger', 'constitute', 'constitutes',
  
  // Assignment
  'assign', 'assignment', 'delegate', 'delegation', 'successor',
  
  // Notices
  'notify', 'notification', 'notice', 'inform', 'communication',
  
  // Confidentiality
  'confidential', 'confidentiality', 'proprietary', 'secret', 'non-disclosure',
  
  // Account and access
  'account', 'username', 'password', 'credentials', 'access', 'authenticate',
  'authentication', 'verify', 'verification',
  
  // Prohibited conduct
  'unlawful', 'illegal', 'fraudulent', 'abusive', 'harass', 'harassment',
  'defamatory', 'obscene', 'offensive', 'malicious',
  
  // Third parties
  'third-party', 'affiliate', 'subsidiary', 'vendor', 'supplier', 'partner',
  
  // Miscellaneous legal
  'jurisdiction', 'judicial', 'court', 'tribunal', 'injunction', 'equitable',
  'remedy', 'relief', 'attorney', 'legal', 'counsel', 'prevailing', 'party'
];

// Export for CommonJS (Node.js/webpack/content scripts)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { legalTermsSingleWords };
}

// Export for browser environment
if (typeof window !== 'undefined') {
  window.legalTermsSingleWords = legalTermsSingleWords;
}

// Export for global scope
if (typeof global !== 'undefined') {
  global.legalTermsSingleWords = legalTermsSingleWords;
}
