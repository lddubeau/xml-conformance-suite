/**
 * THIS IS EXAMPLE CODE. IT IS NOT PART OF THE API AND MAY CHANGE OR DISAPPEAR
 * AT ANY POINT.
 */

"use strict";

// eslint-disable-next-line import/no-extraneous-dependencies
const sax = require("sax");

const { BaseDriver } = require("./base");

class Driver extends BaseDriver {
  /**
   * @param resourceLoader A resource loader required by for loading test files.
   */
  constructor(resourceLoader) {
    super();
    /** @private */
    this.resourceLoader = resourceLoader;

    this.processesExternalEntities = false;
    this.canValidate = false;
  }

  // eslint-disable-next-line class-methods-use-this
  run(test, handling) {
    const { resolvedURI } = test;
    return this.resourceLoader.loadFile(resolvedURI)
      .then((source) => {
        const errors = [];
        const parser = sax.parser(true, {
          xmlns: !test.forbidsNamespaces,
          strictEntities: true,
        });
        parser.onerror = (err) => {
          errors.push(err);
        };

        parser.write(source);
        parser.close();
        this.processResult(test, handling, errors.length === 0);
      });
  }
}

exports.Driver = Driver;
