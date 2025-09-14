// Test without Jest setup files
const { EXT_CONSTANTS } = require("../../src/utils/constants");

describe("Constants Test (No Setup)", () => {
  test("should import constants correctly", () => {
    expect(EXT_CONSTANTS).toBeDefined();
    expect(EXT_CONSTANTS.EXTENSION).toBeDefined();
    expect(EXT_CONSTANTS.EXTENSION.NAME).toBe("Terms Guardian");
  });

  test("should initialize globals on import", () => {
    // constants.js initializes globals via initializeGlobals at import time
    expect(globalThis.EXT_CONSTANTS).toBeDefined();
    expect(globalThis.EXT_CONSTANTS).toBe(EXT_CONSTANTS);
    expect(globalThis.EXT_CONSTANTS.EXTENSION.NAME).toBe("Terms Guardian");
  });
});
