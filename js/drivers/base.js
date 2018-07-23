/**
 * This module implements a base for all drivers.
 *
 * @copyright The contibutors of xml-conformance-suite.
 */

"use strict";

/**
 * A base driver which implements common functionality.
 */
class BaseDriver {
  constructor() {
    /**
     * This flag indicates whether this XML processor is able to validate
     * documents.
     */
    this.canValidate = false;

    /**
     * This flag indicates whether this XML processor is able to process
     * external entities.
     */
    this.processesExternalEntities = false;
  }

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
   *
   * @abstract
   */
  // eslint-disable-next-line no-unused-vars, class-methods-use-this
  run(test, handling) {
    throw new Error("you must override this method");
  }

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
  processResult(test, handling, succeeded) {
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

exports.BaseDriver = BaseDriver;
