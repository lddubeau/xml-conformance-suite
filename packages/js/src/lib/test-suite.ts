/**
 * The objects that made up a test suite after it has been loaded in memory.
 *
 * @copyright The contibutors of xml-conformance-suite.
 */
import path from "path";

import { ResourceLoader } from "./resource-loader";
import { SerializedTest } from "./serialized-test";
import { makeFrequencyMap } from "./stats";
import { ERRORS } from "./test-errata";
import { TestSpec, TestType } from "./test-spec";

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

export function isSuite(el: Element): el is Suite {
  return el.name === "TESTSUITE" || el.name === "TESTCASES";
}

interface ParsedSections {
  sections: string[];
  productions: string[];
}

/**
 * A specialized ``Element`` for ``<TEST>`` elements.
 */
export class Test extends Element implements TestSpec {
  private _testContent: Promise<string> | undefined;

  private _hasDTD: Promise<boolean> | undefined;

  private _hasBOM: Promise<boolean> | undefined;

  private _parsedSections: ParsedSections | undefined;

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

    // There are some errors in the XML files. Apply ERRATA to fix them.
    const errata = ERRORS[this.id];
    if (errata !== undefined) {
      for (const attrName of Object.keys(errata)) {
        this.attributes[attrName] = errata[attrName];
      }
    }
  }

  get id(): string {
    return this.mustGetAttribute("ID");
  }

  get testType(): TestType {
    return this.mustGetAttribute("TYPE") as TestType;
  }

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

  private get parsedSections(): ParsedSections {
    if (this._parsedSections === undefined) {
      // All the code we have here is necessary because the source is not
      // consistent in how it records the sections and production numbers.
      //
      // E.g. a combination of productions 1 2 3 can be recorded as:
      //
      // "[1] [2] [3]"
      // "[1][2][3]"
      // "[1,2,3]"
      // "[1, 2, 3]"
      const parts = this.mustGetAttribute("SECTIONS").trim().split(/([[\]])/);
      let inProd = false;
      const sections: string[] = [];
      const productions: string[] = [];
      for (const part of parts) {
        switch (part) {
          case "":
            break;
          case "[":
            if (inProd) {
              throw new Error("nested production");
            }
            inProd = true;
            break;
          case "]":
            if (!inProd) {
              throw new Error("extraneous bracket");
            }
            inProd = false;
            break;
          default:
            if (inProd) {
              productions.push(...part.trim().split(/,\s*|\s+/)
                               .filter(x => x !== "").map(x => `[${x}]`));
            }
            else {
              sections.push(...part.trim().split(/,\s*|\s+/)
                            .filter(x => x !== ""));
            }
        }
      }

      this._parsedSections = { sections, productions };
    }

    return this._parsedSections;
  }

  get sections(): string[] {
    return this.parsedSections.sections;
  }

  get productions(): string[] {
    return this.parsedSections.productions;
  }

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

  get forbidsNamespaces(): boolean {
    const ns = this.attributes.NAMESPACE;
    return !(ns === undefined || ns === "yes");
  }

  getHasDTD(): Promise<boolean> {
    if (this._hasDTD === undefined) {
      this._hasDTD =
        (async () => /<!DOCTYPE /.test(await this.getTestContent()))();
    }

    return this._hasDTD;
  }

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

  includesRecommendation(desiredRecommendation: string): boolean {
    return this.recommendation === desiredRecommendation;
  }

  includesVersion(desiredVersion: string): boolean {
    const { version } = this;
    // An undefined VERSION means "all versions".
    return version === undefined || version === desiredVersion;
  }

  includesEdition(desiredEdition: string): boolean {
    const { editions } = this;
    // An undefined EDITION means "all editions".
    return editions === undefined || editions.includes(desiredEdition);
  }

  includesSections(desiredSections: string[]): boolean {
    const { sections } = this;
    return desiredSections.some(section => sections.includes(section));
  }

  includesProductions(desiredProductions: string[]): boolean {
    const { productions } = this;
    return desiredProductions
      .some(production => productions.includes(production));
  }

  /** A serialized representation of the test. */
  async getSerializedRepresentation(): Promise<SerializedTest> {
    return {
      id: this.id,
      testType: this.testType,
      version: this.version,
      recommendation: this.recommendation,
      editions: this.editions,
      sections: this.sections,
      productions: this.productions,
      entities: this.entities,
      skipForNonValidatingParser: this.skipForNonValidatingParser,
      forbidsNamespaces: this.forbidsNamespaces,
      hasDTD: await this.getHasDTD(),
      hasBOM: await this.getHasBOM(),
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
