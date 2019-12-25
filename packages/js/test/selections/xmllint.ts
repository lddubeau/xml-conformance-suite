import { expect } from "chai";

import { makeTestHandlingByTypeTest } from "./common-tests";

import { Driver } from "../../build/dist/drivers/base";
import { Test } from "../../build/dist/lib/test-parser";
import { TestHandling } from "../../build/dist/selections/base";
import { Selection } from "../../build/dist/selections/xmllint";

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
      ...overrides,
    };
  }

  const expectations: Record<string, TestHandling> = {
    "not-wf": "fails",
    "invalid": "fails",
    "error": "skip",
    "valid": "succeeds",
  };

  makeTestHandlingByTypeTest(() => new Selection({} as Driver), expectations);

  describe("#shouldSkipTest", () => {
    let selection: Selection;
    before(() => {
      selection = new Selection({ canValidate: false } as Driver);
    });

    it("generally resolves to false", async () => {
      expect(await selection.shouldSkipTest(makeTestObject())).to.be.false;
    });

    it("resolves to true on incorrect version", async () => {
      expect(await selection.shouldSkipTest(makeTestObject({
        includesVersion(): boolean {
           return false;
         },
      }))).to.be.true;
    });

    it("resolves to true on incorrect edition", async () => {
      expect(await selection.shouldSkipTest(makeTestObject({
         includesEdition(): boolean {
           return false;
         },
      }))).to.be.true;
    });

    it("resolves to true on incorrect recommendation", async () => {
      expect(await selection.shouldSkipTest(makeTestObject({
        includesRecommendation(): boolean {
          return true;
        },
      }))).to.be.true;
    });

    it("resolves to true if a test is excluded", async () => {
      expect(await selection.shouldSkipTest(makeTestObject({
         id: "inv-not-sa12",
      }))).to.be.true;
    });
  });
}
