"use strict";

const { BaseDriver } = require("./base");

class Driver extends BaseDriver {
  constructor(resourceLoader) {
    super();
    this.canValidate = false;
    this.processesExternalEntities = false;

    /** @private */
    this.resourceLoader = resourceLoader;
  }

  // eslint-disable-next-line class-methods-use-this
  run(test, handling) {
    const { resolvedURI } = test;
    return this.resourceLoader.loadFile(resolvedURI)
      .then((source) => {
        const parser = new DOMParser();
        let doc;

        let failed = false;
        try {
          doc = parser.parseFromString(source, "text/xml");
        }
        catch (ex) {
          // On IE10/11 bad source will cause a SyntaxError.
          if (ex.name !== "SyntaxError" || ex.code !== 12) {
            throw ex;
          }

          failed = true;
        }

        failed = failed ||
          // Firefox
          doc.getElementsByTagNameNS(
            "http://www.mozilla.org/newlayout/xml/parsererror.xml",
            "parsererror")[0] ||
          // Chrome
          doc.getElementsByTagNameNS("http://www.w3.org/1999/xhtml",
                                     "parsererror")[0];

        this.processResult(test, handling, !failed);
      });
  }
}

exports.Driver = Driver;
