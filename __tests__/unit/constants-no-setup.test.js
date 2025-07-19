// Test without Jest setup files
const { EXT_CONSTANTS } = require("../../src/utils/constants");

describe("Constants Test (No Setup)", () => {
  test("should import constants correctly", () => {
    expect(EXT_CONSTANTS).toBeDefined();
    expect(EXT_CONSTANTS.EXTENSION).toBeDefined();
    expect(EXT_CONSTANTS.EXTENSION.NAME).toBe("Terms Guardian");
  });
});
