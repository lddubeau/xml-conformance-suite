"use strict";

const { expect } = require("chai");

const { makeTestHandlingByTypeTest } = require("./common-tests");

const { BaseSelection } = require("../../../js/selections/base");
const { BAD_TESTS } = require("../../../js/lib/test-errata");

exports.makeTests = function makeTests() {
  const expectations = {
    "not-wf": "fails",
    invalid: "fails",
    error: "fails",
    valid: "succeeds",
  };

  makeTestHandlingByTypeTest(BaseSelection, makeTestHandlingByTypeTest);

  describe("#shouldSkipTest", () => {
    let selection;
    before(() => {
      selection = new BaseSelection({ canValidate: false });
    });

    it("resolves to false", () => selection.shouldSkipTest({})
       .then(x => expect(x).to.be.false));
  });

  describe("#skipForNonValidatingParser", () => {
    describe("with non-validating parser", () => {
      let selection;
      before(() => {
        selection = new BaseSelection({
          canValidate: false,
          processesExternalEntities: false,
        });
      });

      describe("skips tests", () => {
        it("marked to be skipped for non-validating parsers", () => {
          expect(selection
                 .skipForNonValidatingParser({
                   skipForNonValidatingParser: true,
                 }))
            .to.be.true;
        });

        it("detecting malformedness or validity that require entities", () => {
          expect(selection.skipForNonValidatingParser({
            testType: "not-wf",
            entities: "both",
          })).to.be.true;

          expect(selection.skipForNonValidatingParser({
            testType: "valid",
            entities: "both",
          })).to.be.true;
        });
      });

      describe("does not skip tests", () => {
        it("that do not require entities", () => {
          expect(selection.skipForNonValidatingParser({
            testType: "not-wf",
            entities: "none",
          })).to.be.false;
        });

        it("that require entities but check for invalidity", () => {
          expect(selection.skipForNonValidatingParser({
            testType: "invalid",
            entities: "both",
          })).to.be.false;
        });
      });
    });

    describe("with a non-validating parser that parses entities", () => {
      let selection;
      before(() => {
        selection = new BaseSelection({
          canValidate: true,
          processesExternalEntities: true,
        });
      });

      it("does not skips tests", () => {
        expect(selection
               .skipForNonValidatingParser({
                 skipForNonValidatingParser: true,
               })).to.be.false;
      });
    });

    describe("with validating parser", () => {
      let selection;
      before(() => {
        selection = new BaseSelection({ canValidate: true });
      });

      it("does not skips tests", () => {
        expect(selection
               .skipForNonValidatingParser({
                 skipForNonValidatingParser: true,
               })).to.be.false;
      });
    });
  });

  describe("#getTestHandling", () => {
    let selection;
    before(() => {
      selection = new BaseSelection({
        canValidate: true,
        processesExternalEntities: true,
      });
    });

    describe("skips", () => {
      it("bad tests", () => selection.getTestHandling({
        id: BAD_TESTS[0],
      }).then(x => expect(x).to.equal("skip")));

      it("tests reported by #shouldSkipTest", () => {
        const skipping = new BaseSelection({
          canValidate: true,
          processesExternalEntities: true,
        });

        skipping.shouldSkipTest = () => Promise.resolve(true);

        return skipping.getTestHandling({
          id: "good",
        }).then(x => expect(x).to.equal("skip"));
      });

      it("tests reported by #skipForNonValidatingParser", () => {
        const skipping = new BaseSelection({
          canValidate: true,
          processesExternalEntities: true,
        });

        skipping.skipForNonValidatingParser = () => true;

        return skipping.getTestHandling({
          id: "good",
        }).then(x => expect(x).to.equal("skip"));
      });
    });

    for (const key of Object.keys(expectations)) {
      const expected = expectations[key];
      // eslint-disable-next-line no-loop-func
      it(`expects a ${expected} for ${key}`, () =>
         selection.getTestHandling({
           id: "good",
           testType: key,
         }).then(x => expect(x).to.equal(expected)));
    }
  });
};
