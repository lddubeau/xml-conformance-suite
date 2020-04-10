module.exports = {
  extends: "../../.eslintrc.js",
  overrides: [{
    files: [
      "test/*.js",
    ],
    env: {
      mocha: true,
    },
    rules: {
      "import/no-extraneous-dependencies": "off",
    },
  }, {
    files: [
      "src/karma.mocha.main.js",
    ],
    env: {
      node: false,
      browser: true,
    },
    extends: "eslint-config-lddubeau-base/es5.js",
    rules: {
      "prefer-arrow/prefer-arrow-functions": "off",
    },
  }],
};
