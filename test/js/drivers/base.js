"use strict";

const { expect } = require("chai");

const { BaseDriver } = require("../../../js/drivers/base");

exports.makeTests = function makeTests() {
  it("#canValidate is false", () => {
    expect(new BaseDriver()).to.have.property("canValidate").false;
  });

  it("#processesExternalEntities is false", () => {
    expect(new BaseDriver()).to.have.property("processesExternalEntities").false;
  });

  describe("#processResult", () => {
    let driver;
    before(() => {
      driver = new BaseDriver();
    });

    describe("throws", () => {
      it("when expected a parsing error but it succeeded", () => {
        expect(() => driver.processResult({
          resolvedURI: "/foo/bar/xmlconf/bleh.xml",
        }, "fails", true))
          .to.throw(Error,
                    /^parsing should have failed but succeeded; path: xmlconf\/bleh.xml$/);
      });

      it("when expected successful parsing but it failed", () => {
        expect(() => driver.processResult({
          resolvedURI: "/foo/bar/xmlconf/bleh.xml",
        }, "succeeds", false))
          .to.throw(Error,
                    /^parsing should have succeeded but failed; path: xmlconf\/bleh.xml$/);
      });

      it("when passed a bad status", () => {
        expect(() => driver.processResult({
          resolvedURI: "/foo/bar/xmlconf/bleh.xml",
        }, "skip", false))
          .to.throw(Error,
                    /^unexpected handling value: skip$/);
      });
    });

    describe("does not throw", () => {
      it("when expected a parsing error and got an error", () => {
        driver.processResult({ resolvedURI: "/foo/bar/xmlconf/bleh.xml" },
                             "fails", false);
      });

      it("when expected successful parsing and it was successful", () => {
        driver.processResult({ resolvedURI: "/foo/bar/xmlconf/bleh.xml" },
                             "succeeds", true);
      });
    });
  });
};
