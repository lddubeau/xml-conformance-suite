"use strict";

const { Driver } = require("../../build/dist/drivers/sax");

const { GOOD_FIXTURE_PATH, makeCommonTests } = require("./common-tests");

class FakeLoader {
  // eslint-disable-next-line class-methods-use-this
  loadFile(path) {
    return Promise.resolve(path === GOOD_FIXTURE_PATH ? "<doc/>" : "<doc");
  }
}

exports.makeTests = function makeTests() {
  makeCommonTests(() => new Driver(new FakeLoader()), {
    canValidate: false,
    processesExternalEntities: false,
  });
};
