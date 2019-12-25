import { expect } from "chai";

import { makeTestHandlingByTypeTest } from "./common-tests";

import { Driver } from "../../build/dist/drivers/base";
import { Test } from "../../build/dist/lib/test-parser";
import { TestHandling } from "../../build/dist/selections/base";
import { Selection } from "../../build/dist/selections/whatwg";

export function makeTests(): void {
  function makeTestObject(overrides?: any): Test {
    return {
      includesRecommendation(): boolean {
        return false;
      },
      includesVersion(): boolean {
        return true;
      },
      includesEdition(): boolean {
        return true;
      },
      includesSections(): boolean {
        return false;
      },
      getHasBOM(): Promise<boolean> {
        return Promise.resolve(false);
      },
      ...overrides,
    };
  }

  const expectations: Record<string, TestHandling> = {
    "not-wf": "fails",
    "invalid": "skip",
    "error": "skip",
    "valid": "succeeds",
  };

  makeTestHandlingByTypeTest(() => new Selection({} as Driver), expectations);

  describe("#shouldSkipTest", () => {
    let selection: Selection;
    before(() => {
      selection = new Selection({ canValidate: false } as Driver);
    });

    it("generally resolves to false",
       () => selection.shouldSkipTest(makeTestObject())
       .then(x => expect(x).to.be.false));

    it("resolves to true on incorrect version",
       () => selection.shouldSkipTest(makeTestObject({
         includesVersion(): boolean {
           return false;
         },
       })).then(x => expect(x).to.be.true));

    it("resolves to true on incorrect edition",
       () => selection.shouldSkipTest(makeTestObject({
         includesEdition(): boolean {
           return false;
         },
       })).then(x => expect(x).to.be.true));

    it("resolves to true on incorrect recommendation",
       () => selection.shouldSkipTest(makeTestObject({
         includesRecommendation(): boolean {
           return true;
         },
       })).then(x => expect(x).to.be.true));

    it("resolves to true if namespaces are forbidden",
       () => selection.shouldSkipTest(makeTestObject({
         forbidsNamespaces: true,
       })).then(x => expect(x).to.be.true));

    it("resolves to true if the test has a BOM",
       () => selection.shouldSkipTest(makeTestObject({
         getHasBOM(): Promise<boolean> {
           return Promise.resolve(true);
         },
       })).then(x => expect(x).to.be.true));
  });
}
