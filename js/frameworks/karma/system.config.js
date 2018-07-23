// This is a convention we use to provide a kind of generic configuration that
// can be modified before actually configuring SystemJS. The fact is that
// SystemJS (contrarily to RequireJS) does not handle changing the baseURL.
// See: https://github.com/systemjs/systemjs/issues/1208#issuecomment-215707469
window.systemJSConfig = {
  baseURL: "lib/",
  pluginFirst: true,
  paths: {
    "npm:": "node_modules/",
  },
  map: {
    sax: "npm:sax",
    saxen: "npm:saxen",
    minimist: "npm:minimist",
    path: "js/lib/browser-path",
  },
  packages: {
    // We use this to specify a default extension of ".js". Yep, this is enough
    // because if `defaultExtension` is not explicitly set it default to ".js"!
    "": {},
  },
  packageConfigPaths: [
    "npm:*/package.json",
  ],
};
