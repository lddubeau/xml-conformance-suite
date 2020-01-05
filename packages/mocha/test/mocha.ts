import { spawn } from "child_process";

import { expect } from "chai";

// Test the Mocha runner and builder. This is a smoke test. We use grep to
// select one test out of the lot. All tests will be *built* but not all will be
// *run*.
describe("mocha", function mocha(): void {
  this.timeout(5000);
  it("runs", done => {
    spawn("./node_modules/.bin/mocha",
          ["--delay",
           "build/dist/runners/basic.js",
           "--grep=x-ibm-1-0.5-valid-P04-ibm04v01.xml",
           "--xml-driver=./drivers/sax",
           "--xml-selection=./selections/sax"])
      .on("exit", code => {
        try {
          expect(code).to.equal(0);
        }
        catch (e) {
          done(e);
          return;
        }

        done();
      });
  });
});
