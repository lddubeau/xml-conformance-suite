"use strict";

const fs = require("fs");

const { ResourceLoader } = require("../js/lib/resource-loader");

const { expect } = require("chai");

describe("ResourceLoader", () => {
  let rl;

  before(() => {
    rl = new ResourceLoader();
  });

  it("loads files", () =>
    rl.loadFile("package.json")
     .then(x => expect(x)
           .to.equal(fs.readFileSync("package.json").toString())));
});
