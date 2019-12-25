/**
 * Test that the XML provided by the suite has some properties we expect.
 */
import { exec as _exec } from "child_process";
import { promisify } from "util";

import { expect } from "chai";

// tslint:disable:mocha-no-side-effect-code
const exec = promisify(_exec);

describe("Suite's XML", () => {
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
});
