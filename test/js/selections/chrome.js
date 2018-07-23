"use strict";

const { expect } = require("chai");

const { Selection } = require("../../../js/selections/chrome");

exports.makeTests = function makeTests() {
  describe("#getTestHandling", () => {
    let selection;
    before(() => {
      selection = new Selection({
        canValidate: false,
        processesExternalEntities: false,
      });
    });

    describe("skips", () => {
      it("bad tests", () => selection.getTestHandling({
        id: "not-wf-sa-168",
      }).then(x => expect(x).to.equal("skip")));
    });
  });
};
