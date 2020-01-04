import { expect } from "chai";

import { ResourceLoader } from "../build/dist/lib/resource-loader";
import { Element, Suite, Test } from "../build/dist/lib/test-suite";

function makeTest(attributes: Record<string, string> = Object.create(null)):
Test {
  return new Test("TEST", { ID: "foo", ...attributes }, "base",
                  {} as ResourceLoader);
}

describe("test-suite", () => {
  describe("Element", () => {
    let el: Element;

    before(() => {
      el = new Element("myName", { foo: "fooVal" }, "myDocumentBase");
    });

    describe("#name", () => {
      it("provides the element's name", () => {
        expect(el).to.have.property("name").equal("myName");
      });
    });

    describe("#children", () => {
      it("starts empty", () => {
        expect(el).to.have.property("children").deep.equal([]);
      });
    });

    describe("#parent", () => {
      it("starts undefined", () => {
        expect(el).to.have.property("parent").undefined;
      });
    });

    describe("#documentBase", () => {
      it("has a correct value", () => {
        expect(el).to.have.property("documentBase").equal("myDocumentBase");
      });
    });

    describe("#appendChild", () => {
      it("appends a child", () => {
        const parent = new Element("myName", {}, "base");
        const child = makeTest();
        parent.appendChild(child);
        expect(parent).to.have.property("children").deep.equal([child]);
      });
    });

    describe("#mustGetAttribute", () => {
      it("returns a value when there's an attribute", () => {
        expect(el.mustGetAttribute("foo")).to.equal("fooVal");
      });

      it("throws when the attribute does not exist", () => {
        expect(() => el.mustGetAttribute("bar"))
          .to.throw(Error, "attribute bar is not set");
      });
    });

    describe("#base", () => {
      describe("on a top-level element", () => {
        it("without an xml:base, returns the document base", () => {
          expect(el).to.have.property("base").equal("myDocumentBase");
        });

        it("with an xml:base, joins xml:base with document base", () => {
          const withBase = new Element("foo", { "xml:base": "sub" },
                                       "myDocumentBase");
          expect(withBase).to.have.property("base").equal("myDocumentBase/sub");
        });
      });

      describe("on a child element", () => {
        it("without an xml:base, returns the parent's base", () => {
          const withBase = new Element("foo", { "xml:base": "sub" },
                                       "myDocumentBase");
          const child = new Test("TEST", { ID: "foo" }, "myDocumentBase",
                                 {} as ResourceLoader);
          withBase.appendChild(child);
          expect(child).to.have.property("base").equal("myDocumentBase/sub");
        });

        it("with an xml:base, joins xml:base with the parent's base", () => {
          const withBase = new Element("foo", { "xml:base": "sub" },
                                       "myDocumentBase");
          const child = new Test("TEST", { "ID": "foo", "xml:base": "sub2" },
                                 "myDocumentBase", {} as ResourceLoader);
          withBase.appendChild(child);
          expect(child).to.have.property("base")
            .equal("myDocumentBase/sub/sub2");
        });
      });
    });

    describe("#resolvePath", () => {
      it("joins the element's base with the path", () => {
        expect(el.resolvePath("mlem")).to.equal("myDocumentBase/mlem");
      });
    });

    describe("#walkChildElements", () => {
      it("walks nothing on an empty element", () => {
        let count = 0;
        el.walkChildElements(() => count++);
        expect(count).to.equal(0);
      });

      it("walks child elements", () => {
        const parent = new Element("foo", {}, "myDocumentBase");
        const child = new Suite("TESTSUITE", {}, "myDocumentBase");
        parent.appendChild(child);
        const grandchild = makeTest();
        child.appendChild(grandchild);
        const nextchild = makeTest();
        parent.appendChild(nextchild);
        const els: Element[] = [];
        parent.walkChildElements(walking => {
          els.push(walking);
        });

        expect(els).to.deep.equal([child, grandchild, nextchild]);
      });
    });
  });

  describe("Test", () => {
    let fakeLoader: ResourceLoader;
    let el: Test;

    before(() => {
      fakeLoader = {
        loadFile(path: string): Promise<string> {
          return Promise.resolve(
            path === "myDocumentBase/hasDTD.xml" ?
              `${Buffer.from([0xFF, 0xFE]).toString()} <!DOCTYPE ` : "<doc/>");
        },
      };

      el = new Test("TEST", {
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
    });

    it("throws if name is not TEST", () => {
      expect(() => new Test("moo", {}, "", fakeLoader))
        .to.throw(Error, "the element name must be TEST");
    });

    describe("#id", () => {
      it("has the value of the ID attribute", () => {
        expect(el).to.have.property("id").equal("moo");
      });

      it("throws if there is no ID", () => {
        expect(() => new Test("TEST", {}, "myDocumentBase", fakeLoader).id)
          .to.throw(Error, "attribute ID is not set");
      });
    });

    describe("#testType", () => {
      it("has the value of the TYPE attribute", () => {
        expect(el).to.have.property("testType").equal("typeVal");
      });

      it("throws if there is no TYPE", () => {
        expect(() => makeTest().testType)
          .to.throw(Error, "attribute TYPE is not set");
      });
    });

    describe("#version", () => {
      it("has the value of the VERSION attribute", () => {
        expect(el).to.have.property("version").equal("versionVal");
      });

      it("has the value ``undefined`` if there is no VERSION", () => {
        expect(makeTest())
          .to.have.property("version").undefined;
      });

      it("has the value ``1.0`` if there is no VERSION but EDITION is set",
         () => {
           expect(makeTest({  EDITION: "1" })).to.have.property("version")
             .equal("1.0");
         });
    });

    describe("#recommendation", () => {
      it("has the value of the RECOMMENDATION attribute", () => {
        expect(el).to.have.property("recommendation")
          .equal("recommendationVal");
      });

      it("has the value \"XML1.0\" if there is no RECOMMENDATION", () => {
        expect(makeTest()).to.have.property("recommendation").equal("XML1.0");
      });
    });

    describe("#editions", () => {
      it("has the value of the EDITION attribute, split into array", () => {
        expect(el).to.have.property("editions").deep.equal(["a", "b", "c"]);
      });

      it("is ``undefined`` if there is no EDITION", () => {
        expect(makeTest()).to.have.property("editions").undefined;
      });
    });

    describe("#sections", () => {
      it("has the sections of the SECTIONS attribute, split into array", () => {
        expect(makeTest({ SECTIONS:
                          "a,b,,  , [,c,d] [e, f , g] [h][i][j k l] m  n" }))
          .to.have.property("sections").deep.equal(["a", "b", "m", "n"]);
      });

      it("throws if there is a nested open bracket", () => {
        expect(() => makeTest({ SECTIONS: "[][[a" }).sections).to
          .throw(Error, "nested production");
      });

      it("throws if there is a spurious close bracket", () => {
        expect(() => makeTest({ SECTIONS: "[a]]" }).sections).to
          .throw(Error, "extraneous bracket");
      });
    });

    describe("#productions", () => {
      it("has the productions of the SECTIONS attribute, split into array",
         () => {
           expect(makeTest({ SECTIONS:
                             "a,b,,  , [,c,d] [e, f , g] [h][i][j k l] m  n" }))
             .to.have.property("productions").deep
             .equal(["[c]", "[d]", "[e]", "[f]", "[g]", "[h]", "[i]", "[j]",
                     "[k]", "[l]"]);
         });

      it("throws if there is a nested open bracket", () => {
        expect(() => makeTest({ SECTIONS: "[][[a" }).productions).to
          .throw(Error, "nested production");
      });

      it("throws if there is a spurious close bracket", () => {
        expect(() => makeTest({ SECTIONS: "[a]]" }).productions).to
          .throw(Error, "extraneous bracket");
      });
    });

    describe("#entities", () => {
      it("has the value of the ENTITIES attribute", () => {
        expect(el).to.have.property("entities").equal("both");
      });

      it("is ``\"none\"`` if there is no ENTITIES", () => {
        expect(makeTest())
          .to.have.property("entities").equal("none");
      });
    });

    describe("#resolvedURI", () => {
      it("has the value of the URI attribute, but resolved", () => {
        expect(el).to.have.property("resolvedURI")
          .equal("myDocumentBase/base/a/b.xml");
      });

      it("throws if there is no URI", () => {
        expect(() => makeTest()
               .resolvedURI).to.throw(Error, "attribute URI is not set");
      });
    });

    describe("#skipForNonValidatingParser", () => {
      it("is false, in general", () => {
        expect(el).to.have.property("skipForNonValidatingParser").false;
      });

      it("is true when testType is \"invalid\"", () => {
        expect(makeTest({ TYPE: "invalid" })).to.have
          .property("skipForNonValidatingParser").true;
      });
    });

    describe("#getTestContent", () => {
      it("caches", () => {
        expect(el.getTestContent())
          .to.equal(el.getTestContent()).and.is.instanceOf(Promise);
      });

      it("loads the content",
         () => el.getTestContent().then(x => expect(x).to.equal("<doc/>")));
    });

    describe("#getHasDTD", () => {
      it("caches", () => {
        expect(el.getHasDTD())
          .to.equal(el.getHasDTD()).and.is.instanceOf(Promise);
      });

      it("resolves to ``false`` if there is no DTD",
         () => el.getHasDTD().then(x => expect(x).to.be.false));

      it("resolves to ``true`` if there is a DTD", async () => {
        expect(await new Test("TEST", {
          ID: "foo",
          URI: "hasDTD.xml",
        }, "myDocumentBase", fakeLoader).getHasDTD()).to.be.true;
      });
    });

    describe("#getHasBOM", () => {
      it("caches", () => {
        expect(el.getHasBOM())
          .to.equal(el.getHasBOM()).and.is.instanceOf(Promise);
      });

      it("resolves to ``false`` if there is no BOM",
         () => el.getHasBOM().then(x => expect(x).to.be.false));

      it("resolves to ``true`` if there is a BOM", async () => {
        expect(await new Test("TEST", {
          ID: "foo",
          URI: "hasDTD.xml",
        }, "myDocumentBase", fakeLoader).getHasBOM()).to.be.true;
      });
    });

    describe("#includesRecommendation", () => {
      it("returns false if the recommendation does not match", () => {
        expect(el.includesRecommendation("FNORD")).to.be.false;
      });

      it("returns true if the recommendation matches", () => {
        expect(el.includesRecommendation("recommendationVal")).to.be.true;
      });
    });

    describe("#includesVersion", () => {
      it("returns false if the version does not match", () => {
        expect(el.includesVersion("FNORD")).to.be.false;
      });

      it("returns true if the version matches", () => {
        expect(el.includesVersion("versionVal")).to.be.true;
      });

      it("returns true if no version is set", () => {
        expect(makeTest().includesVersion("fnord")).to.be.true;
      });
    });

    describe("#includesEdition", () => {
      it("returns false if the edition does not match", () => {
        expect(el.includesEdition("FNORD")).to.be.false;
      });

      it("returns true if the edition matches", () => {
        expect(el.includesEdition("a")).to.be.true;
      });

      it("returns true if no edition is set", () => {
        expect(makeTest().includesVersion("fnord")).to.be.true;
      });
    });

    describe("#includesSections", () => {
      it("returns false if no section matches", () => {
        expect(el.includesSections(["FNORD", "FNORD2"])).to.be.false;
      });

      it("returns true if a section matches", () => {
        expect(el.includesSections(["FNORD", "FNORD2", "sa"])).to.be.true;
      });
    });

    describe("#includesProductions", () => {
      it("returns false if no production matches", () => {
        expect(el.includesProductions(["FNORD", "FNORD2"])).to.be.false;
      });

      it("returns true if a productions matches", () => {
        expect(el.includesProductions(["FNORD", "FNORD2", "[pa]"])).to.be.true;
      });
    });

    describe("#getSerializedRepresentation", () => {
      it("returns the right data", async () => {
        expect(await el.getSerializedRepresentation()).to.deep.equal({
          id: "moo",
          testType: "typeVal",
          version: "versionVal",
          recommendation: "recommendationVal",
          editions: ["a", "b", "c"],
          sections: ["sa", "sb", "sc"],
          productions: ["[pa]"],
          entities: "both",
          skipForNonValidatingParser: false,
          forbidsNamespaces: false,
          hasDTD: false,
          hasBOM: false,
        });
      });
    });
  });

  describe("Suite", () => {
    let empty: Suite;
    let el: Suite;

    before(() => {
      empty = new Suite("TESTSUITE", {}, "myDocumentBase");
      el = new Suite("TESTSUITE", {}, "myDocumentBase");

      el.appendChild(makeTest({
        "ID": "moo",
        "TYPE": "typeVal",
        "VERSION": "versionVal",
        "RECOMMENDATION": "recommendationVal",
        "EDITION": "a b c",
        "SECTIONS": "sa sb sc",
        "ENTITIES": "both",
        "URI": "a/b.xml",
        "xml:base": "base/",
      }));

      el.appendChild(makeTest({
        "ID": "moo2",
        "TYPE": "typeVal",
        "VERSION": "versionVal2",
        "RECOMMENDATION": "recommendationVal2",
        "EDITION": "a2 b2 c2",
        "SECTIONS": "sa2 sb2 sc2",
        "ENTITIES": "both",
        "URI": "a/b.xml",
        "xml:base": "base/",
      }));

      const subSuite = new Suite("TESTSUITE", {}, "myDocumentBase");
      el.appendChild(subSuite);
      subSuite.appendChild(makeTest({
        "ID": "moo3",
        "TYPE": "typeVal",
        "VERSION": "versionVal",
        "RECOMMENDATION": "recommendationVal",
        "EDITION": "a b c",
        "SECTIONS": "sa sb sc",
        "ENTITIES": "both",
        "URI": "a/b.xml",
        "xml:base": "base/",
      }));
    });

    describe("#getXMLAttributeValues", () => {
      it("returns an empty array on an empty suite", () => {
        expect(empty.getXMLAttributeValues("version")).to.deep.equal([]);
      });

      it("returns an array of values", () => {
        expect(el.getXMLAttributeValues("version")).to.deep
          .equal(["versionVal", "versionVal2", "versionVal"]);
      });

      it("handles properties that are arrays of values", () => {
        expect(el.getXMLAttributeValues("edition")).to.deep
          .equal(["a b c", "a2 b2 c2", "a b c"]);
      });
    });

    describe("#getXMLAttributeStats", () => {
      it("returns an empty map on an empty suite", () => {
        expect(empty.getXMLAttributeStats("version")).to.deep.equal(new Map());
      });

      it("returns an map of value frequencies", () => {
        expect(el.getXMLAttributeStats("version")).to.deep
          .equal(new Map([["versionVal", 2], ["versionVal2", 1]]));
      });

      it("handles properties that are arrays of values", () => {
        expect(el.getXMLAttributeStats("edition")).to.deep
          .equal(new Map([["a b c", 2], ["a2 b2 c2", 1]]));
      });
    });

    describe("#getPropertyValues", () => {
      it("returns an empty array on an empty suite", () => {
        expect(empty.getPropertyValues("version")).to.deep.equal([]);
      });

      it("returns an array of values", () => {
        expect(el.getPropertyValues("version")).to.deep
          .equal(["versionVal", "versionVal2", "versionVal"]);
      });

      it("handles properties that are arrays of values", () => {
        expect(el.getPropertyValues("editions")).to.deep
          .equal(["a", "b", "c", "a2", "b2", "c2", "a", "b", "c"]);
      });
    });

    describe("#getPropertyStats", () => {
      it("returns an empty map on an empty suite", () => {
        expect(empty.getPropertyStats("version")).to.deep.equal(new Map());
      });

      it("returns an map of value frequencies", () => {
        expect(el.getPropertyStats("version")).to.deep
          .equal(new Map([["versionVal", 2], ["versionVal2", 1]]));
      });

      it("handles properties that are arrays of values", () => {
        expect(el.getPropertyStats("editions")).to.deep
          .equal(new Map([["a", 2], ["b", 2], ["c", 2], ["a2", 1], ["b2", 1],
                          ["c2", 1]]));
      });
    });
  });
});
