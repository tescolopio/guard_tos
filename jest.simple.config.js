// jest.simple.config.js - Minimal Jest configuration for debugging
module.exports = {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/__tests__/**/*.test.js"],
  testTimeout: 5000,
  // Remove all setup files initially
  // setupFiles: [],
  // setupFilesAfterEnv: [],
  verbose: true,
  collectCoverage: false,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
