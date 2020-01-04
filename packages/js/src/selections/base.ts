/**
 * A selection is responsible for deciding how to handle the tests in the suite.
 */
import { DriverSpec } from "../drivers/driver-spec";
import { BAD_TESTS } from "../lib/test-errata";
import { TestSpec } from "../lib/test-spec";
import { Selection, TestHandling } from "./selection";

/**
 * A default implementation for selections.
 */
export class BaseSelection implements Selection {
  /**
   * @param driver The driver for which we are selecting tests.
   */
  constructor(readonly driver: DriverSpec) {
  }

  getHandlingByType(test: TestSpec): TestHandling {
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
  async shouldSkipTest(test: TestSpec): Promise<boolean> {
    return false;
  }

  skipForNonValidatingParser(test: TestSpec): boolean {
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
  async getTestHandling(test: TestSpec): Promise<TestHandling> {
    return (BAD_TESTS.includes(test.id) || await this.shouldSkipTest(test) ||
            this.skipForNonValidatingParser(test)) ?
      "skip" :
      this.getHandlingByType(test);
  }
}
