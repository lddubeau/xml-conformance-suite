/**
 * Parsing facilities for parsing the XML files that describe the W3C
 * conformance suite. The facilities here implement just as much as needed to
 * parse the suite. **They are not adequate for general XML processing!!!**
 *
 * @copyright The contibutors of xml-conformance-suite.
 */

"use strict";

const path = require("path");

const { Parser } = require("saxen");

/**
 * An XML element.
 *
 * Test code must treat instances of this class (and subclasses) as immutable.
 */
class Element {
  /**
   * @param {string} name The name of the element.
   *
   * @param {Object.<string, string>} attributes A map of attributes.
   *
   * @param {string} documentBase The path representing the document base.
   *
   * @private
   */
  constructor(name, attributes, documentBase) {
    /** The name of the element. */
    this.name = name;

    /**
     * The attributes of the element. This is a plain JavaScript object that
     * maps attribute names to values.
     *
     * @private
     */
    this.attributes = attributes;

    /** The children ``Element`` of the element. */
    this.children = [];

    /** The parent of this element. ``undefined`` if the element is the root. */
    this.parent = undefined;

    /** The document base of this element. */
    this.documentBase = documentBase;
  }

  /**
   * @param child The child to append.
   */
  appendChild(child) {
    this.children.push(child);
    child.parent = this;
  }

  /**
   * Get an attribute value.
   *
   * @param name The attribute's name.
   *
   * @returns The value.
   *
   * @throws An error if the attribute is not defined.
   */
  mustGetAttribute(name) {
    const value = this.attributes[name];
    if (value === undefined) {
      throw new Error(`attribute ${name} is not set`);
    }

    return value;
  }

  /**
   * The text value of this element, which is the concatenation of the text
   * value of its children.
   */
  get text() {
    let buf = "";
    for (const child of this.children) {
      buf += child.text;
    }

    return buf;
  }

  /**
   * The base URI of this element. This is computed from looking at the parents
   * base URI and the ``xml:base`` attribute on this element.
   *
   * Reminder: this implements just enough for the goals of **this** project and
   * is not a general solution to computing base URIs.
   */
  get base() {
    const { parent } = this;
    const parentBase = parent ? parent.base : this.documentBase;
    const thisBase = this.attributes["xml:base"];
    return thisBase === undefined ? parentBase :
      path.join(parentBase, thisBase);
  }

  /**
   * Resolve a path relative to the base URI of this element.
   *
   * @param p The path to resolve.
   *
   * @returns The resolved path.
   */
  resolvePath(p) {
    return path.join(this.base, p);
  }

  /**
   * Apply a function to the child ``Element`` of this element and their
   * descendants.
   *
   * @param fn The function to apply. It must take a single argument which will
   * set to the element currently being processed during the walk.
   */
  walkChildElements(fn) {
    for (const child of this.children) {
      if (child instanceof Element) {
        fn(child);
        child.walkChildElements(fn);
      }
    }
  }
}

exports.Element = Element;

/**
 * A specialized ``Element`` for ``<TEST>`` elements.
 */
class Test extends Element {
  /**
   * @param {string} name The name of the element.
   *
   * @param {Object.<string, string>} attributes A map of attributes.
   *
   * @param {string} documentBase The path representing the document base.
   *
   * @param resourceLoader A resource loader for loading test files.
   *
   * @private
   */
  constructor(name, attributes, documentBase, resourceLoader) {
    if (name !== "TEST") {
      throw new Error("the element name must be TEST");
    }
    super(name, attributes, documentBase);

    /** @private */
    this.resourceLoader = resourceLoader;

    /** @private */
    this._testContent = undefined;

    /** @private */
    this._hasDTD = undefined;

    /** @private */
    this._hasBOM = undefined;
  }

  /** The test id. It is unique throughout the suite. */
  get id() {
    return this.mustGetAttribute("ID");
  }

  /**
   * The test type:
   *
   * - ``"not-wf"``: parse a malformed document
   *
   * - ``"valid"``: parse a valid document,
   *
   * - ``invalid``:  parse an invalid document,
   *
   * - ``error``: errors that may optionally be reported by validating
   *   processors.
   */
  get testType() {
    return this.mustGetAttribute("TYPE");
  }

