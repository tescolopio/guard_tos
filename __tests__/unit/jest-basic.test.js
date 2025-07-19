// Simple test to verify Jest is working
describe("Jest Environment Test", () => {
  test("should run basic test", () => {
    expect(1 + 1).toBe(2);
  });

  test("should have Jest globals", () => {
    expect(typeof jest).toBe("object");
    expect(typeof expect).toBe("function");
  });
});
