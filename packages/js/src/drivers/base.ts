/**
 * This module implements a base for all drivers.
 *
 * @copyright The contibutors of xml-conformance-suite.
 */

import { ResourceLoader } from "../lib/resource-loader";
import { Test } from "../lib/test-suite";
import { TestHandling } from "../selections/base";

export type DriverCtor = new (resourceLoader: ResourceLoader) => Driver;

export interface Driver {
  /**
   * This flag indicates whether this XML processor is able to validate
   * documents.
   */
  readonly canValidate: boolean;

  /**
   * This flag indicates whether this XML processor is able to process
   * external entities.
   */
  readonly processesExternalEntities: boolean;

  /**
   * Run a test. This method must be stateless. That is, it must be possible to
   * call this method multiple times on the same instance of ``Driver`` and have
   * each call run independently from one another.
   *
   * @param test The test to run.
   *
   * @param handling The handling that was returned by the selector.
   *
   * @returns ``undefined`` or a ``Promise``. It must return a promise if the
   * test is to be run asynchronously. The promise must resolve if the test is
   * successful, or be rejected if the test fails. Otherwise, the test is run
   * synchronously and this function must return ``undefined``.
   */
  run(test: Test, handling: TestHandling): Promise<void> | undefined;

  /**
   * Throw an error if we did not get the expected results.
   *
   * @param test The test.
   *
   * @param handling The test handling.
   *
   * @param {boolean} succeeded Whether the test was successful.
   */
  // eslint-disable-next-line class-methods-use-this
  processResult(test: Test, handling: TestHandling, succeeded: boolean): void;
}

/**
 * A base driver which implements common functionality.
 */
export abstract class BaseDriver implements Driver {
  constructor(readonly canValidate: boolean = false,
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
}
