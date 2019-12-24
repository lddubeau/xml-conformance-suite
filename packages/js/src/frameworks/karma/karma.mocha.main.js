/* global SystemJS Promise */
(function main() {
  "use strict";

  // Cancel the autorun.
  window.__karma__.loaded = function loaded() {};

  SystemJS.config(window.__karma__.config.systemJSConfig);

  function importIt(file) {
    return SystemJS.import(file);
  }

  importIt("minimist")
    .then(function loaded(minimist) {
      var args = minimist(window.__karma__.config.args);
      return Promise.all(["frameworks/mocha/builders/basic",
                          "lib/browser-resource-loader",
                          "lib/test-parser",
                          args["xml-driver"],
                          args["xml-selection"]].map(importIt));
    })
    .then(function loaded(deps) {
      var async = deps[0];
      var ResourceLoader = deps[1].ResourceLoader;
      var loadTests = deps[2].loadTests;
      var Driver = deps[3].Driver;
      var Selection = deps[4].Selection;

      var resourceLoader = new ResourceLoader("/base/");
      return loadTests(resourceLoader)
        .then(function build(suite) {
          return async.build(suite, "conformance", resourceLoader, Driver, Selection);
        });
    })
    .then(window.__karma__.start);
}());
