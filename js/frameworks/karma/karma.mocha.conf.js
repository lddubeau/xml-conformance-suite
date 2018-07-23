/* eslint-env node */

"use strict";

// eslint-disable-next-line import/no-extraneous-dependencies
const serveStatic = require("serve-static");

function makeServeMiddleware(/* config */) {
  // The path to serveStatic is relative to CWD.
  const serveModules = serveStatic("./node_modules", {
    index: false,
  });

  const moduleBase = "/base/node_modules/";
  return function handle(req, resp, next) {
    if (req.url.lastIndexOf(moduleBase, 0) === 0) {
      req.url = req.url.slice(moduleBase.length);
      serveModules(req, resp, next);
    }
    else {
      next();
    }
  };
}

module.exports = function configure(config) {
  const args = [];
  if (config.xmlDriver) {
    args.push(`--xml-driver=${config.xmlDriver}`);
  }

  if (config.xmlSelection) {
    args.push(`--xml-selection=${config.xmlSelection}`);
  }

  config.set({
    basePath: "../../../",
    frameworks: ["mocha", "chai"],
    middleware: ["serve-node-modules"],
    plugins: [
      "karma-*", // This is the default, which we need to keep here.
      { "middleware:serve-node-modules": ["factory", makeServeMiddleware] },
    ],
    client: {
      mocha: {
        grep: config.grep,
      },
      args,
    },
    files: [
      "node_modules/systemjs/dist/system.js",
      "js/frameworks/karma/system.config.js",
      "js/frameworks/karma/karma.mocha.main.js",
      { pattern: "js/**/*.js", included: false },
      { pattern: "cleaned/**/*", included: false },
      { pattern: "xmlconf/**/*", included: false },
    ],
    exclude: [
    ],
    preprocessors: {
    },
    reporters: ["progress"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ["ChromeHeadless"],
    singleRun: false,
    concurrency: Infinity,
  });
};
