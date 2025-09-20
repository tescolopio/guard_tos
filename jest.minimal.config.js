// Jest minimal config
module.exports = {
  testEnvironment: "jest-environment-jsdom",
  testMatch: ["<rootDir>/__tests__/**/*.test.js"],
  testTimeout: 60000,
  forceExit: true,
  detectOpenHandles: true,
};
