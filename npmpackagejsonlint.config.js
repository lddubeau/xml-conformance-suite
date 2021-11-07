"use strict";

module.exports = {
  extends: "npm-package-json-lint-config-lddubeau",
  rules: {
    "require-private": "error",
    "prefer-caret-version-dependencies": "off",
    "prefer-caret-version-devDependencies": "off",
    "valid-values-private": ["error", [
      true,
    ]],
  },
  overrides: [{
    patterns: ["./packages/*/package.json"],
    rules: {
      "require-private": "off",
    },
  }],
};
