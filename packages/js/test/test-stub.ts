import { expect } from "chai";

import { SerializedTest } from "../build/dist/serialized-test";
import { TestStub } from "../build/dist/test-stub";
import { Test } from "../build/dist/test-suite";

describe("TestStub", () => {
  describe("Test", () => {
    let stub: TestStub;

    before(async () => {
      const fakeLoader = {
        loadFile(): Promise<string> {
          return Promise.resolve("a");
        },
      };

      const el = new Test("TEST", {
        "ID": "moo",
        "TYPE": "typeVal",
        "VERSION": "versionVal",
        "RECOMMENDATION": "recommendationVal",
        "EDITION": "a b c",
        "SECTIONS": "sa sb sc [pa]",
        "ENTITIES": "both",
        "URI": "a/b.xml",
        "xml:base": "base/",
      }, "myDocumentBase", fakeLoader);

      stub = new TestStub(await el.getSerializedRepresentation());
    });

    describe("#id", () => {
      it("is correct", () => {
        expect(stub).to.have.property("id").equal("moo");
      });
    });

    describe("#testType", () => {
      it("is correct", () => {
        expect(stub).to.have.property("testType").equal("typeVal");
      });
    });

    describe("#version", () => {
      it("is correct", () => {
        expect(stub).to.have.property("version").equal("versionVal");
      });
    });

    describe("#recommendation", () => {
      it("is correct", () => {
        expect(stub).to.have.property("recommendation")
          .equal("recommendationVal");
      });
    });

    describe("#editions", () => {
      it("is correct", () => {
        expect(stub).to.have.property("editions").deep.equal(["a", "b", "c"]);
      });
    });

    describe("#sections", () => {
      it("is correct", () => {
        expect(stub).to.have.property("sections").deep
          .equal(["sa", "sb", "sc"]);
      });
    });

    describe("#productions", () => {
      it("is correct", () => {
        expect(stub).to.have.property("productions").deep.equal(["[pa]"]);
      });
    });

    describe("#entities", () => {
      it("is correct", () => {
        expect(stub).to.have.property("entities").equal("both");
      });
    });

    describe("#skipForNonValidatingParser", () => {
      it("is correct", () => {
        expect(stub).to.have.property("skipForNonValidatingParser").false;
      });
    });

    describe("#getHasDTD", () => {
      it("is correct", async () => {
        expect(await stub.getHasDTD()).to.be.false;
      });
    });

    describe("#getHasBOM", () => {
      it("is correct", async () => {
        expect(await stub.getHasBOM()).to.be.false;
      });
    });

    describe("#includesRecommendation", () => {
      it("returns false if the recommendation does not match", () => {
        expect(stub.includesRecommendation("FNORD")).to.be.false;
      });

      it("returns true if the recommendation matches", () => {
        expect(stub.includesRecommendation("recommendationVal")).to.be.true;
      });
    });

    describe("#includesVersion", () => {
      it("returns false if the version does not match", () => {
        expect(stub.includesVersion("FNORD")).to.be.false;
      });

      it("returns true if the version matches", () => {
        expect(stub.includesVersion("versionVal")).to.be.true;
      });

      it("returns true if no version is set", () => {
        expect(new TestStub({} as SerializedTest).includesVersion("fnord"))
          .to.be.true;
      });
    });

    describe("#includesEdition", () => {
      it("returns false if the edition does not match", () => {
        expect(stub.includesEdition("FNORD")).to.be.false;
      });

      it("returns true if the edition matches", () => {
        expect(stub.includesEdition("a")).to.be.true;
      });

      it("returns true if no edition is set", () => {
        expect(new TestStub({} as SerializedTest).includesVersion("fnord"))
          .to.be.true;
      });
    });

    describe("#includesSections", () => {
      it("returns false if no section matches", () => {
        expect(stub.includesSections(["FNORD", "FNORD2"])).to.be.false;
      });

      it("returns true if a section matches", () => {
        expect(stub.includesSections(["FNORD", "FNORD2", "sa"])).to.be.true;
      });
    });

    describe("#includesProductions", () => {
      it("returns false if no production matches", () => {
        expect(stub.includesProductions(["FNORD", "FNORD2"])).to.be.false;
      });

      it("returns true if a productions matches", () => {
        expect(stub.includesProductions(["FNORD", "FNORD2", "[pa]"]))
          .to.be.true;
      });
    });
  });
});
