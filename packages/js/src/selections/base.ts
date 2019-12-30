/**
 * A selection is responsible for deciding how to handle the tests in the suite.
 */
import { Driver } from "../drivers/base";
import { BAD_TESTS } from "../lib/test-errata";
import { Test } from "../lib/test-suite";

export type TestHandling = "fails" | "succeeds" | "skip";

export type SelectionCtor = new (driver: Driver) => Selection;

export interface Selection {
  /**
   * Determine how to handle a test, based on its ``testType`` field.
   *
   * This method is meant to be overriden for custom needs.
   *
   * @param test The test to check.
   */
  getHandlingByType(test: Test): TestHandling;

  /**
   * This method is meant to be overriden for custom needs.
   *
   * @param test The test to check.
   *
   * @returns Whether the test should be skipped.
   */
  shouldSkipTest(test: Test): Promise<boolean>;

  /**
   * Determine whether the test should be skipped due to the parser (=== the
   * driver) being non-validating.
   *
   * It is not recommended to override this method.
   *
   * @param test The test to check.
   *
   * @returns Whether to skip the test.
   */
  skipForNonValidatingParser(test: Test): boolean;

  /**
   * Determine how to handle a test.
   *
   * @param test The test to check.
   *
   * @returns How to handle the test. ``"fails"`` indicates that the XML parser
   * must report an error. ``"succeeds"`` indicates that the XML parser must
   * execute without error. ``"skip"`` indicates to skip the test: it is not
   * part of the suite.
   */
  getTestHandling(test: Test): Promise<TestHandling>;
}

/**
 * A default implementation for selections.
 */
export class BaseSelection implements Selection {
  /**
   * @param driver The driver for which we are selecting tests.
   */
  constructor(readonly driver: Driver) {
  }

  getHandlingByType(test: Test): TestHandling {
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

  // @ts-ignore
  async shouldSkipTest(test: Test): Promise<boolean> {
    return false;
  }

  skipForNonValidatingParser(test: Test): boolean {
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
   * @returns How to handle the test. ``"fails"`` indicates that the XML parser
   * must report an error. ``"succeeds"`` indicates that the XML parser must
   * execute without error. ``"skip"`` indicates to skip the test: it is not
   * part of the suite.
   */
  async getTestHandling(test: Test): Promise<TestHandling> {
    return (BAD_TESTS.includes(test.id) || await this.shouldSkipTest(test) ||
            this.skipForNonValidatingParser(test)) ?
      "skip" :
      this.getHandlingByType(test);
  }
}
