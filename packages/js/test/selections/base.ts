import { expect } from "chai";

import { makeTestHandlingByTypeTest } from "./common-tests";

import { Driver } from "../../build/dist/drivers/base";
import { BAD_TESTS } from "../../build/dist/lib/test-errata";
import { Test } from "../../build/dist/lib/test-suite";
import { BaseSelection, Selection,
         TestHandling } from "../../build/dist/selections/base";

// tslint:disable-next-line:max-func-body-length
export function makeTests(): void {
  const expectations: Record<string, TestHandling> = {
    "not-wf": "fails",
    "invalid": "fails",
    "error": "fails",
    "valid": "succeeds",
  };

  makeTestHandlingByTypeTest(() =>
                             new BaseSelection({ canValidate: true } as Driver),
                             expectations);

  describe("#shouldSkipTest", () => {
    let selection: Selection;
    before(() => {
      selection = new BaseSelection({ canValidate: false } as Driver);
    });

    it("resolves to false", async () => {
      expect(await selection.shouldSkipTest({} as Test)).to.be.false;
    });
  });

  describe("#skipForNonValidatingParser", () => {
    describe("with non-validating parser", () => {
      let selection: Selection;
      before(() => {
        selection = new BaseSelection({
          canValidate: false,
          processesExternalEntities: false,
        } as Driver);
      });

      describe("skips tests", () => {
        it("marked to be skipped for non-validating parsers", () => {
          expect(selection
                 .skipForNonValidatingParser({
                   skipForNonValidatingParser: true,
                 } as Test))
            .to.be.true;
        });

        it("detecting malformedness or validity that require entities", () => {
          expect(selection.skipForNonValidatingParser({
            testType: "not-wf",
            entities: "both",
          } as Test)).to.be.true;

          expect(selection.skipForNonValidatingParser({
            testType: "valid",
            entities: "both",
          } as Test)).to.be.true;
        });
      });

      describe("does not skip tests", () => {
        it("that do not require entities", () => {
          expect(selection.skipForNonValidatingParser({
            testType: "not-wf",
            entities: "none",
          } as Test)).to.be.false;
        });

        it("that require entities but check for invalidity", () => {
          expect(selection.skipForNonValidatingParser({
            testType: "invalid",
            entities: "both",
          } as Test)).to.be.false;
        });
      });
    });

    describe("with a non-validating parser that parses entities", () => {
      let selection: Selection;
      before(() => {
        selection = new BaseSelection({
          canValidate: true,
          processesExternalEntities: true,
        } as Driver);
      });

      it("does not skips tests", () => {
        expect(selection
               .skipForNonValidatingParser({
                 skipForNonValidatingParser: true,
               } as Test)).to.be.false;
      });
    });

    describe("with validating parser", () => {
      let selection: Selection;
      before(() => {
        selection = new BaseSelection({ canValidate: true } as Driver);
      });

      it("does not skips tests", () => {
        expect(selection
               .skipForNonValidatingParser({
                 skipForNonValidatingParser: true,
               } as Test)).to.be.false;
      });
    });
  });

  describe("#getTestHandling", () => {
    let selection: Selection;
    before(() => {
      selection = new BaseSelection({
        canValidate: true,
        processesExternalEntities: true,
      } as Driver);
    });

    describe("skips", () => {
      it("bad tests", () => selection.getTestHandling({
        id: BAD_TESTS[0],
      } as Test).then(x => expect(x).to.equal("skip")));

      it("tests reported by #shouldSkipTest", async () => {
        const skipping = new BaseSelection({
          canValidate: true,
          processesExternalEntities: true,
        } as Driver);

        skipping.shouldSkipTest = () => Promise.resolve(true);

        expect(await skipping.getTestHandling({
          id: "good",
        } as Test)).to.equal("skip");
      });

      it("tests reported by #skipForNonValidatingParser", async () => {
        const skipping = new BaseSelection({
          canValidate: true,
          processesExternalEntities: true,
        } as Driver);

        skipping.skipForNonValidatingParser = () => true;

        expect(await skipping.getTestHandling({
          id: "good",
        } as Test)).to.equal("skip");
      });
    });

    for (const key of Object.keys(expectations)) {
      const expected = expectations[key];
      // eslint-disable-next-line no-loop-func
      it(`expects a ${expected} for ${key}`,
         // eslint-disable-next-line no-loop-func
         () => selection.getTestHandling({
           id: "good",
           testType: key,
         } as Test).then(x => expect(x).to.equal(expected)));
    }
  });
}
