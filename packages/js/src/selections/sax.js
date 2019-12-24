/**
 * THIS IS EXAMPLE CODE. IT IS NOT PART OF THE API AND MAY CHANGE OR DISAPPEAR
 * AT ANY POINT.
 */

"use strict";

const { BaseSelection } = require("./base");

const EXCLUDED_SECTIONS = [
  // Sections having to do with DTD parsing.
  "[28]", "[29]", "[30]", "[31]",
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

class Selection extends BaseSelection {
  // eslint-disable-next-line class-methods-use-this
  getHandlingByType(test) {
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

  // eslint-disable-next-line class-methods-use-this
  shouldSkipTest(test) {
    return Promise.resolve()
      .then(() => (test.includesVersion("1.0") && test.includesEdition("5")) ||
            test.includesSections(EXCLUDED_SECTIONS));
  }
}

exports.Selection = Selection;
