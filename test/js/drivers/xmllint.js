"use strict";

const { Driver } = require("../../../js/drivers/xmllint");

const { makeCommonTests } = require("./common-tests");

exports.makeTests = function makeTests() {
  makeCommonTests(() => new Driver(), {
    canValidate: true,
    processesExternalEntities: true,
  });
};
