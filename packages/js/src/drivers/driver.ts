/**
 * This module declares the interface that all XML processor drivers must
 * implement.
 *
 * @copyright The contibutors of xml-conformance-suite.
 */
import { ResourceLoader } from "../lib/resource-loader";
import { Test } from "../lib/test-suite";
import { TestHandling } from "../selections/selection";
import { DriverSpec } from "./driver-spec";
import { SerializedDriver } from "./serialized-driver";

/**
 * All Driver constructors must implement this interface.
 */
export type DriverCtor = new (resourceLoader: ResourceLoader) => Driver;

/**
 * All XML processor drivers must implement this interface.
 */
export interface Driver extends DriverSpec {
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

  /**
   * Get a serialized representation of the driver.
   */
  getSerializedRepresentation(): SerializedDriver;
}
