"use strict";

const { expect } = require("chai");

const { makeTestHandlingByTypeTest } = require("./common-tests");

const { Selection } = require("../../../js/selections/sax");

exports.makeTests = function makeTests() {
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

    it("generally resolves to false", () => selection.shouldSkipTest({
      includesVersion() {
        return false;
      },
      includesSections() {
        return false;
      },
    }).then(x => expect(x).to.be.false));

    it("resolves to true on correct version and edition",
       () => selection.shouldSkipTest({
         includesVersion() {
           return true;
         },
         includesEdition() {
           return true;
         },
         includesSections() {
           return false;
         },
       }).then(x => expect(x).to.be.true));

    it("resolves to true on correct section",
       () => selection.shouldSkipTest({
         includesVersion() {
           return false;
         },
         includesEdition() {
           return false;
         },
         includesSections() {
           return true;
         },
       }).then(x => expect(x).to.be.true));
  });
};
