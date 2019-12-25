/**
 * Test that the selections run.
 */
import fs from "fs";
import path from "path";

describe("selections", () => {
  // tslint:disable:mocha-no-side-effect-code non-literal-fs-path
  const selectionsPath = path.join(__dirname, "./selections");
  const selections = fs.readdirSync(selectionsPath)
        .filter(driver => (driver.endsWith(".js") || driver.endsWith(".ts")) &&
            !driver.startsWith("common-tests."));
  for (const selection of selections) {
    describe(selection, () => {
      // tslint:disable-next-line:non-literal-require
      require(path.join(selectionsPath, selection)).makeTests();
    });
  }
});
