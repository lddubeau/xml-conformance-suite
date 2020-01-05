import { expect } from "chai";

import { BaseDriver } from "../../build/dist/drivers/base";
import { TestHandling } from "../../build/dist/selection";
import { Test } from "../../build/dist/test-suite";

// tslint:disable-next-line:class-name
class BaseDriver_ extends BaseDriver {
  // @ts-ignore
  run(test: Test, handling: TestHandling): Promise<void> | undefined {
    throw new Error("Method not implemented.");
  }
}

export function makeTests(): void {
  describe("#canValidate is", () => {
    it("false by default", () => {
      expect(new BaseDriver_("foo")).to.have.property("canValidate").false;
    });

    it("true if set to true", () => {
      expect(new BaseDriver_("foo", true, false)).to.have
        .property("canValidate").true;
    });

    it("false if set to false", () => {
      expect(new BaseDriver_("foo", false, true)).to.have
        .property("canValidate").false;
    });
  });

  describe("#processesExternalEntities is", () => {
    it("false by default", () => {
      expect(new BaseDriver_("foo"))
        .to.have.property("processesExternalEntities").false;
    });

    it("true if set to true", () => {
      expect(new BaseDriver_("foo", false, true)).to.have
        .property("processesExternalEntities").true;
    });

    it("false if set to false", () => {
      expect(new BaseDriver_("foo", true, false)).to.have
        .property("processesExternalEntities").false;
    });
  });

  it("#name is set", () => {
    expect(new BaseDriver_("foo")).to.have.property("name").equal("foo");
  });

  describe("#getSerializedRepresentation", () => {
    it("returns a serialized representation", () => {
      expect(new BaseDriver_("foo", true, false).getSerializedRepresentation())
        .to.deep.equal({
          name: "foo",
          canValidate: true,
          processesExternalEntities: false,
        });
    });
  });

  describe("#processResult", () => {
    let driver: BaseDriver;
    before(() => {
      driver = new BaseDriver_("foo");
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
