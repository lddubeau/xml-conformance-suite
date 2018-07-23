/**
 * Test that the XML provided by the suite has some properties we expect.
 */

"use strict";

const { exec: _exec } = require("child_process");
const { promisify } = require("util");

const { expect } = require("chai");

const exec = promisify(_exec);

describe("Suite's XML", () => {
  const query = Object.create(null);

  before(() => exec("xsltproc ./test/stylesheet.xsl cleaned/xmlconf-flattened.xml")
         .then((result) => {
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
