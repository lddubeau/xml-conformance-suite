/**
 * This module implements a driver for running an imaginary XML parser which is
 * perfect.
 *
 * @copyright The contibutors of xml-conformance-suite.
 */

import { Test } from "../lib/test-suite";
import { TestHandling } from "../selections/base";
import { BaseDriver } from "./base";

/**
 * A driver for running an imaginary XML parser which is perfect.
 */
export class Driver extends BaseDriver {
  constructor() {
    super(/* canValidate */ true, /* processesExternalEntities */ true);
  }

  async run(test: Test, handling: TestHandling): Promise<void> {
    this.processResult(test, handling, handling === "succeeds");
  }
}
