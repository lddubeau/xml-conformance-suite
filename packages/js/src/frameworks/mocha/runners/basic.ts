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
import { loadModules } from "../../../lib/module-loader";
import { ResourceLoader } from "../../../lib/resource-loader";
import { loadTests } from "../../../lib/test-parser";
import { build } from "../builders/basic";

// tslint:disable-next-line:no-typeof-undefined
if (typeof run === "undefined") {
  throw new Error("you must use --delay with this runner");
}

// We use the load utility to get our classes.
const { Driver, Selection } = loadModules();
const resourceLoader = new ResourceLoader();
loadTests(resourceLoader)
  .then(suite => build(suite, "conformance", resourceLoader, Driver, Selection))
  .then(() => run());
