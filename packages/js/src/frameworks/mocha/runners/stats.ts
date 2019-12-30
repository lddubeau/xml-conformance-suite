/**
 * This is a specialized runner designed to provide statistics over the tests
 * that ran in the suite. It is meant to be run by itself (not as a Mocha test
 * file).
 */

import path from "path";

import Mocha from "mocha";

import { StatReporter, SuiteStats } from "../reporters/stat-reporter";

export interface Results {
  failures: number;
  suiteStats: SuiteStats;
}

export async function runWith(driver: string,
                              selection: string): Promise<Results> {
  process.argv.push(`--xml-selection=${selection}`, `--xml-driver=${driver}`);
  const result = await run();
  process.argv.splice(-2); // Restore argv.
  return result;
}

export async function run(): Promise<Results> {
  const mocha = new Mocha();
  mocha.ui("bdd");
  mocha.delay();
  mocha.reporter(StatReporter);

  mocha.addFile(path.join(__dirname, "./basic.js"));

  return new Promise(resolve => {
    mocha.run(((failures: number, reporter: StatReporter) => {
      resolve({ failures, suiteStats: reporter.suiteStats });
    }) as any);
  });
}

async function main(): Promise<void> {
  // tslint:disable-next-line:no-console
  console.log((await run()).suiteStats);
}

if (require.main === module) {
  main();
}
