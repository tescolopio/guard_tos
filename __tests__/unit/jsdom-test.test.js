// Test jsdom environment directly
const { JSDOM } = require("jsdom");

describe("JSDOM Environment Test", () => {
  test("should work with jsdom", () => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
    global.window = dom.window;
    global.document = dom.window.document;

    expect(document.body).toBeDefined();
    expect(window).toBeDefined();

    // Clean up
    dom.window.close();
  });
});
