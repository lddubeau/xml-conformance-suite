"use strict";

module.exports = {
  extends: "npm-package-json-lint-config-lddubeau",
  rules: {
    "require-private": "error",
    "prefer-caret-version-dependencies": "warning",
    "prefer-caret-version-devDependencies": "warning",
    "valid-values-private": ["error", [
      true,
    ]],
  },
};
