"use strict";

const { expect } = require("chai");

function makeTestHandlingByTypeTest(Selection, expectations) {
  describe("#getHandlingByType", () => {
    let selection;
    before(() => {
      selection = new Selection();
    });

    for (const key of Object.keys(expectations)) {
      const expected = expectations[key];
      // eslint-disable-next-line no-loop-func
      it(`expects a ${expected} for ${key}`, () => {
        expect(selection.getHandlingByType({ testType: key }))
          .to.equal(expected);
      });
    }
  });
}

exports.makeTestHandlingByTypeTest = makeTestHandlingByTypeTest;
