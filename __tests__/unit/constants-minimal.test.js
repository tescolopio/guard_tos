// Minimal constants test to debug hanging issue
describe("Minimal Constants Test", () => {
  test("should load constants without hanging", () => {
    console.log("Test starting...");
    const { EXT_CONSTANTS } = require("../../src/utils/constants");
    console.log("Constants loaded:", !!EXT_CONSTANTS);
    expect(EXT_CONSTANTS).toBeDefined();
    expect(EXT_CONSTANTS.EXTENSION.NAME).toBe("Terms Guardian");
    console.log("Test completing...");
  });
});
