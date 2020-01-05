import { expect } from "chai";

import { Selection, TestHandling } from "../../build/dist/selection";
import { TestSpec } from "../../build/dist/test-spec";

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
        expect(selection.getHandlingByType({ testType: key } as TestSpec))
          .to.equal(expected);
      });
    }
  });
}
