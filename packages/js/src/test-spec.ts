/**
 *
 */

/**
 * The possible values for the test versions.
 */
export type TestVersion = "1.0" | "1.1" | undefined;

/**
 * Indicates what kind of test is being performed.
 *
 * - ``"not-wf"``: parse a malformed document: the parser must report an error.
 *
 * - ``"valid"``: parse a valid document: the parser must not report any error.
 *
 * - ``"invalid"``: parse an invalid document: the parser must report an error.
 *
 * - ``"error"``: parse a document that causes errors that may optionally be
 *   reported by validating processors.
 */
export type TestType = "not-wf" | "valid" | "invalid" | "error";

/**
 * The possible values for the test recommendation.
 */
export type TestRecommendation = "XML1.0" | "XML1.1" | "NS1.0" | "NS1.1" |
  "XML1.0-errata2e" | "XML1.0-errata3e" | "XML1.0-errata4e" | "NS1.0-errata1e";

export interface TestSpec {
  /** The test id. It is unique throughout the suite. */
  id: string;

  /** The type of test. */
  testType: TestType;

  /**
   * The version of XML to which this test applies. May be ``undefined``, which
   * means "applies to all versions". Or hold the values "1.1" or "1.0".
   */
  version: TestVersion;

  /** The recommendation to which this test applies. */
  recommendation: TestRecommendation;

  /**
   * An array of editions to which this test applies. An undefined value means
   * "all editions".
   */
  editions: string[] | undefined;

  /**
   * An array of sections to which this test applies.
   *
   * The W3C test suite records two types of values under the attribute
   * "SECTIONS":
   *
   * - section numbers proper: "2.1", "4.3.2", etc. These correspond to the
   *   headings in the specification.
   *
   * - grammar production numbers: "[12]", "[53]", etc. These are always in
   *   brackets. They correspond to the grammar rules in the specification.
   *
   * This field is an array that contains only section numbers proper.
   */
  sections: string[];

  /**
   * An array of productions to which this test applies.
   *
   * The W3C test suite records two types of values under the attribute
   * "SECTIONS":
   *
   * - section numbers proper: "2.1", "4.3.2", etc. These correspond to the
   *   headings in the specification.
   *
   * - grammar production numbers: "[12]", "[53]", etc. These are always in
   *   brackets. They correspond to the grammar rules in the specification.
   *
   * This field is an array that contains only the production numbers, including
   * the brackets.
   */
  productions: string[];

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
  entities: string;

  /**
   * A flag indicating whether this test should be skipped when running a
   * non-validating parser. The value of the flag is inherent to the test,
   * irrespective of what parser is being tested.
   *
   * Concretely, the value is true if the test type is ``"invalid"``. Tests of
   * type ``"invalid"`` must be skipped by non-validating parsers since it is
   * not possible for a non-validating parser to generate the validation errors.
   */
  skipForNonValidatingParser: boolean;

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
  forbidsNamespaces: boolean;

  /**
   * @returns Whether or not the test file for this test has a DTD associated
   * with it.
   */
  getHasDTD(): Promise<boolean>;

  /**
   * @returns Whether or not the test file for this test has a BOM in it.
   */
  getHasBOM(): Promise<boolean>;

  /**
   * @param desiredRecommendation The recommendation to test.
   *
   * @returns ``true`` if ``desiredRecommendation`` is included by this test,
   * ``false`` otherwise.
   */
  includesRecommendation(desiredRecommendation: string): boolean;

  /**
   * @param desiredVersion The XML version to test.
   *
   * @returns ``true`` if ``desiredVersion`` is included by this test,
   * ``false`` otherwise.
   */
  includesVersion(desiredVersion: string): boolean;

  /**
   * @param desiredEdition The XML edition to test.
   *
   * @returns ``true`` if ``desiredEdition`` is included by this test,
   * ``false`` otherwise.
   */
  includesEdition(desiredEdition: string): boolean;

  /**
   * @param desiredSections The sections of the XML specification to test.
   *
   * @returns ``true`` if any value in ``desiredSections`` is included by this
   * test, ``false`` otherwise.
   */
  includesSections(desiredSections: string[]): boolean;

  /**
   * @param desiredProductions The productions of the XML specification to test.
   * Note that this function expects square brackets around the production
   * numbers.
   *
   * @returns ``true`` if any value in ``desiredProductions`` is included by
   * this test, ``false`` otherwise.
   */
  includesProductions(desiredProductions: string[]): boolean;
}
