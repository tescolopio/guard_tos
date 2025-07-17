// Quick test to verify Jest configuration works
describe("Jest Configuration Test", () => {
  test("should run basic test", () => {
    expect(1 + 1).toBe(2);
  });

  test("should handle async operation", async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });
});
