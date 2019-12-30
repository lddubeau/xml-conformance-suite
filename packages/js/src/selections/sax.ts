/**
 * THIS IS EXAMPLE CODE. IT IS NOT PART OF THE API AND MAY CHANGE OR DISAPPEAR
 * AT ANY POINT.
 */

import { Test } from "../lib/test-suite";
import { BaseSelection, TestHandling } from "./base";

const EXCLUDED_PRODUCTIONS = [
  // Productions having to do with DTD parsing.
  "[28]", "[29]", "[30]", "[31]",
];

const EXCLUDED_SECTIONS = [
  // Entities.
  "4.2",
  // Internal entities.
  "4.2.1",
  // External entities.
  "4.2.2",
  // External parsed entities.
  "4.3", "4.3.1", "4.3.2", "4.3.3",
  // NOTATION.
  "4.7",
];

export class Selection extends BaseSelection {
  getHandlingByType(test: Test): TestHandling {
    const { testType } = test;
    switch (testType) {
    case "not-wf":
      return "fails";
    case "valid":
      return "succeeds";
    case "invalid":
    case "error":
      return "skip";
    default:
      throw new Error(`unexpected test type: ${testType}`);
    }
  }

  async shouldSkipTest(test: Test): Promise<boolean> {
    return (test.includesVersion("1.0") && test.includesEdition("5")) ||
      test.includesSections(EXCLUDED_SECTIONS) ||
      test.includesProductions(EXCLUDED_PRODUCTIONS);
  }
}
