import mocha from "mocha";

import { addToFrequencyMaps, Atom,
         IndexedFrequencyMaps } from "../../../lib/stats";
import { SerializedTest } from "../../../lib/serialized-test";
import { mochaTestToTest } from "../support/test-registry";

const props = ["version", "recommendation", "editions", "sections",
               "productions"] as const;
type Props = Atom<typeof props>;

type TestFrequencyMaps = IndexedFrequencyMaps<SerializedTest, Props>;

export type SuiteStats = {
  [k in Props]: Record<string, number>;
} & { overall: number };

export class StatReporter extends mocha.reporters.Base {
  private readonly promises: Promise<void>[] = [];
  private readonly totalFrequencies: TestFrequencyMaps;
  private readonly successfulFrequencies: TestFrequencyMaps;
  private successful: number = 0;
  private all: number = 0;

  readonly suiteStats: SuiteStats = {
    overall: 0,
    version: {},
    recommendation: {},
    editions: {},
    sections: {},
    productions: {},
  };

  constructor(runner: mocha.Runner) {
    super(runner);

    this.totalFrequencies = {
      version: new Map(),
      recommendation: new Map(),
      editions: new Map(),
      sections: new Map(),
      productions: new Map(),
    };

    this.successfulFrequencies = {
      version: new Map(),
      recommendation: new Map(),
      editions: new Map(),
      sections: new Map(),
      productions: new Map(),
    };

    runner.on("pass", test => {
      const xmlTest = mochaTestToTest.get(test)!;
      this.all++;
      this.successful++;
      this.promises.push((async () => {
        const rep = await xmlTest.getSerializedRepresentation();
        addToFrequencyMaps(this.totalFrequencies, rep, props);
        addToFrequencyMaps(this.successfulFrequencies, rep, props);
      })());
    });

    runner.on("fail", test => {
      const xmlTest = mochaTestToTest.get(test)!;
      this.all++;
      this.promises.push((async () => {
        addToFrequencyMaps(this.totalFrequencies,
                          await xmlTest.getSerializedRepresentation(),
                          props);
      })());
    });

    runner.on("end", () => {
      const { suiteStats } = this;
      suiteStats.overall = this.successful / this.all * 100;
      for (const prop of props) {
        for (const [val, frequency] of this.totalFrequencies[prop].entries()) {
          // It so happens that when we run into the value ``undefined``, it
          // always means "all".
          suiteStats[prop][val ?? "all"] =
            (this.successfulFrequencies[prop].get(val as string) ?? 0) /
            frequency * 100;
        }
      }
    });
  }

  async done(failures: number, fn?: (failures: number,
                                     reporter: this) => void): Promise<void> {
    await Promise.all(this.promises);

    const { suiteStats } = this;
    suiteStats.overall = this.successful / this.all * 100;
    for (const prop of props) {
      for (const [val, frequency] of this.totalFrequencies[prop].entries()) {
        // It so happens that when we run into the value ``undefined``, it
        // always means "all".
        suiteStats[prop][val ?? "all"] =
          (this.successfulFrequencies[prop].get(val as string) ?? 0) /
          frequency * 100;
      }
    }
    fn?.(failures, this);
  }
}
