/**
 * A mocha runner.
 *
 * To run the tests, pass this to Mocha with the ``--delay`` option and the
 * options to select a driver and a selection:
 *
 * ```terminal
 * $ mocha --delay [path to this file] \
 *   --xml-driver=./drivers/xmllint \
 *   --xml-selection=./selections/xmllint
 * ```
 * @copyright The contibutors of xml-conformance-suite.
 */
import minimist from "minimist";

import { loadModules } from "@xml-conformance-suite/js/lib/module-loader";
import { ResourceLoader } from "@xml-conformance-suite/js/lib/resource-loader";
import { loadTests } from "@xml-conformance-suite/js/lib/test-parser";
import { build } from "../builders/basic";

const argv = minimist(process.argv);

// tslint:disable-next-line:no-typeof-undefined
if (typeof run === "undefined") {
  throw new Error("you must use --delay with this runner");
}

function getFromArgv(options: Record<string, any>, name: string): string {
  const value = options[name];

  if (value === undefined) {
    throw new Error(`you must specify ${name}`);
  }

  return value;
}

// We use the load utility to get our classes.
const { Driver, Selection } = loadModules(getFromArgv(argv, "xml-driver"),
                                          getFromArgv(argv, "xml-selection"));
const resourceLoader = new ResourceLoader();
loadTests(resourceLoader)
  .then(suite => build(suite, "conformance", resourceLoader, Driver, Selection))
  .then(() => run());
