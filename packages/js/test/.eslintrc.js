"use strict";

module.exports = {
  env: {
    mocha: true,
  },
  extends: "../.eslintrc.js",
  rules: {
    // expect().to.be.true gives a false positive...
    "no-unused-expressions": "off",
  },
};
