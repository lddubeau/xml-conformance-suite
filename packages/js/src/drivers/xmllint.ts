/**
 * THIS IS EXAMPLE CODE. IT IS NOT PART OF THE API AND MAY CHANGE OR DISAPPEAR
 * AT ANY POINT.
 *
 * This module implements a driver for running ``xmllint`` tests.
 *
 * @copyright The contibutors of xml-conformance-suite.
 */

import { spawn } from "child_process";

import { Test } from "../lib/test-suite";
import { TestHandling } from "../selections/base";
import { BaseDriver } from "./base";

/**
 * A driver for testing ``xmllint``.
 *
 * Note that this driver cannot run in browsers. So it does not use the
 * resourceLoader passed to the driver's constructor.
 */
export class Driver extends BaseDriver {
  /**
   * The arguments to give to all ``xmllint`` instances created.
   */
  private readonly args: string[] = ["--noout"];

  constructor() {
    super(/* canValidate */ true, /* processesExternalEntities */ true);
  }

  async run(test: Test, handling: TestHandling): Promise<void> {
    const { resolvedURI } = test;
    // We use getHasDTD() because we do not want to invoke xmllint with
    // ``--validate`` if there is no DTD. In such case, xmllint would fail
    // because there is no DTD for it to validate the file.
    const hasDTD = await test.getHasDTD();
    const code = await this.makeChild(resolvedURI,
                                      test.testType !== "not-wf" || hasDTD);
    this.processResult(test, handling, code === 0);
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
  async makeChild(xmlPath: string, validate: boolean): Promise<number | null> {
    return new Promise((resolve, reject) => {
      // We thought about using --noent but we don't because it has a strange
      // effect. It is as if the entities were replaced **before** validation,
      // and thus may have an effect on validation results.
      const args = this.args.slice();
      if (validate) {
        args.push("--valid");
      }
      const child = spawn("xmllint", args.concat([xmlPath]));
      let erred = false;
      child.on("exit", code => {
        if (erred) {
          return; // Don't both resolve and reject the promise!
        }

        resolve(code);
      });

      child.on("error", err => {
        erred = true;
        reject(err);
      });
    });
  }
}
