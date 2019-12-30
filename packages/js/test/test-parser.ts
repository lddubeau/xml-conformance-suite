import { expect } from "chai";

import { ResourceLoader } from "../build/dist/lib/resource-loader";
import { loadTests } from "../build/dist/lib/test-parser";

describe("test-parser", () => {
  describe("loadTests", () => {
    it("loads the tests",
       () => loadTests(new ResourceLoader()).then(test => {
         expect(test).to.have.property("name").equal("TESTSUITE");
       }));
  });
});
