/**
 * A selection is responsible for deciding how to handle the tests in the suite.
 */

"use strict";

const { BAD_TESTS } = require("../lib/test-errata");

/**
 * A default implementation for selections.
 */
class BaseSelection {
  /**
   * @param driver The driver for which we are selecting tests.
   */
  constructor(driver) {
    this.driver = driver;
  }

  /**
   * Determine how to handle a test, based on its ``testType`` field.
   *
   * This method is meant to be overriden for custom needs.
   *
   * @param test The test to check.
   *
   * @returns {"fails" | "succeeds" | "skip"}
   */
  // eslint-disable-next-line class-methods-use-this
  getHandlingByType(test) {
    const { testType } = test;
    switch (testType) {
    case "not-wf":
    case "invalid":
    case "error":
      return "fails";
    case "valid":
      return "succeeds";
    default:
      throw new Error(`unexpected test type: ${testType}`);
    }
  }

  /**
   * This method is meant to be overriden for custom needs.
   *
   * @param test The test to check.
   *
   * @returns {Promise<boolean>} Whether the test should be skipped.
   */
  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  shouldSkipTest(test) {
    return Promise.resolve(false);
  }

  /**
   * Determine whether the test should be skipped due to the parser (=== the
   * driver) being non-validating.
   *
   * It is not recommended to override this method.
   *
   * @param test The test to check.
   *
   * @returns {boolean} Whether to skip the test.
   */
  // eslint-disable-next-line class-methods-use-this
  skipForNonValidatingParser(test) {
    return !this.driver.canValidate &&
      (test.skipForNonValidatingParser ||
       (!this.driver.processesExternalEntities &&
        ((test.testType === "not-wf" || test.testType === "valid") &&
         test.entities !== "none")));
  }

  /**
   * Determine how to handle a test.
   *
   * @param test The test to check.
   *
   * @returns {Promise<"fails" | "succeeds" | "skip">} How to handle the
   * test. ``"fails"`` indicates that the XML parser must report an
   * error. ``"succeeds"`` indicates that the XML parser must execute without
   * error. ``"skip"`` indicates to skip the test: it is not part of the suite.
   */
  getTestHandling(test) {
    return Promise.resolve()
      .then(() => BAD_TESTS.includes(test.id) || this.shouldSkipTest(test))
      .then(result => result || this.skipForNonValidatingParser(test))
      .then(result => (result ? "skip" : this.getHandlingByType(test)));
  }
}

exports.BaseSelection = BaseSelection;
