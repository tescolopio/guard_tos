/*
  Ensure Webpack loads split chunks from the extension package instead of the page.
  This must run before any other imports in entry bundles that use dynamic imports.
*/
/* eslint-disable no-undef */
(function setWebpackPublicPath() {
  try {
    // Compute base URL for the extension (works in Chrome/Firefox MV3)
    const getURL =
      typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL
        ? chrome.runtime.getURL
        : typeof browser !== "undefined" &&
            browser.runtime &&
            browser.runtime.getURL
          ? browser.runtime.getURL
          : null;

    const base = getURL ? getURL("/") : "/";
    const normalized = base.endsWith("/") ? base : base + "/";

    // Override webpack public path at runtime
    // Webpack replaces this global at build time; assigning updates __webpack_require__.p
    // eslint-disable-next-line camelcase
    __webpack_public_path__ = normalized;
  } catch (e) {
    // Fallback to root; relative loads may fail but won't crash the runtime
    // eslint-disable-next-line camelcase
    __webpack_public_path__ = "/";
  }
})();
