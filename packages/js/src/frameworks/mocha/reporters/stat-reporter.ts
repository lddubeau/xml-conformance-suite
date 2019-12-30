import mocha from "mocha";

import { SerializedTest } from "../../../lib/test-parser";
import { mochaTestToTest } from "../support/test-registry";

export interface SuiteStats {
  overall: number;
  version: Record<string, number>;
  recommendation: Record<string, number>;
  editions: Record<string, number>;
  sections: Record<string, number>;
}

type Atom<X> = X extends readonly (infer E)[] ? E : X;

function addAtom<T>(map: Map<T, number>, atom: T): void {
  const prev = map.get(atom);
  map.set(atom, prev === undefined ? 1 : prev + 1);
}

type FrequencyMaps<T, K extends keyof T> =
  { [k in K]: Map<Atom<T[k]>, number> };

function addToFrequencyMap<T, K extends keyof T>(maps: FrequencyMaps<T, K>,
                                                 x: T,
                                                 names: readonly K[]): void {
  for (const name of names) {
    const map = maps[name];
    const value = x[name];
    if (Array.isArray(value)) {
      for (const atom of value) {
        addAtom(map, atom);
      }
    }
    else {
      addAtom(map, value as Atom<T[K]>);
    }
  }
}

const props = ["version", "recommendation", "editions", "sections"] as const;

type TestFrequencyMaps = FrequencyMaps<SerializedTest, Atom<typeof props>>;

export class StatReporter extends mocha.reporters.Base {
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
  };

  constructor(runner: mocha.Runner) {
    super(runner);

    this.totalFrequencies = {
      version: new Map(),
      recommendation: new Map(),
      editions: new Map(),
      sections: new Map(),
    };

    this.successfulFrequencies = {
      version: new Map(),
      recommendation: new Map(),
      editions: new Map(),
      sections: new Map(),
    };

    runner.on("pass", test => {
      const xmlTest = mochaTestToTest.get(test)!;
      const rep = xmlTest.serializedRepresentation;
      addToFrequencyMap(this.totalFrequencies, rep, props);
      addToFrequencyMap(this.successfulFrequencies, rep, props);
      this.all++;
      this.successful++;
    });

    runner.on("fail", test => {
      const xmlTest = mochaTestToTest.get(test)!;
      addToFrequencyMap(this.totalFrequencies, xmlTest.serializedRepresentation,
                        props);
      this.all++;
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

  done(failures: number, fn?: (failures: number,
                               reporter: this) => void): void {
    fn?.(failures, this);
  }
}
