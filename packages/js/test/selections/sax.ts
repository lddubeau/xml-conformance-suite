import { expect } from "chai";

import { makeTestHandlingByTypeTest } from "./common-tests";

import { Driver } from "../../build/dist/drivers/base";
import { Test } from "../../build/dist/lib/test-suite";
import { TestHandling } from "../../build/dist/selections/base";
import { Selection } from "../../build/dist/selections/sax";

export function makeTests(): void {
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

    it("generally resolves to false", async () => {
        expect(await selection.shouldSkipTest({
          includesVersion(): boolean {
            return false;
          },
          includesSections(): boolean {
            return false;
          },
          includesProductions(): boolean {
            return false;
          },
        } as unknown as Test)).to.be.false;
    });

    it("resolves to true on correct version and edition", async () => {
      expect(await selection.shouldSkipTest({
        includesVersion(): boolean {
          return true;
        },
        includesEdition(): boolean {
          return true;
        },
        includesSections(): boolean {
          return false;
        },
        includesProductions(): boolean {
          return false;
        },
      } as unknown as Test)).to.be.true;
    });

    it("resolves to true on correct section", async () => {
      expect(await selection.shouldSkipTest({
        includesVersion(): boolean {
          return false;
        },
        includesEdition(): boolean {
          return false;
        },
        includesSections(): boolean {
          return true;
        },
        includesProductions(): boolean {
          return false;
        },
      } as unknown as Test)).to.be.true;
    });

    it("resolves on correct production", async () => {
        expect(await selection.shouldSkipTest({
          includesVersion(): boolean {
            return false;
          },
          includesEdition(): boolean {
            return false;
          },
          includesSections(): boolean {
            return false;
          },
          includesProductions(): boolean {
            return true;
          },
        } as unknown as Test)).to.be.true;
    });
  });
}
