// We'd like to use "extends" in "overrides" but that's not currently supported.
// This is a hacky way to more or less get what we want.
const es5 = Object.assign({
  files: ["system.config.js", "karma.mocha.main.js"],
},
                          require("eslint-config-lddubeau-base/es5"));

// The module we load has extends, so we have to drop it.
delete es5.extends;
// And adjust the environment.
es5.env.node = false;
es5.env.browser = true;
es5.rules["prefer-destructuring"] = "off";

module.exports = {
  extends: "../../../.eslintrc.js",
  overrides: [ es5 ],
};
