/**
 * Parsing facilities for parsing the XML files that describe the W3C
 * conformance suite. The facilities here implement just as much as needed to
 * parse the suite. **They are not adequate for general XML processing!!!**
 *
 * @copyright The contibutors of xml-conformance-suite.
 */
import path from "path";

import { SaxesParser } from "saxes";

import { ResourceLoader } from "./resource-loader";
import { makeFrequencyMap } from "./stats";

/**
 * An XML element.
 *
 * Test code must treat instances of this class (and subclasses) as immutable.
 */
export class Element {
  /**
   * The children of this element.
   */
  readonly children: (Test | Suite)[] = [];

  /**
   * The parent of this element. You should not modify this parameter directly.
   */
  // The field initialization is actually necessary for tests to pass.
  // tslint:disable-next-line:no-unnecessary-field-initialization
  parent: Element | undefined = undefined;

  /**
   * @param name The name of the element.
   *
   * @param attributes A map of attributes.
   *
   * @param documentBase The path representing the document base.
   *
   * @private
   */
  constructor(readonly name: string,
              readonly attributes: Record<string, string>,
              readonly documentBase: string) {
  }

  /**
   * @param child The child to append.
   */
  appendChild(child: Test | Suite): void {
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
  mustGetAttribute(name: string): string {
    const value = this.attributes[name];
    if (value === undefined) {
      throw new Error(`attribute ${name} is not set`);
    }

    return value;
  }

  /**
   * The base URI of this element. This is computed from looking at the parents
   * base URI and the ``xml:base`` attribute on this element.
   *
   * Reminder: this implements just enough for the goals of **this** project and
   * is not a general solution to computing base URIs.
   */
  get base(): string {
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
  resolvePath(p: string): string {
    return path.join(this.base, p);
  }

  /**
   * Apply a function to the child ``Element`` of this element and their
   * descendants.
   *
   * @param fn The function to apply. It must take a single argument which will
   * set to the element currently being processed during the walk.
   */
  walkChildElements(fn: (child: Element) => void): void {
    for (const child of this.children) {
      fn(child);
      child.walkChildElements(fn);
    }
  }
}

export function isTest(el: Element): el is Test {
  return el.name === "TEST";
}

export interface SerializedTest {
  name: string;
  id: string;
  testType: string;
  version: string | undefined;
  recommendation: string;
  editions: string[] | undefined;
  sections: string[];
  entities: string;
}

/**
 * A specialized ``Element`` for ``<TEST>`` elements.
 */
export class Test extends Element {
  private _testContent: Promise<string> | undefined;

  private _hasDTD: Promise<boolean> | undefined;

  private _hasBOM: Promise<boolean> | undefined;
  /**
   * @param name The name of the element.
   *
   * @param attributes A map of attributes.
   *
   * @param documentBase The path representing the document base.
   *
   * @param resourceLoader A resource loader for loading test files.
   *
   * @private
   */
  constructor(name: string, attributes: Record<string, string>,
              documentBase: string,
              private readonly resourceLoader: ResourceLoader) {
    super(name, attributes, documentBase);
    if (name !== "TEST") {
      throw new Error("the element name must be TEST");
    }
  }

  /** The test id. It is unique throughout the suite. */
  get id(): string {
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
  get testType(): string {
    return this.mustGetAttribute("TYPE");
  }

  /**
   * The version of XML to which this test applies. May be ``undefined``, which
   * means "applies to all versions". Or hold the values "1.1" or "1.0".
   */
  get version(): string | undefined {
    const version = this.attributes.VERSION;
    //
    // The presence of an edition implies that it applies to version 1.0. The
    // DTD says that when EDITION is set, then VERSION should have a single
    // value but the suite *clearly* does not respect that, because there are
    // many instances of EDITION set and version unset.
    //
    // The suite currently contains two actual values in usage for EDITION: "1 2
    // 3 4" or "5". The latter can only apply to version 1.0, as there is no
    // edition 5 of XML 1.1. The former *could* apply to version 1.1 but
    // specifying editions 3 and 4 does not make sense. The value "1 2" would do
    // just as well. This suggests that it is meant to apply only to XML 1.0.
    // Therefore, when edition is set, and version is undefined, we assume
    // version 1.0.
    //
    return (version === undefined && this.attributes.EDITION !== undefined) ?
      "1.0" :
      version;
  }

  /** The recommendation to which this test applies. */
  get recommendation(): string {
    // An undefined RECOMMENDATION attribute means "XML1.0".
    return this.attributes.RECOMMENDATION || "XML1.0";
  }

  /**
   * An array of editions to which this test applies. An undefined value means
   * "all editions".
   */
  get editions(): string[] | undefined {
    const edition = this.attributes.EDITION;
    return edition !== undefined ? edition.split(/\s+/) : undefined;
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
  get sections(): string[] {
    const sections =  this.mustGetAttribute("SECTIONS");
    return sections.split(/\s+/);
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
  get entities(): string {
    // A lack of value means "none".
    return this.attributes.ENTITIES || "none";
  }

  /**
   * A test's ``URI`` attribute points to the file that must be parsed, but is
   * relative to the base URI of its element. This field provides the URI
   * resolved to a full path.
   */
  get resolvedURI(): string {
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
  get skipForNonValidatingParser(): boolean {
    return this.testType === "invalid";
  }

  /**
   * The content of the test file associated with this test.
   */
  getTestContent(): Promise<string> {
    let content = this._testContent;
    if (content === undefined) {
      content = this._testContent =
        this.resourceLoader.loadFile(this.resolvedURI);
    }

    return content;
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
  get forbidsNamespaces(): boolean {
    const ns = this.attributes.NAMESPACE;
    return !(ns === undefined || ns === "yes");
  }

  /**
   * @returns Whether or not the test file for this test has a DTD associated
   * with it.
   */
  getHasDTD(): Promise<boolean> {
    if (this._hasDTD === undefined) {
      this._hasDTD =
        (async () => /<!DOCTYPE /.test(await this.getTestContent()))();
    }

    return this._hasDTD;
  }

  /**
   * @returns Whether or not the test file for this test has a BOM in it.
   */
  getHasBOM(): Promise<boolean> {
    if (this._hasBOM === undefined) {
      this._hasBOM = (async () => {
        const source = await this.getTestContent();
        const zero = source.charCodeAt(0);
        const one = source.charCodeAt(1);
        return zero === 65533 && one === 65533;
      })();
    }

    return this._hasBOM;
  }

  /**
   * @param desiredRecommendation The recommendation to test.
   *
   * @returns ``true`` if ``desiredRecommendation`` is included by this test,
   * ``false`` otherwise.
   */
  includesRecommendation(desiredRecommendation: string): boolean {
    return this.recommendation === desiredRecommendation;
  }

  /**
   * @param desiredVersion The XML version to test.
   *
   * @returns ``true`` if ``desiredVersion`` is included by this test,
   * ``false`` otherwise.
   */
  includesVersion(desiredVersion: string): boolean {
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
  includesEdition(desiredEdition: string): boolean {
    const { editions } = this;
    // An undefined EDITION means "all editions".
    return editions === undefined || editions.includes(desiredEdition);
  }

  /**
   * @param desiredSections The sections of the XML specification to test.
   *
   * @returns ``true`` if any value in ``desiredSections`` is included by this
   * test, ``false`` otherwise.
   */
  includesSections(desiredSections: string[]): boolean {
    const { sections } = this;
    for (const section of desiredSections) {
      if (sections.includes(section)) {
        return true;
      }
    }

    return false;
  }

  /** A serialized representation of the test. */
  get serializedRepresentation(): SerializedTest {
    return {
      name: this.name,
      id: this.id,
      testType: this.testType,
      version: this.version,
      recommendation: this.recommendation,
      editions: this.editions,
      sections: this.sections,
      entities: this.entities,
    };
  }
}

export type QueryableProperties = "version" | "recommendation" | "editions" |
  "sections" | "entities" | "testType";

export class Suite extends Element {
  /**
   * Produce a frequency map of the values taken by an attribute. These are the
   * attributes as they appear in the XML files of the test suite.
   *
   * @param name The attribute to process. Since all the attributes in the suite
   * are uppercase, the attribute name is automatically uppercased by this
   * function. So searching for ``"version"`` is the same as searching for
   * ``"VERSION"``.
   *
   * @returns The frequency map. The keys of the map are the attribute values
   * encountered, and the values associated with a key is the frequency of that
   * key. (The frequency is the number of times it was encountered in the test
   * suite.)
   */
  getXMLAttributeStats(name: string): Map<string | undefined, number> {
    return makeFrequencyMap(this.getXMLAttributeValues(name));
  }

  /**
   * Report all the values taken by an attribute. These are the attributes as
   * they appear in the XML files of the test suite.
   *
   * @param name The attribute to get. Since all the attributes in the suite are
   * uppercase, the attribute name is automatically uppercased by this
   * function. So searching for ``"version"`` is the same as searching for
   * ``"VERSION"``.
   *
   * @returns An array of all the values encountered in the test
   * suite. Duplicates **ARE NOT** removed.
   */
  getXMLAttributeValues(name: string): (string | undefined)[] {
    const up = name.toUpperCase();
    const ret: (string | undefined)[] = [];
    this.walkChildElements(child => {
      if (child instanceof Test) {
        ret.push(child.attributes[up]);
      }
    });
    return ret;
  }

  /**
   * Produce a frequency map of the values taken by a property of the JavaScript
   * objects created from the XML files.
   *
   * @param name The property to process.
   *
   * @returns The frequency map. The keys of the map are the property values
   * encountered, and the values associated with a key is the frequency of that
   * key. (The frequency is the number of times it was encountered in the test
   * suite.)
   */
  getPropertyStats(name: QueryableProperties): Map<string | undefined, number> {
    return makeFrequencyMap(this.getPropertyValues(name));
  }

  /**
   * Report all the values taken by a property of the JavaScript objects created
   * from the XML files.
   *
   * @param name The property to get.
   *
   * @returns An array of all the values encountered in the test
   * suite. Duplicates **ARE NOT** removed.
   */
  getPropertyValues(name: QueryableProperties): (string | undefined) [] {
    const ret: (string | undefined)[] = [];
    this.walkChildElements(child => {
      if (child instanceof Test) {
        const value = child[name];
        if (Array.isArray(value)) {
          ret.push(...value);
        }
        else {
          ret.push(value);
        }
      }
    });
    return ret;
  }
}

/**
 * A parser tailored for parsing the W3C suite.
 */
export class TestParser {
  /** The top element. This gets a value after ``parse`` returns. */
  top: Element | undefined;
  private readonly stack: Element[] = [];
  private skip: number = 0;

  private readonly parser: SaxesParser;

  /**
   * @param documentBase The base URI of the document. Given that the XML
   * provided by the W3C must be preprocessed to flatten it, it is important to
   * make sure that the value passed here corresponds to the directory that
   * contained the *original* top level XML file before flattening.
   *
   * @param resourceLoader The resource loader to use to load external
   * resources.
   */
  constructor(private readonly documentBase: string,
              private readonly resourceLoader: ResourceLoader) {
    const parser = this.parser = new SaxesParser({ position: false });

    parser.onopentag = elementData => {
      if (this.skip > 0) {
        this.skip++;
        return;
      }

      const { name } = elementData;
      let el;
      switch (name) {
        case "TEST":
          el = new Test(name, elementData.attributes as Record<string, string>,
                        this.documentBase,
                        this.resourceLoader);
          break;
          // As far as we are concerned TESTSUITE is just a top-level TESTCASES.
        case "TESTCASES":
        case "TESTSUITE":
          el =
            new Suite(name, elementData.attributes as Record<string, string>,
                      this.documentBase);
          break;
        case "B":
        case "EM":
          // B and EM can appear as children of TEST for marking up the text in
          // TEST. Since we do not use th text in TEST, we don't use these
          // either.
          this.skip++;
          return;
        default:
          throw new Error(`unexpected element ${name}`);
      }

      const topEl = this.stack[0];
      if (topEl) {
        topEl.appendChild(el);
      }

      if (!this.top) {
        this.top = el;
      }

      this.stack.unshift(el);
    };

    parser.onclosetag = () => {
      if (this.skip > 0) {
        this.skip--;
        return;
      }

      if (this.stack.length === 0) {
        throw new Error("stack underflow");
      }
      this.stack.shift();
    };

    parser.onerror = err => {
      throw err;
    };
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
  parse(text: string): void {
    this.parser.write(text.toString()).close();
  }
}

export async function loadTests(resourceLoader: ResourceLoader):
Promise<Element> {
  // We resolve the package.json because if we try resolving the package name by
  // itself it may fail if ``main`` is not set in ``package.json``, and there's
  // no point for ``main`` in this package. So resolve the file and then take
  // the dirname.
  const pkg =
    path.dirname(
      require.resolve("@xml-conformance-suite/test-data/package.json"));
  const source =
    await resourceLoader.loadFile(path.join(pkg, "cleaned",
                                            "xmlconf-flattened.xml"));
  const parser = new TestParser(path.join(pkg, "xmlconf"),
                                resourceLoader);
  parser.parse(source);
  const top = parser.top!;
  if (top.name !== "TESTSUITE") {
    throw new Error("the top level element must be TESTSUITE");
  }

  return top;
}
