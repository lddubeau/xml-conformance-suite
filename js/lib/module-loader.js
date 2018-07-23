/**
 * Module loading facilities.
 *
 * @copyright The contibutors of xml-conformance-suite.
 */

"use strict";

const path = require("path");

const argv = require("minimist")(process.argv);

/**
 * Get a value from the argv.
 *
 * @private
 *
 * @param name The name to check for.
 *
 * @returns The value.
 *
 * @throws If the value is not set in argv.
 */
function getFromArgv(name) {
  const value = argv[name];

  if (value === undefined) {
    throw new Error(`you must specify ${name}`);
  }

  return value;
}

/**
 * Load modules providing a driver and a selection, if necessary.
 *
 * @param [Driver] The driver to use. If unspecified, the builder gets a module
 * name from the process argument ``xml-driver``, loads that module and uses the
 * exported ``Driver`` symbol for this parameter.
 *
 * @param [Selection] The selection function that determines how tests are
 * handled. If unspecified, the builder gets a module name from the process
 * argument ``xml-selection``, loads that module and uses the exported
 * ``Selection`` symbol for this parameter.
 *
 * @returns { Driver, Selection } The values that were passed as
 * parameters, or the values loaded from the modules, as necessary.
 */
function loadModules(Driver, Selection) {
  if (Driver == null) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    ({ Driver } = require(path.join("../..", getFromArgv("xml-driver"))));
  }

  if (Selection == null) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    ({ Selection } = require(path.join("../..",
                                       getFromArgv("xml-selection"))));
  }

  return { Driver, Selection };
}

exports.loadModules = loadModules;