  /**
   * The version of XML to which this test applies. May be ``undefined``, which
   * means "applies to all versions". Or hold the values "1.1" or "1.0".
   */
  get version() {
    let version = this.attributes.VERSION;
    // The presence of an edition implies that it applies to version 1.0. The
    // DTD says that when EDITION is set, then VERSION should have a single
    // value but the suite *clearly* does not respect that.
    //
    // The suite currently contains two actual values in usage for EDITION: "1 2
    // 3 4" or "5". The latter can only apply to version 1.0, as there is no
    // edition 5 of XML 1.1. The former *could* apply to version 1.1 but
    // specifying editions 3 and 4 does not make sense. The value "1 2" would do
    // just as well. This suggests that it is meant to apply only to XML 1.0.
    //
    if (version === undefined && this.attributes.EDITION !== undefined) {
      version = "1.0";
    }

    return version;
  }

  /** The recommendation to which this test applies. */
  get recommendation() {
    // An undefined RECOMMENDATION attribute means "XML1.0".
    return this.attributes.RECOMMENDATION || "XML1.0";
  }

  /** An array of editions to which this test applies. */
  get editions() {
    const edition = this.attributes.EDITION;
    return edition && edition.split(/\s+/);
  }

  /**
   * An array of sections to which this test applies.
   *
   * The W3C test suite records two types of values under the name "section":
   *
   * - section numbers proper: "2.1", "4.3.2", etc. These correspond to the
   *   headings in the specification.
   *
   * - grammar rule numbers: "[12]", "[53]", etc. These are always in
   *   brackets. They correspond to the grammar rules in the specification.
   *
   * This field is an array that contains both types of values described
   * above. Brackets are preserved to distinguish the latter type from the
   * former.
   */
  get sections() {
    const sections = this.attributes.SECTIONS;
    return sections && sections.split(/\s+/);
  }

  /**
   * The type of external entities that must be read for this test to work
   * successfully.
   *
   * Validating parsers are required to read external entities. Non-validating
   * parsers are not required to read them. So non-validating parsers that do
   * not read external entities should skip test that depend on issues being
   * present in external entities.
   *
   * Most non-validating parsers care only whether the value is "none" or not
   * and will skip all tests for which the value is not "none". See the W3C DTD
   * for details about the other values.
   */
  get entities() {
    // A lack of value means "none".
    return this.attributes.ENTITIES || "none";
  }

  /**
   * A test's ``URI`` attribute points to the file that must be parsed, but is
   * relative to the base URI of its element. This field provides the URI
   * resolved to a full path.
   */
  get resolvedURI() {
    return this.resolvePath(this.mustGetAttribute("URI"));
  }

  /**
   * A flag indicating whether this test should be skipped when running a
   * non-validating parser. The value of the flag is inherent to the test,
   * irrespective of what parser is being tested.
   *
   * Concretely, the value is true if the test type is ``"invalid"``. Tests of
   * type ``"invalid"`` must be skipped by non-validating parsers since it is
   * not possible for a non-validating parser to generate the validation errors.
   */
  get skipForNonValidatingParser() {
    return this.testType === "invalid";
  }

  /**
   * The content of the test file associated with this test.
   */
  getTestContent() {
    if (this._testContent === undefined) {
      this._testContent = this.resourceLoader.loadFile(this.resolvedURI);
    }

    return this._testContent;
  }

  /**
   * Some tests will work correctly if and only if the parser turns off
   * namespace processing. These tests in effect forbid the use of namespaces.
   *
   * Example: in XML without namespaces, the document ``<a:foo/>`` is
   * well-formed and contains a single empty element named ``a:foo``. Whereas
   * when namespaces are in effect, the same document contains an element named
   * ``foo`` in the namespace ``a``, and is malformed because the prefix ``a``
   * is not defined.
   */
  get forbidsNamespaces() {
    const ns = this.attributes.NAMESPACE;
    return !(ns === undefined || ns === "yes");
  }

  /**
   * @returns {Promise<boolean>} Whether or not the test file for this test has
   * a DTD associated with it.
   */
  getHasDTD() {
    if (this._hasDTD === undefined) {
      this._hasDTD = this.getTestContent()
        .then(source => /<!DOCTYPE /.test(source));
    }

    return this._hasDTD;
  }

  /**
   * @returns {Promise<boolean>} Whether or not the test file for this test has
   * a BOM in it.
   */
  getHasBOM() {
    if (this._hasBOM === undefined) {
      this._hasBOM =
        this.getTestContent()
        .then((source) => {
          const zero = source.charCodeAt(0);
          const one = source.charCodeAt(1);
          return zero === 65533 && one === 65533;
        });
    }

    return this._hasBOM;
  }

