/* eslint-env node */

"use strict";

const path = require("path");

const testData =
      path.dirname(require.resolve(
        "@xml-conformance-suite/test-data/package.json"));

// Work around the lack of matchAll on old Node version.
function matchAll(resolved, pattern) {
  if (resolved.matchAll) {
    return Array.from(resolved.matchAll(pattern));
  }

  const l = [];
  let match;
  // eslint-disable-next-line no-cond-assign
  while ((match = pattern.exec(resolved)) !== null) {
    l.push(match);
  }

  return l;
}

const systemJSConfig = {
  baseURL: "/base",
  pluginFirst: true,
  paths: {
  },
  map: {
    path: "lib/browser-path",
    "@xml-conformance-suite/test-data": `/absolute${testData}`,
  },
  packages: {
    // We use this to specify a default extension of ".js". Yep, this is enough
    // because if `defaultExtension` is not explicitly set it default to ".js"!
    "": {},
  },
  packageConfigPaths: [
  ],
};

const prefixToDeps = {};
const depToPrefix = {};
const testDeps = ["sax", "saxes", "xmlchars", "minimist"];

for (const dep of testDeps) {
  const resolved = require.resolve(dep);
  const matches = matchAll(resolved, /node_modules\//g);
  const last = matches[matches.length - 1];
  const prefix = resolved.substring(0, last.index + last[0].length);
  let deps = prefixToDeps[prefix];
  if (deps === undefined) {
    deps = prefixToDeps[prefix] = [];
  }
  deps.push(dep);
  depToPrefix[dep] = prefix;
}

const shortcutIndex = 1;
const prefixToShortcut = {};

for (const prefix of Object.keys(prefixToDeps)) {
  const shortcut = `/npm${shortcutIndex}/`;
  prefixToShortcut[prefix] = shortcut;
  systemJSConfig.packageConfigPaths.push(`${shortcut}*/package.json`);
}

for (const dep of testDeps) {
  systemJSConfig.map[dep] = `${prefixToShortcut[depToPrefix[dep]]}${dep}`;
}

const serveStaticMap = Object.entries(prefixToShortcut)
      .map(([prefix, shortcut]) => ({ fsPath: prefix, baseURL: shortcut }));

module.exports = function configure(config) {
  const args = [];
  if (config.xmlDriver) {
    args.push(`--xml-driver=${config.xmlDriver}`);
  }

  if (config.xmlSelection) {
    args.push(`--xml-selection=${config.xmlSelection}`);
  }

  config.set({
    basePath: "../../",
    frameworks: ["mocha", "chai"],
    middleware: ["serve-static-map"],
    serveStaticMap,
    client: {
      mocha: {
        grep: config.grep,
      },
      args,
      systemJSConfig,
    },
    files: [
      require.resolve("systemjs/dist/system"),
      "frameworks/karma/karma.mocha.main.js",
      { pattern: "**/*.js", included: false },
      { pattern: `${testData}/cleaned/**/*`, included: false },
      { pattern: `${testData}/xmlconf/**/*`, included: false },
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
