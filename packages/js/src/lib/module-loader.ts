/**
 * Module loading facilities.
 *
 * @copyright The contibutors of xml-conformance-suite.
 */

import path from "path";

import minimist from "minimist";

import { DriverCtor } from "../drivers/base";
import { SelectionCtor } from "../selections/base";

const argv = minimist(process.argv);

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
function getFromArgv(name: string): string {
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
// tslint:disable-next-line:variable-name
export function loadModules(Driver?: DriverCtor, Selection?: SelectionCtor):
{ Driver: DriverCtor, Selection: SelectionCtor} {
  if (Driver == null) {
    // tslint:disable-next-line:non-literal-require
    ({ Driver } = require(path.resolve(__dirname, "..",
                                       getFromArgv("xml-driver"))));
  }

  if (Selection == null) {
    // tslint:disable-next-line:non-literal-require
    ({ Selection } = require(path.resolve(__dirname, "..",
                                          getFromArgv("xml-selection"))));
  }

  return {
    Driver: Driver!,
    Selection: Selection!,
  };
}
