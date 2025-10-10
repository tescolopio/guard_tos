/*
  Ensure Webpack loads split chunks from the extension package instead of the page.
  This must run before any other imports in entry bundles that use dynamic imports.
  
  For Chrome extensions, content scripts need special handling because they run in
  the page context but load resources from the extension.
*/
/* eslint-disable no-undef */
(function setWebpackPublicPath() {
  try {
    // Check if we're in an extension context
    const isExtension = typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;
    
    if (isExtension) {
      // For content scripts, use chrome.runtime.getURL to get the extension base
      const extensionUrl = chrome.runtime.getURL("/");
      
      // Set webpack's public path to the extension URL
      // eslint-disable-next-line camelcase
      __webpack_public_path__ = extensionUrl;
    } else {
      // Fallback for non-extension contexts (shouldn't happen, but safe)
      // eslint-disable-next-line camelcase
      __webpack_public_path__ = "/";
    }
  } catch (e) {
    // If anything fails, use relative path (may cause issues but won't crash)
    // eslint-disable-next-line camelcase
    __webpack_public_path__ = "";
  }
})();
