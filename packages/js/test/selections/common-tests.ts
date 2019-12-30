import { expect } from "chai";

import { Test } from "../../build/dist/lib/test-suite";
import { Selection, TestHandling } from "../../build/dist/selections/base";

export function makeTestHandlingByTypeTest(makeSelection: () => Selection,
                                           expectations:
                                           Record<string, TestHandling>): void {
  describe("#getHandlingByType", () => {
    let selection: Selection;
    before(() => {
      selection = makeSelection();
    });

    for (const key of Object.keys(expectations)) {
      const expected = expectations[key];
      // eslint-disable-next-line no-loop-func
      it(`expects a ${expected} for ${key}`, () => {
        expect(selection.getHandlingByType({ testType: key } as Test))
          .to.equal(expected);
      });
    }
  });
}
