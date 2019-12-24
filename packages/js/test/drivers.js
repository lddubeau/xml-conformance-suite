/**
 * Test that the drivers run.
 */

"use strict";

const fs = require("fs");
const path = require("path");

describe("drivers", () => {
  const driversPath = path.join(__dirname, "./drivers");
  const drivers = fs.readdirSync(driversPath)
        .filter(driver => driver.endsWith(".js") &&
                driver !== "common-tests.js");
  for (const driver of drivers) {
    const driverPath = path.join(driversPath, driver);
    describe(driver, () => {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      require(driverPath).makeTests();
    });
  }
});
