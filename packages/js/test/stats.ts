import { expect } from "chai";

import { makeFrequencyMap } from "../build/dist/lib/stats";

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
});
