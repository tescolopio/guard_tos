/**
 * @file legalTermsDefinitions.js
 * @description Definitions for legal terms used in the Terms Guardian extension
 * @version 1.0.0
 * @date 2024-10-29
 */

const legalTermsDefinitions = {
  "terms of service":
    "A legal agreement between a service provider and a user that outlines the rules and conditions for using the service.",
  "privacy policy":
    "A legal document that outlines how an organization collects, uses, and protects user data.",
  "user agreement":
    "A contract between a user and a service provider outlining the terms of use.",
  liability: "Legal responsibility for damages or losses.",
  indemnity: "Protection against legal claims or damages.",
  warranty:
    "A guarantee about the quality or performance of a product or service.",
  disclaimer: "A statement that denies legal responsibility.",
  confidentiality: "The practice of keeping information secret or private.",
  "intellectual property":
    "Legal rights to creations of the mind, such as inventions, literary works, and designs.",
  jurisdiction: "The legal authority of a court to hear and decide a case.",
  arbitration: "A method of dispute resolution outside of court.",
  termination: "The end of a legal agreement or contract.",
  breach: "The failure to fulfill a legal obligation.",
  compliance: "The act of following rules, regulations, or laws.",
  consent: "Permission or agreement to something.",
  disclosure: "The act of revealing information.",
  limitation: "A restriction or constraint on legal liability.",
  modification: "A change to the terms of an agreement.",
  notification: "The act of informing someone about something.",
  obligation: "A legal duty or responsibility.",
  provision: "A clause or condition in a legal document.",
  restriction: "A limitation on what can be done.",
  violation: "The act of breaking a rule or law.",
  pursuant: "In accordance with or following.",
  aforementioned: "Previously mentioned or stated.",
  hereinafter: "From this point forward in the document.",
  whereas: "Given that or considering that.",
  notwithstanding: "Despite or in spite of.",
  thereunder: "Under the authority of or in accordance with.",
  hereunder: "Under this document or agreement.",
  thereof: "Of that or from that.",
  hereof: "Of this document or agreement.",
  therein: "In that place or document.",
  hereby: "By means of this document or declaration.",
};

// Export for CommonJS (Node.js/testing environments)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { legalTermsDefinitions };
}

// Export for browser environment
if (typeof window !== "undefined") {
  window.legalTermsDefinitions = legalTermsDefinitions;
}

// Export for global scope
if (typeof global !== "undefined") {
  global.legalTermsDefinitions = legalTermsDefinitions;
}
