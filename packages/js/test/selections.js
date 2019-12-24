/**
 * Test that the selections run.
 */

"use strict";

const fs = require("fs");
const path = require("path");

describe("selections", () => {
  const selectionsPath = path.join(__dirname, "./selections");
  const selections = fs.readdirSync(selectionsPath)
        .filter(driver => driver.endsWith(".js") &&
                driver !== "common-tests.js");
  for (const selection of selections) {
    const selectionPath = path.join(selectionsPath, selection);
    describe(selection, () => {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      require(selectionPath).makeTests();
    });
  }
});
