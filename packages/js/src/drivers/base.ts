/**
 * This module implements a base for all drivers.
 *
 * @copyright The contibutors of xml-conformance-suite.
 */

import { Test } from "../lib/test-suite";
import { TestHandling } from "../selections/selection";
import { Driver } from "./driver";
import { SerializedDriver } from "./serialized-driver";

/**
 * A base driver which implements common functionality.
 */
export abstract class BaseDriver implements Driver {
  constructor(readonly name: string,
              readonly canValidate: boolean = false,
              readonly processesExternalEntities: boolean = false) {}

  abstract run(test: Test, handling: TestHandling): Promise<void> | undefined;

  processResult(test: Test, handling: TestHandling, succeeded: boolean): void {
    const { resolvedURI } = test;
    // This is a bit of a hack. We know that our tests are in xmlconf. We drop
    // everything that appears before it from the path so that we get a path
    // relative to the top of the repo.
    const trimmed = resolvedURI.replace(/^.*\/xmlconf\//, "xmlconf/");
    switch (handling) {
    case "fails":
      if (succeeded) {
        throw new Error(
          `parsing should have failed but succeeded; path: ${trimmed}`);
      }
      break;
    case "succeeds":
      if (!succeeded) {
        throw new Error(
          `parsing should have succeeded but failed; path: ${trimmed}`);
      }
      break;
    default:
      throw new Error(`unexpected handling value: ${handling}`);
    }
  }

  getSerializedRepresentation(): SerializedDriver {
    return {
      name: this.name,
      canValidate: this.canValidate,
      processesExternalEntities: this.processesExternalEntities,
    };
  }
}
