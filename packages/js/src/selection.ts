import { DriverSpec } from "./driver-spec";
import { TestSpec } from "./test-spec";

export type SelectionCtor = new (driver: DriverSpec) => Selection;

export type TestHandling = "fails" | "succeeds" | "skip";

export interface Selection {
  /**
   * Determine how to handle a test, based on its ``testType`` field.
   *
   * This method is meant to be overriden for custom needs.
   *
   * @param test The test to check.
   */
  getHandlingByType(test: TestSpec): TestHandling;

  /**
   * This method is meant to be overriden for custom needs.
   *
   * @param test The test to check.
   *
   * @returns Whether the test should be skipped.
   */
  shouldSkipTest(test: TestSpec): Promise<boolean>;

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
  skipForNonValidatingParser(test: TestSpec): boolean;

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
  getTestHandling(test: TestSpec): Promise<TestHandling>;
}
