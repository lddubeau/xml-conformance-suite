import { expect } from "chai";

import { addToFrequencyMaps, Atom, IndexedFrequencyMaps,
         makeFrequencyMap } from "../build/dist/stats";

describe("stats", () => {

  describe("makeFrequencyMap", () => {
    it("works with empty array", async () => {
      expect(makeFrequencyMap([])).to.have.property("size").equal(0);
    });

    it("makes a correct map", async () => {
      expect(makeFrequencyMap(["a", "b", "a"])).
        to.deep.equal(new Map([["a", 2], ["b", 1]]));
    });
  });

  describe("addToFrequencyMaps", () => {
    it("adds scalars", () => {
      const observations = [{
        a: "foo",
        b: "bar",
        c: "ignored",
      }, {
        a: "foo2",
        b: "bar2",
      },  {
        a: "foo",
        b: "bar3",
      }, {
        a: "foo3",
        b: "bar",
      }];

      const maps: IndexedFrequencyMaps<Atom<typeof observations>, "a" | "b"> = {
        a: new Map(),
        b: new Map(),
      };

      for (const observation of observations) {
        addToFrequencyMaps(maps, observation, ["a", "b"]);
      }

      expect(maps).to.have.keys(["a", "b"]);
      expect(maps).to.have.property("a").deep
        .equal(new Map([["foo", 2],
                        ["foo2", 1],
                        ["foo3", 1]]));
      expect(maps).to.have.property("b").deep
        .equal(new Map([["bar", 2],
                        ["bar2", 1],
                        ["bar3", 1]]));
    });

    it("adds arrays", () => {
      const observations = [{
        a: ["foo"],
        b: "bar",
        c: "ignored",
      }, {
        a: ["foo2", "foo3"],
        b: "bar2",
      },  {
        a: "foo",
        b: "bar3",
      }, {
        a: ["foo3", "foo"],
        b: "bar",
      }];

      const maps: IndexedFrequencyMaps<Atom<typeof observations>, "a" | "b"> = {
        a: new Map(),
        b: new Map(),
      };

      for (const observation of observations) {
        addToFrequencyMaps(maps, observation, ["a", "b"]);
      }

      expect(maps).to.have.keys(["a", "b"]);
      expect(maps).to.have.property("a").deep
        .equal(new Map([["foo", 3],
                        ["foo2", 1],
                        ["foo3", 2]]));
      expect(maps).to.have.property("b").deep
        .equal(new Map([["bar", 2],
                        ["bar2", 1],
                        ["bar3", 1]]));
    });
  });
});
