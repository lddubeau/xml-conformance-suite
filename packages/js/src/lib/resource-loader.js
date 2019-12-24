/**
 * A resource loader designed to run in Node.
 */

"use strict";

const fs = require("fs");
const { promisify } = require("util");

const readFile = promisify(fs.readFile);

class ResourceLoader {
  /**
   * Load a file as a string.
   *
   * @param filePath The file to load.
   *
   * @returns {Promise<string>} The file contents.
   */
  // eslint-disable-next-line class-methods-use-this
  loadFile(filePath) {
    return readFile(filePath).then(x => x.toString());
  }
}

exports.ResourceLoader = ResourceLoader;
