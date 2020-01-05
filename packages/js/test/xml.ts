/**
 * Test that the suite has the characteristics we expect.
 */
import { exec as _exec } from "child_process";
import { promisify } from "util";

import { expect } from "chai";

import { ResourceLoader } from "../build/dist/resource-loader";
import { loadTests } from "../build/dist/test-parser";
import { isTest, Suite } from "../build/dist/test-suite";

// tslint:disable:mocha-no-side-effect-code
const exec = promisify(_exec);

describe("Suite characteristics", () => {
  describe("xml", () => {
    const query = Object.create(null);

    const flattened =
      require.resolve("@xml-conformance-suite/test-data/cleaned/" +
                      "xmlconf-flattened.xml");
    before(() => exec(`xsltproc ./test/stylesheet.xsl ${flattened}`)
           .then(result => {
             const lines =
               result.stdout.split(/[\r\n]/).filter(x => x.length !== 0);
             for (const line of lines) {
               const index = line.indexOf(": ");
               const first = line.substring(0, index);
               const second = line.substring(index + 2);
               let set = query[first];
               if (!set) {
                 set = query[first] = Object.create(null);
               }
               set[second] = 1;
             }
           }));

    it("@VERSION", () => {
      expect(Object.keys(query.VERSION)).to.have.members(["1.0", "1.1"]);
    });

    it("@TYPE", () => {
      expect(Object.keys(query.TYPE))
        .to.have.members(["not-wf", "valid", "invalid", "error"]);
    });

    it("@RECOMMENDATION", () => {
      expect(Object.keys(query.RECOMMENDATION))
        .to.have.members(["XML1.0", "XML1.1", "NS1.0", "NS1.1",
                          "XML1.0-errata2e", "XML1.0-errata3e",
                          "XML1.0-errata4e", "NS1.0-errata1e"]);
    });
  });

  describe("loaded suite", () => {
    let suite: Suite;

    before(async () => {
      suite = await loadTests(new ResourceLoader());
    });

    it("values for version", () => {
      expect(Array.from(suite.getPropertyStats("version").keys())).to.have
        .members(["1.0", "1.1", undefined]);
    });

    it("values for testType", () => {
      expect(Array.from(suite.getPropertyStats("testType").keys())).to.have
        .members(["not-wf", "valid", "invalid", "error"]);
    });

    it("values for recommendations", () => {
      expect(Array.from(suite.getPropertyStats("recommendation").keys()))
        .to.have.members(["XML1.0", "XML1.1", "NS1.0", "NS1.1",
                          "XML1.0-errata2e", "XML1.0-errata3e",
                          "XML1.0-errata4e", "NS1.0-errata1e"]);
    });

    it("a test with version other than 1.0 does not have any editions", () => {
      suite.walkChildElements(child => {
        if (isTest(child) && (child.version === undefined ||
                              child.version === "1.1")) {
          expect(child).to.have.property("editions").equal(undefined);
        }
      });
    });

    //
    // This does not hold.
    //
    // it("a test with version 1.0 has recommendation for 1.0", () => {
    //   suite.walkChildElements(child => {
    //     if (isTest(child)) {
    //       if (child.version === "1.0" || child.version === undefined) {
    //         expect(child, child.id).to.have.property("recommendation")
    //           .oneOf(["XML1.0", "NS1.0", "XML1.0-errata2e",
    //                   "XML1.0-errata3e",
    //                   "XML1.0-errata4e", "NS1.0-errata1e"]);
    //       }
    //       else if (child.version === "1.1") {
    //         expect(child, child.id).to.have.property("recommendation")
    //           .oneOf(["XML1.1", "NS1.1"]);
    //       }
    //     }
    //   });
    // });
  });
});
