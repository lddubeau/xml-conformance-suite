/**
 * A resource loader designed to run in browsers.
 */

"use strict";

const path = require("./browser-path");

class ResourceLoader {
  /**
   * @param {string} base A base directory to add to all paths. This is
   * especially useful for test runners that serve files under a specific
   * prefix. For instance Karma usually serves files under "/base/".
   */
  constructor(base) {
    /** @private */
    this.base = base;
  }

  /**
   * Load a file as a string.
   *
   * @param filePath The file to load.
   *
   * @returns {Promise<string>} The file contents.
   */
  loadFile(filePath) {
    const fullPath = path.join(this.base, filePath);
    return fetch(fullPath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`unable to fetch ${fullPath}`);
        }

        return response.text();
      });
  }
}

exports.ResourceLoader = ResourceLoader;
