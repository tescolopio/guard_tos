// Progressive constants test to identify hanging point
const { EXT_CONSTANTS } = require("../../src/utils/constants");

describe("Progressive Constants Test", () => {
  test("should load extension constants", () => {
    console.log("Testing extension constants...");
    expect(EXT_CONSTANTS.EXTENSION.NAME).toBe("Terms Guardian");
    expect(EXT_CONSTANTS.EXTENSION.VERSION).toBe("1.0.0");
    console.log("Extension constants OK");
  });

  test("should load detection constants", () => {
    console.log("Testing detection constants...");
    expect(EXT_CONSTANTS.DETECTION.INTERVAL_MS).toBe(5000);
    expect(EXT_CONSTANTS.DETECTION.THRESHOLDS.AUTO_GRADE).toBe(20);
    console.log("Detection constants OK");
  });

  test("should load analysis constants", () => {
    console.log("Testing analysis constants...");
    expect(EXT_CONSTANTS.ANALYSIS.PERFORMANCE_THRESHOLDS.TEXT_PROCESSING).toBe(
      100,
    );
    expect(EXT_CONSTANTS.ANALYSIS.PERFORMANCE_THRESHOLDS.API_CALL).toBe(2000);
    console.log("Analysis constants OK");
  });

  test("should load message constants", () => {
    console.log("Testing message constants...");
    expect(EXT_CONSTANTS.MESSAGES.AUTO_GRADE).toBeDefined();
    expect(EXT_CONSTANTS.MESSAGES.SIGNIFICANT_TERMS).toBeDefined();
    console.log("Message constants OK");
  });
});
