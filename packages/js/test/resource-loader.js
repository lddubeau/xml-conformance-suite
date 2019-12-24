"use strict";

const { expect } = require("chai");
const fs = require("fs");

const { ResourceLoader } = require("../build/dist/lib/resource-loader");

describe("ResourceLoader", () => {
  let rl;

  before(() => {
    rl = new ResourceLoader();
  });

  it("loads files",
     () => rl.loadFile("package.json")
     .then(x => expect(x)
           .to.equal(fs.readFileSync("package.json").toString())));
});
