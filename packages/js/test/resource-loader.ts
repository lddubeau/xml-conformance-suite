import { expect } from "chai";
import fs from "fs";

import { ResourceLoader } from "../build/dist/lib/resource-loader";

describe("ResourceLoader", () => {
  let rl: ResourceLoader;

  before(() => {
    rl = new ResourceLoader();
  });

  it("loads files", async () => {
    expect(await rl.loadFile("package.json"))
      .to.equal(fs.readFileSync("package.json").toString());
  });
});
