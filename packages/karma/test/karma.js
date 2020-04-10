"use strict";

const { spawn } = require("child_process");

const { expect } = require("chai");

// Test the Karma runner with Mocha builder. This is a smoke test. We use grep
// to select one test out of the lot. All tests will be *built* but not all will
// be *run*.
describe("karma", function karma() {
  // eslint-disable-next-line no-invalid-this
  this.timeout(20000);
  it("runs", done => {
    spawn("./node_modules/.bin/karma",
          ["start",
           "build/dist/karma.mocha.conf.js",
           "--single-run",
           "--browsers=ChromeHeadless",
           "--grep=not-wf-sa-001",
           "--xml-driver=@xml-conformance-suite/js/drivers/dom-parser",
           "--xml-selection=@xml-conformance-suite/js/selections/whatwg"],
          { stdio: "inherit" })
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
