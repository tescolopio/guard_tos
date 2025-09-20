// jest.node.config.js - Node environment configuration
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/__tests__/**/*.test.js"],
  testTimeout: 60000,
  verbose: true,
  collectCoverage: false,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Remove all setup files to test without them
  setupFiles: [],
  setupFilesAfterEnv: [],
  moduleNameMapper: {
    "\\.(css|less)$": "identity-obj-proxy",
  },
};
