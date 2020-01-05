import { expect } from "chai";
import * as chai from "chai";

import { expectRejection, use as erUse } from "expect-rejection";

import { Driver } from "../../build/dist/driver";
import { Test } from "../../build/dist/test-suite";

erUse(chai);

const fakeTest = {
  getHasDTD(): Promise<boolean> {
    return Promise.resolve(false);
  },

  testType: "not-wf",
};

export const GOOD_FIXTURE_PATH = "test/fixtures/good.xml";
export const BAD_FIXTURE_PATH = "test/fixtures/bad.xml";

export interface ExpectedCharacteristics {
  canValidate?: boolean;
  processesExternalEntities?: boolean;
}

export function makeCommonTests(makeDriver: () => Driver,
                                expectedCharacteristics:
                                ExpectedCharacteristics): void {
  it("#canValidate is false", () => {
    expect(makeDriver())
      .to.have.property("canValidate")
      .equal(expectedCharacteristics.canValidate);
  });

  it("#processesExternalEntities is false", () => {
    expect(makeDriver())
      .to.have.property("processesExternalEntities")
      .equal(expectedCharacteristics.processesExternalEntities);
  });

  describe("#run", () => {
    let driver: Driver;

    before(() => {
      driver = makeDriver();
    });

    describe("throws", () => {
      it("when a file that should be wf is not wf", () => {
        const test = {
          ...fakeTest,
          resolvedURI: BAD_FIXTURE_PATH,
        };

        return expectRejection(driver.run(test as Test, "succeeds") as
                               Promise<void>,
                               Error,
                               `parsing should have succeeded but failed; \
path: test/fixtures/bad.xml`);
      });

      it("when a file that should be not wf is wf", () => {
        const test = {
          ...fakeTest,
          resolvedURI: GOOD_FIXTURE_PATH,
        };

        return expectRejection(driver.run(test as Test, "fails") as
                               Promise<void>,
                               Error,
                               `parsing should have failed but succeeded; \
path: test/fixtures/good.xml`);
      });

      it("when passed a bad status", () => {
        const test = {
          ...fakeTest,
          resolvedURI: GOOD_FIXTURE_PATH,
        };
        return expectRejection(driver.run(test as Test, "skip") as
                               Promise<void>,
                               Error,
                               /^unexpected handling value: skip$/);
      });
    });

    describe("does not throw", () => {
      it("when a file that should be wf is wf", () => {
        const test = {
          ...fakeTest,
          resolvedURI: GOOD_FIXTURE_PATH,
        };

        return driver.run(test as Test, "succeeds");
      });

      it("when a file that should be malformed is malformed", () => {
        const test = {
          ...fakeTest,
          resolvedURI: BAD_FIXTURE_PATH,
        };

        return driver.run(test as Test, "fails");
      });
    });
  });
}
