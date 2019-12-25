/**
 * Test that the drivers run.
 */
import fs from "fs";
import path from "path";

describe("drivers", () => {
  // tslint:disable:mocha-no-side-effect-code non-literal-fs-path
  const driversPath = path.join(__dirname, "./drivers");
  const drivers = fs.readdirSync(driversPath)
    .filter(driver => (driver.endsWith(".js") || driver.endsWith(".ts")) &&
            !driver.startsWith("common-tests."));
  for (const driver of drivers) {
    describe(driver, () => {
      // tslint:disable-next-line:non-literal-require
      require(path.join(driversPath, driver)).makeTests();
    });
  }
});
