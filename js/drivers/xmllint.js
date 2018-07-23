/**
 * THIS IS EXAMPLE CODE. IT IS NOT PART OF THE API AND MAY CHANGE OR DISAPPEAR
 * AT ANY POINT.
 *
 * This module implements a driver for running ``xmllint`` tests.
 *
 * @copyright The contibutors of xml-conformance-suite.
 */

"use strict";

const { spawn } = require("child_process");

const { BaseDriver } = require("./base");

/**
 * A driver for testing ``xmllint``.
 *
 * Note that this driver cannot run in browsers. So it does not use the
 * resourceLoader passed to the driver's constructor.
 */
class Driver extends BaseDriver {
  constructor() {
    super();
    /**
     * The arguments to give to all ``xmllint`` instances created.
     * @protected
     */
    this.arguments = ["--noout"];

    this.canValidate = true;
    this.processesExternalEntities = true;
  }

  run(test, handling) {
    const { resolvedURI } = test;
    // We use getHasDTD() because we do not want to invoke xmllint with
    // ``--validate`` if there is no DTD. In such case, xmllint would fail
    // because there is no DTD for it to validate the file.
    return test.getHasDTD()
      .then(hasDTD => this.makeChild(resolvedURI,
                                     test.testType !== "not-wf" || hasDTD))
      .then((code) => {
        this.processResult(test, handling, code === 0);
      });
  }

  /**
   * Spawn an xmllint child process.
   *
   * @protected
   *
   * @param xmlPath The file to process.
   *
   * @param validate Flag indicating whether to start a validating instance.
   *
   * @returns A promise that resolves when the child is done.
   */
  makeChild(xmlPath, validate) {
    return new Promise((resolve, reject) => {
      // We thought about using --noent but we don't because it has a strange
      // effect. It is as if the entities were replaced **before** validation,
      // and thus may have an effect on validation results.
      const args = [].concat(this.arguments);
      if (validate) {
        args.push("--valid");
      }
      const child = spawn("xmllint", args.concat([xmlPath]));
      let erred = false;
      child.on("exit", (code) => {
        if (erred) {
          return; // Don't both resolve and reject the promise!
        }

        resolve(code);
      });

      child.on("error", (err) => {
        erred = true;
        reject(err);
      });
    });
  }
}

exports.Driver = Driver;
