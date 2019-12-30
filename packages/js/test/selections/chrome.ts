import { expect } from "chai";

import { Driver } from "../../build/dist/drivers/base";
import { Test } from "../../build/dist/lib/test-suite";
import { Selection } from "../../build/dist/selections/chrome";

export function makeTests(): void {
  describe("#getTestHandling", () => {
    let selection: Selection;
    before(() => {
      selection = new Selection({
        canValidate: false,
        processesExternalEntities: false,
      } as Driver);
    });

    describe("skips", () => {
      it("bad tests", async () => {
        expect(await selection.getTestHandling({
          id: "not-wf-sa-168",
        } as Test)).to.equal("skip");
      });
    });
  });
}
