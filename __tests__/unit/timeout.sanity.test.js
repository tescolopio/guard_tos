describe("timeout sanity", () => {
  it("should allow a ~12s async test to pass within 60s timeout", async () => {
    const start = Date.now();
    await new Promise((res) => setTimeout(res, 12000));
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(12000);
  });
});