  /**
   * @param desiredRecommendation The recommendation to test.
   *
   * @returns ``true`` if ``desiredRecommendation`` is included by this test,
   * ``false`` otherwise.
   */
  includesRecommendation(desiredRecommendation) {
    return this.recommendation === desiredRecommendation;
  }

  /**
   * @param desiredVersion The XML version to test.
   *
   * @returns ``true`` if ``desiredVersion`` is included by this test,
   * ``false`` otherwise.
   */
  includesVersion(desiredVersion) {
    const { version } = this;
    // An undefined VERSION means "all versions".
    return version === undefined || version === desiredVersion;
  }

  /**
   * @param desiredEdition The XML edition to test.
   *
   * @returns ``true`` if ``desiredEdition`` is included by this test,
   * ``false`` otherwise.
   */
  includesEdition(desiredEdition) {
    const { editions } = this;
    // An undefined EDITION means "all editions".
    return editions === undefined || editions.includes(desiredEdition);
  }

  /**
   * @param desiredSections The sections of the XML specification to test. This
   * must be an array of strings.
   *
   * @returns ``true`` if any value in ``desiredSections`` is included by this
   * test, ``false`` otherwise.
   */
  includesSections(desiredSections) {
    const { sections } = this;
    for (const section of desiredSections) {
      if (sections.includes(section)) {
        return true;
      }
    }

    return false;
  }
}

exports.Test = Test;

/**
 * A text node.
 */
class Text {
  constructor(value) {
    /** The textual value of the node. */
    this.value = value;
  }

  /** The node, as text. This is equal to ``value``. */
  get text() {
    return this.value;
  }
}

exports.Text = Text;

/**
 * A parser tailored for parsing the W3C suite.
 */
class TestParser {
  /**
   * @param documentBase The base URI of the document. Given that the XML
   * provided by the W3C must be preprocessed to flatten it, it is important to
   * make sure that the value passed here corresponds to the directory that
   * contained the *original* top level XML file before flattening.
   *
   * @param resourceLoader The resource loader to use to load external
   * resources.
   */
  constructor(documentBase, resourceLoader) {
    /** @private */
    this.documentBase = documentBase;

    /** @private */
    this.resourceLoader = resourceLoader;

    /** The top element. This gets a value after ``parse`` returns. */
    this.top = undefined;

    /** @private */
    this.stack = [];

    const parser = this.parser = new Parser({ proxy: true });

    parser.on("openTag", (elementData) => {
      const { name } = elementData;
      let el;
      switch (name) {
      case "TEST":
        el = new Test(elementData.name, elementData.attrs, this.documentBase,
                     this.resourceLoader);
        break;
      default:
        el = new Element(elementData.name, elementData.attrs,
                         this.documentBase);
      }

      const topEl = this.stack[0];
      if (topEl) {
        topEl.appendChild(el);
      }

      if (!this.top) {
        this.top = el;
      }

      this.stack.unshift(el);
    });

    parser.on("closeTag", () => {
      if (this.stack.length === 0) {
        throw new Error("stack underflow");
      }
      this.stack.shift();
    });

    parser.on("text", (value, decodeEntities) => {
      value = value.replace(/[ \t\r\n]+/g, " ").trim();
      if (value === "") {
        return;
      }

      value = decodeEntities(value);
      const topEl = this.stack[0];
      if (topEl) {
        topEl.appendChild(new Text(value));
      }
    });

    parser.on("error", (err) => {
      throw err;
    });

    parser.on("warn", (err) => {
      throw err;
    });
  }

  /**
   * Parse the *flattened* suite. "Flattened" is important. The document passed
   * to this function must not depend on external entities. So the W3C suite
   * must have been preprocessed with a tool that resolves all the entities and
   * replaces them with their values. e.g. ``xmllint --noent`` does this.
   *
   * @param text This must be the text of the suite *flattened* as a single XML
   * file.
   */
  parse(text) {
    this.parser.parse(text.toString());
  }
}

exports.TestParser = TestParser;

function loadTests(resourceLoader) {
  return resourceLoader.loadFile(
    path.join(__dirname, "../../cleaned/xmlconf-flattened.xml"))
    .then((source) => {
      const parser = new TestParser(path.join(__dirname, "../../xmlconf/"),
                                    resourceLoader);
      parser.parse(source);
      const { top } = parser;
      if (top.name !== "TESTSUITE") {
        throw new Error("the top level element must be TESTSUITE");
      }

      return top;
    });
}

exports.loadTests = loadTests;
