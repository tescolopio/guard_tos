/**
 * @file domCheerio.js
 * @description Browser-native cheerio-like wrapper using DOMParser
 * @version 1.0.0
 * @date 2024-10-11
 * 
 * This provides a cheerio-compatible API for content scripts
 * without needing the full cheerio library (which is Node.js only)
 */

function createDomCheerio() {
  /**
   * Load HTML and return a jQuery-like API
   * @param {string} html HTML string to parse
   * @returns {Function} jQuery-like selector function
   */
  function load(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    /**
     * jQuery-like selector function
     * @param {string} selector CSS selector
     * @returns {Object} jQuery-like object with methods
     */
    function $(selector) {
      let elements;
      
      if (selector === 'body') {
        elements = [doc.body];
      } else {
        elements = Array.from(doc.querySelectorAll(selector));
      }
      
      return {
        length: elements.length,
        
        text() {
          return elements.map(el => el.textContent).join(' ');
        },
        
        remove() {
          elements.forEach(el => el.remove());
          return this;
        },
        
        each(callback) {
          elements.forEach((el, index) => {
            const wrapped = {
              text: () => el.textContent,
              tagName: el.tagName.toLowerCase(),
              
              next() {
                const nextEl = el.nextElementSibling;
                return nextEl ? {
                  length: 1,
                  text: () => nextEl.textContent,
                  tagName: nextEl.tagName.toLowerCase()
                } : { length: 0 };
              },
              
              nextUntil(untilSelector) {
                const texts = [];
                let current = el.nextElementSibling;
                
                while (current) {
                  if (untilSelector && current.matches(untilSelector)) {
                    break;
                  }
                  texts.push(current.textContent);
                  current = current.nextElementSibling;
                }
                
                return {
                  text: () => texts.join(' ')
                };
              }
            };
            
            callback(index, wrapped);
          });
          return this;
        }
      };
    }
    
    return $;
  }
  
  return { load };
}

// Export for both module and global contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createDomCheerio };
}

if (typeof window !== 'undefined') {
  window.createDomCheerio = createDomCheerio;
}
