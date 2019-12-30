import { expect } from "chai";

import { BaseDriver } from "../../build/dist/drivers/base";
import { Test } from "../../build/dist/lib/test-suite";
import { TestHandling } from "../../build/dist/selections/base";

// tslint:disable-next-line:class-name
class BaseDriver_ extends BaseDriver {
  // @ts-ignore
  run(test: Test, handling: TestHandling): Promise<void> | undefined {
    throw new Error("Method not implemented.");
  }
}

export function makeTests(): void {
  it("#canValidate is false", () => {
    expect(new BaseDriver_()).to.have.property("canValidate").false;
  });

  it("#processesExternalEntities is false", () => {
    expect(new BaseDriver_())
      .to.have.property("processesExternalEntities").false;
  });

  describe("#processResult", () => {
    let driver: BaseDriver;
    before(() => {
      driver = new BaseDriver_();
    });

    describe("throws", () => {
      it("when expected a parsing error but it succeeded", () => {
        expect(() => driver.processResult({
          resolvedURI: "/foo/bar/xmlconf/bleh.xml",
        } as Test, "fails", true))
          .to.throw(Error,
                    /^parsing should have failed but succeeded; path: xmlconf\/bleh.xml$/);
      });

      it("when expected successful parsing but it failed", () => {
        expect(() => driver.processResult({
          resolvedURI: "/foo/bar/xmlconf/bleh.xml",
        } as Test, "succeeds", false))
          .to.throw(Error,
                    /^parsing should have succeeded but failed; path: xmlconf\/bleh.xml$/);
      });

      it("when passed a bad status", () => {
        expect(() => driver.processResult({
          resolvedURI: "/foo/bar/xmlconf/bleh.xml",
        } as Test, "skip", false))
          .to.throw(Error,
                    /^unexpected handling value: skip$/);
      });
    });

    describe("does not throw", () => {
      it("when expected a parsing error and got an error", () => {
        driver.processResult({ resolvedURI: "/foo/bar/xmlconf/bleh.xml" } as
                             Test,
                             "fails", false);
      });

      it("when expected successful parsing and it was successful", () => {
        driver.processResult({ resolvedURI: "/foo/bar/xmlconf/bleh.xml" } as
                             Test,
                             "succeeds", true);
      });
    });
  });
}
