"use strict";

const { ResourceLoader } = require("../js/lib/resource-loader");
const { Element, loadTests, Test, Text } = require("../js/lib/test-parser");

const { expect } = require("chai");

describe("test-parser", () => {
  describe("Element", () => {
    let el;

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
        const child = new Element("foo", {}, "base");
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

    describe("#text", () => {
      it("is an empty string when the element holds nothing", () => {
        expect(el.text).to.equal("");
      });

      it("concats the children's text", () => {
        const parent = new Element("myName", {}, "base");
        parent.appendChild(new Text("a"));
        parent.appendChild(new Text("b"));
        expect(parent.text).to.equal("ab");
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
          const child = new Element("bar", {}, "myDocumentBase");
          withBase.appendChild(child);
          expect(child).to.have.property("base").equal("myDocumentBase/sub");
        });

        it("with an xml:base, joins xml:base with the parent's base", () => {
          const withBase = new Element("foo", { "xml:base": "sub" },
                                       "myDocumentBase");
          const child = new Element("bar", { "xml:base": "sub2" },
                                    "myDocumentBase");
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

      it("skips text", () => {
        const parent = new Element("foo", {}, "myDocumentBase");
        parent.appendChild(new Text("fnord"));
        let count = 0;
        el.walkChildElements(() => count++);
        expect(count).to.equal(0);
      });

      it("walks child elements", () => {
        const parent = new Element("foo", {}, "myDocumentBase");
        parent.appendChild(new Text("fnord"));
        const child = new Element("child", {}, "myDocumentBase");
        parent.appendChild(child);
        const grandchild = new Element("grandchild", {}, "myDocumentBase");
        child.appendChild(grandchild);
        grandchild.appendChild(new Text("fnord"));
        parent.appendChild(new Element("nextchild", {}, "myDocumentBase"));
        const names = [];
        parent.walkChildElements((walking) => {
          expect(walking).to.be.instanceOf(Element);
          names.push(walking.name);
        });

        expect(names).to.deep.equal(["child", "grandchild", "nextchild"]);
      });
    });
  });

  describe("Test", () => {
    let fakeLoader;
    let el;

    before(() => {
      fakeLoader = {
        loadFile(path) {
          return Promise.resolve(
            path === "myDocumentBase/hasDTD.xml" ?
              `${Buffer.from([0xFF, 0xFE]).toString()} <!DOCTYPE ` : "<doc/>");
        },
      };

      el = new Test("TEST", {
        ID: "moo",
        TYPE: "typeVal",
        VERSION: "versionVal",
        RECOMMENDATION: "recommendationVal",
        EDITION: "a b c",
        SECTIONS: "sa sb sc",
        ENTITIES: "both",
        URI: "a/b.xml",
        "xml:base": "base/",
      }, "myDocumentBase", fakeLoader);
    });

    it("throws if name is not TEST", () => {
      expect(() => new Test("moo", {}, ""))
        .to.throw(Error, "the element name must be TEST");
    });

    describe("#id", () => {
      it("has the value of the ID attribute", () => {
        expect(el).to.have.property("id").equal("moo");
      });

      it("throws if there is no ID", () => {
        expect(() => new Test("TEST", {}, "myDocumentBase").id)
          .to.throw(Error, "attribute ID is not set");
      });
    });

    describe("#testType", () => {
      it("has the value of the TYPE attribute", () => {
        expect(el).to.have.property("testType").equal("typeVal");
      });

      it("throws if there is no TYPE", () => {
        expect(() => new Test("TEST", {}, "myDocumentBase").testType)
          .to.throw(Error, "attribute TYPE is not set");
      });
    });

    describe("#version", () => {
      it("has the value of the VERSION attribute", () => {
        expect(el).to.have.property("version").equal("versionVal");
      });

      it("has the value ``undefined`` if there is no VERSION", () => {
        expect(new Test("TEST", {}, "myDocumentBase"))
          .to.have.property("version").undefined;
      });

      it("has the value ``1.0`` if there is no VERSION but EDITION is set",
         () => {
           expect(new Test("TEST", { EDITION: "1" }, "myDocumentBase"))
             .to.have.property("version").equal("1.0");
         });
    });

    describe("#recommendation", () => {
      it("has the value of the RECOMMENDATION attribute", () => {
        expect(el).to.have.property("recommendation")
          .equal("recommendationVal");
      });

      it("has the value \"XML1.0\" if there is no RECOMMENDATION", () => {
        expect(new Test("TEST", {}, "myDocumentBase"))
          .to.have.property("recommendation").equal("XML1.0");
      });
    });

    describe("#editions", () => {
      it("has the value of the EDITION attribute, split into array", () => {
        expect(el).to.have.property("editions").deep.equal(["a", "b", "c"]);
      });

      it("is ``undefined`` if there is no EDITION", () => {
        expect(new Test("TEST", {}, "myDocumentBase"))
          .to.have.property("editions").undefined;
      });
    });

    describe("#editions", () => {
      it("has the value of the SECTIONS attribute, split into array", () => {
        expect(el).to.have.property("sections").deep.equal(["sa", "sb", "sc"]);
      });

      it("is ``undefined`` if there is no SECTIONS", () => {
        expect(new Test("TEST", {}, "myDocumentBase"))
          .to.have.property("sections").undefined;
      });
    });

    describe("#entities", () => {
      it("has the value of the ENTITIES attribute", () => {
        expect(el).to.have.property("entities").equal("both");
      });

      it("is ``\"none\"`` if there is no ENTITIES", () => {
        expect(new Test("TEST", {}, "myDocumentBase"))
          .to.have.property("entities").equal("none");
      });
    });

    describe("#resolvedURI", () => {
      it("has the value of the URI attribute, but resolved", () => {
        expect(el).to.have.property("resolvedURI")
          .equal("myDocumentBase/base/a/b.xml");
      });

      it("throws if there is no URI", () => {
        expect(() => new Test("TEST", {}, "myDocumentBase").resolvedURI)
          .to.throw(Error, "attribute URI is not set");
      });
    });

    describe("#skipForNonValidatingParser", () => {
      it("is false, in general", () => {
        expect(el).to.have.property("skipForNonValidatingParser").false;
      });

      it("is true when testType is \"invalid\"", () => {
        expect(new Test("TEST", { TYPE: "invalid" }, "myDocumentBase"))
          .to.have.property("skipForNonValidatingParser").true;
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

      it("resolves to ``true`` if there is a DTD", () => {
        const hasDTD = new Test("TEST", {
          URI: "hasDTD.xml",
        }, "myDocumentBase", fakeLoader);
        return hasDTD.getHasDTD().then(x => expect(x).to.be.true);
      });
    });

    describe("#getHasBOM", () => {
      it("caches", () => {
        expect(el.getHasBOM())
          .to.equal(el.getHasBOM()).and.is.instanceOf(Promise);
      });

      it("resolves to ``false`` if there is no BOM",
         () => el.getHasBOM().then(x => expect(x).to.be.false));

      it("resolves to ``true`` if there is a BOM", () => {
        const hasDTD = new Test("TEST", {
          URI: "hasDTD.xml",
        }, "myDocumentBase", fakeLoader);
        return hasDTD.getHasBOM().then(x => expect(x).to.be.true);
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
        expect(new Test("TEST", {}, "myDocumentBase", fakeLoader)
               .includesVersion("fnord")).to.be.true;
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
        expect(new Test("TEST", {}, "myDocumentBase", fakeLoader)
               .includesVersion("fnord")).to.be.true;
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
  });

  describe("Text", () => {
    it("#value holds the textual value of the node", () => {
      expect(new Text("fnord")).to.have.property("value").equal("fnord");
    });

    it("#text holds the textual value of the node", () => {
      expect(new Text("fnord")).to.have.property("text").equal("fnord");
    });
  });

  describe("loadTests", () => {
    it("loads the tests",
       () => loadTests(new ResourceLoader()).then((test) => {
         expect(test).to.have.property("name").equal("TESTSUITE");
       }));
  });
});
