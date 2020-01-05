/**
 * A plain runner.
 *
 * To run the tests, use the options to select a driver and a selection:
 *
 * ```terminal
 * $ node [path to this file] \
 *   --xml-driver=./drivers/xmllint \
 *   --xml-selection=./selections/xmllint
 * ```
 * @copyright The contibutors of xml-conformance-suite.
 */
import fs from "fs";

import minimist from "minimist";

import { loadModules } from "@xml-conformance-suite/js/lib/module-loader";
import { ResourceLoader } from "@xml-conformance-suite/js/lib/resource-loader";
import { loadTests } from "@xml-conformance-suite/js/lib/test-parser";
import buildInfo from "../build-info";
import { build } from "../builders/basic";
import { BasicResults } from "./basic-results";

export interface Options {
  "xml-selection"?: string;
  "xml-driver"?: string;
  name?: string;
  output?: string;
}

export async function run(options: Options): Promise<void> {
  // We use the load utility to get our classes.
  const { Driver, Selection } = loadModules(options["xml-driver"]!,
                                            options["xml-selection"]!);
  const resourceLoader = new ResourceLoader();
  const built = await build(await loadTests(resourceLoader),
                            resourceLoader, Driver, Selection);
  const results = [];
  for (const testRun of built.testRuns) {
    results.push({
      test: await testRun.test.getSerializedRepresentation(),
      result: await testRun.run(),
    });
  }

  // We do the assignment so that the TS compiler reports missing fields.
  const result: BasicResults = {
    name: options.name ?? built.driver.name,
    timestamp: new Date().toISOString(),
    buildInfo,
    formatVersion: 1,
    driver: built.driver.getSerializedRepresentation(),
    testResults: results,
  };

  const serialized = JSON.stringify(result, undefined, 2);
  if (options.output) {
    // tslint:disable-next-line:non-literal-fs-path
    fs.writeFileSync(options.output, serialized);
  }
  else {
    // tslint:disable-next-line:no-console
    console.log(serialized);
  }
}

export async function main(): Promise<void> {
  const args = minimist(process.argv);
  return run(args as Options);
}

if (require.main === module) {
  main();
}
