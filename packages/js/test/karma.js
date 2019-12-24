"use strict";

const { spawn } = require("child_process");

const { expect } = require("chai");

// Test the Karma runner with Mocha builder. This is a smoke test. We use grep
// to select one test out of the lot. All tests will be *built* but not all will
// be *run*.
describe("karma", function karma() {
  this.timeout(20000);
  it("runs", (done) => {
    spawn("./node_modules/.bin/karma",
          ["start",
           "build/dist/frameworks/karma/karma.mocha.conf.js",
           "--single-run",
           "--browsers=ChromeHeadless",
           "--grep=not-wf-sa-001",
           "--xml-driver=drivers/dom-parser",
           "--xml-selection=selections/whatwg"], { stdio: "inherit" })
      .on("exit", (code) => {
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
