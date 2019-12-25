/**
 * A mocha runner.
 *
 * To run the tests, execute:
 *
 *     $ (export DRIVER_MODULE_NAME=...; export SELECTOR_MODULE_NAME=...;
 *        mocha [path to this file])
 *
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
