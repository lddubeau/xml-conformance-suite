import { expect } from "chai";

import { DriverSpec } from "../../build/dist/driver-spec";
import { Selection } from "../../build/dist/selections/chrome";
import { TestSpec } from "../../build/dist/test-spec";

export function makeTests(): void {
  describe("#getTestHandling", () => {
    let selection: Selection;
    before(() => {
      selection = new Selection({
        canValidate: false,
        processesExternalEntities: false,
      } as DriverSpec);
    });

    describe("skips", () => {
      it("bad tests", async () => {
        expect(await selection.getTestHandling({
          id: "not-wf-sa-168",
        } as TestSpec)).to.equal("skip");
      });
    });
  });
}
