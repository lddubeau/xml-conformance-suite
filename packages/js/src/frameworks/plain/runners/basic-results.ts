import { DriverSpec } from "../../../drivers/driver-spec";
import { SerializedTest } from "../../../lib/serialized-test";

/**
 * A single test result.
 */
export interface TestResult {
  /** The test, in serialized form. */
  test: SerializedTest;

  /** The result: true means the test passed, false means it failed. */
  result: boolean;
}

/**
 * The results provided by the basic plain runner.
 */
export interface BasicResults {
  /**
   * The name of the test run. This could be the name of the driver, or the name
   * of the driver plus more information. The important thing is that if you are
   * going to use this data with other tests, the name should informatively and
   * uniquely identify this run.
   */
  name: string;

  /** A time stamp. */
  timestamp: string;

  /** The version number of the suite. */
  buildInfo: {
    desc: string;
    date: string;
  };

  /**
   * Version number of this format. There is only one version so far.
   */
  formatVersion: 1;

  /** The driver specs. */
  driver: DriverSpec;

  /** The results. */
  testResults: TestResult[];
}
