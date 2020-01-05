import { spawn } from "child_process";

import { expect } from "chai";

describe("plain", function plain(): void {
  this.timeout(5000);
  it("runs", done => {
    spawn("node",
          ["./build/dist/runners/basic.js",
           "--name=foo",
           "--xml-driver=@xml-conformance-test/js/drivers/perfect",
           "--xml-selection=@xml-conformance-test/js/selections/sax"])
      .on("exit", code => {
        try {
          expect(code).to.equal(0);
        }
        catch (e) {
          done(e);
          return;
        }

        done();
      });
  });
});
