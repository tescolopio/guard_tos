// __tests__/helpers/styleMock.js

/**
 * Mock file for CSS modules
 * This is used by Jest when importing CSS files
 * It can be extended to mock specific CSS modules if needed
 */

module.exports = {
  // Return empty object for regular CSS imports
  __esModule: true,
  default: {},

  // Mock specific CSS classes if needed
  // Example: commonly used classes in your tests
  "highlighted-text": "highlighted-text",
  "legal-term": "legal-term",
  warning: "warning",
  success: "success",
  error: "error",
  info: "info",

  // Mock CSS Module getters
  get: function (key) {
    return key; // Return the key as-is for testing
  },

  // Helper method to check if a class exists
  has: function (key) {
    return Object.prototype.hasOwnProperty.call(this, key);
  },

  // Helper method to get multiple classes
  getAll: function (...keys) {
    return keys.filter((key) => this.has(key)).join(" ");
  },

  // Mock CSS variables
  variables: {
    "--primary-color": "#007bff",
    "--secondary-color": "#6c757d",
    "--success-color": "#28a745",
    "--warning-color": "#ffc107",
    "--error-color": "#dc3545",
    "--info-color": "#17a2b8",
  },
};
