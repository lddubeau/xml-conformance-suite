"use strict";

const { expect } = require("chai");

const { makeTestHandlingByTypeTest } = require("./common-tests");

const { Selection } = require("../../build/dist/selections/whatwg");

exports.makeTests = function makeTests() {
  function makeTestObject(overrides) {
    return {
      includesRecommendation() {
        return false;
      },
      includesVersion() {
        return true;
      },
      includesEdition() {
        return true;
      },
      includesSections() {
        return false;
      },
      getHasBOM() {
        return Promise.resolve(false);
      },
      ...overrides,
    };
  }

  const expectations = {
    "not-wf": "fails",
    invalid: "skip",
    error: "skip",
    valid: "succeeds",
  };

  makeTestHandlingByTypeTest(Selection, expectations);

  describe("#shouldSkipTest", () => {
    let selection;
    before(() => {
      selection = new Selection({ canValidate: false });
    });

    it("generally resolves to false",
       () => selection.shouldSkipTest(makeTestObject())
       .then(x => expect(x).to.be.false));

    it("resolves to true on incorrect version",
       () => selection.shouldSkipTest(makeTestObject({
         includesVersion() {
           return false;
         },
       })).then(x => expect(x).to.be.true));

    it("resolves to true on incorrect edition",
       () => selection.shouldSkipTest(makeTestObject({
         includesEdition() {
           return false;
         },
       })).then(x => expect(x).to.be.true));

    it("resolves to true on incorrect recommendation",
       () => selection.shouldSkipTest(makeTestObject({
         includesRecommendation() {
           return true;
         },
       })).then(x => expect(x).to.be.true));

    it("resolves to true if namespaces are forbidden",
       () => selection.shouldSkipTest(makeTestObject({
         forbidsNamespaces: true,
       })).then(x => expect(x).to.be.true));

    it("resolves to true if the test has a BOM",
       () => selection.shouldSkipTest(makeTestObject({
         getHasBOM() {
           return Promise.resolve(true);
         },
       })).then(x => expect(x).to.be.true));
  });
};
