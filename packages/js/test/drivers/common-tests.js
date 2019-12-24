"use strict";

const { expect } = require("chai");

const { expectRejects } = require("../testutil");

const fakeTest = {
  getHasDTD() {
    return Promise.resolve(false);
  },

  testType: "not-wf",
};

const GOOD_FIXTURE_PATH = "test/fixtures/good.xml";
const BAD_FIXTURE_PATH = "test/fixtures/bad.xml";

exports.GOOD_FIXTURE_PATH = GOOD_FIXTURE_PATH;

exports.makeCommonTests = function makeCommonTests(makeDriver,
                                                   expectedCharacteristics) {
  it("#canValidate is false", () => {
    expect(makeDriver())
      .to.have.property("canValidate")
      .equal(expectedCharacteristics.canValidate);
  });

  it("#processesExternalEntities is false", () => {
    expect(makeDriver())
      .to.have.property("processesExternalEntities")
      .equal(expectedCharacteristics.processesExternalEntities);
  });

  describe("#run", () => {
    let driver;

    before(() => {
      driver = makeDriver();
    });

    describe("throws", () => {
      it("when a file that should be wf is not wf", () => {
        const test = {
          ...fakeTest,
          resolvedURI: BAD_FIXTURE_PATH,
        };

        return expectRejects(() => driver.run(test, "succeeds"),
                             Error,
                             `parsing should have succeeded but failed; \
path: test/fixtures/bad.xml`);
      });

      it("when a file that should be not wf is wf", () => {
        const test = {
          ...fakeTest,
          resolvedURI: GOOD_FIXTURE_PATH,
        };

        return expectRejects(() => driver.run(test, "fails"),
                             Error,
                             `parsing should have failed but succeeded; \
path: test/fixtures/good.xml`);
      });

      it("when passed a bad status", () => {
        const test = {
          ...fakeTest,
          resolvedURI: GOOD_FIXTURE_PATH,
        };
        return expectRejects(() => driver.run(test, "skip"),
                             Error,
                             /^unexpected handling value: skip$/);
      });
    });

    describe("does not throw", () => {
      it("when a file that should be wf is wf", () => {
        const test = {
          ...fakeTest,
          resolvedURI: GOOD_FIXTURE_PATH,
        };

        return driver.run(test, "succeeds");
      });

      it("when a file that should be malformed is malformed", () => {
        const test = {
          ...fakeTest,
          resolvedURI: BAD_FIXTURE_PATH,
        };

        return driver.run(test, "fails");
      });
    });
  });
};
