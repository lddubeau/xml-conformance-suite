/**
 * Module loading facilities.
 *
 * @copyright The contibutors of xml-conformance-suite.
 */

import path from "path";

import { DriverCtor } from "./driver";
import { SelectionCtor } from "./selection";

function requireModule(modulePath: string): any {
  // tslint:disable-next-line:non-literal-require
  return require(path.resolve(__dirname, modulePath));
}

/**
 * Load modules providing a driver and a selection, if necessary.
 *
 * @param [driverPath] A path to the module holding the driver to use. The
 * builder loads that module and uses the exported ``Driver`` symbol as the
 * driver constructor.
 *
 * @param [selectionPath] A path to the module holding the selection to use. The
 * builder loads that module and uses the exported ``Selection`` symbol as the
 * selection constructor.
 *
 * @returns { Driver, Selection } The constructors loaded from the modules.
 */
export function loadModules(driverPath: string, selectionPath: string):
{ Driver: DriverCtor, Selection: SelectionCtor} {
  return {
    Driver: requireModule(driverPath).Driver,
    Selection: requireModule(selectionPath).Selection,
  };
}
