import { expect } from "chai";

import { makeTestHandlingByTypeTest } from "./common-tests";

import { DriverSpec } from "../../build/dist/drivers/driver-spec";
import { TestSpec } from "../../build/dist/lib/test-spec";
import { Selection } from "../../build/dist/selections/sax";
import { TestHandling } from "../../build/dist/selections/selection";

export function makeTests(): void {
  const expectations: Record<string, TestHandling> = {
    "not-wf": "fails",
    "invalid": "skip",
    "error": "skip",
    "valid": "succeeds",
  };

  makeTestHandlingByTypeTest(() => new Selection({} as DriverSpec),
                             expectations);

  describe("#shouldSkipTest", () => {
    let selection: Selection;
    before(() => {
      selection = new Selection({ canValidate: false } as DriverSpec);
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
        } as unknown as TestSpec)).to.be.false;
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
      } as unknown as TestSpec)).to.be.true;
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
      } as unknown as TestSpec)).to.be.true;
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
        } as unknown as TestSpec)).to.be.true;
    });
  });
}
