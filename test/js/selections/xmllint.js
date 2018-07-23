"use strict";

const { expect } = require("chai");

const { makeTestHandlingByTypeTest } = require("./common-tests");

const { Selection } = require("../../../js/selections/xmllint");

exports.makeTests = function makeTests() {
  function makeTestObject(overrides) {
    return Object.assign({
      includesRecommendation() {
        return false;
      },
      includesVersion() {
        return true;
      },
      includesEdition() {
        return true;
      },
    }, overrides);
  }

  const expectations = {
    "not-wf": "fails",
    invalid: "fails",
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

    it("resolves to true if a test is excluded",
       () => selection.shouldSkipTest(makeTestObject({
         id: "inv-not-sa12",
       })).then(x => expect(x).to.be.true));
  });
};
