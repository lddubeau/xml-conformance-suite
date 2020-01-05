/**
 * THIS IS EXAMPLE CODE. IT IS NOT PART OF THE API AND MAY CHANGE OR DISAPPEAR
 * AT ANY POINT.
 *
 * This module implements a test selection for ``xmllint``.
 *
 * The documentation for ``xmllint`` refers to XML 1.0 edition 5 and to XML
 * Namespaces 1.0. This selector handles a test with "skip" if:
 *
 * - it does not pertain to XML 1.0 edition 5, or
 *
 * - it pertains to XML NS version other than 1.0, or
 *
 * - it is a test of ``@TYPE="error"``.
 *
 * Otherwise, tests with ``@TYPE`` ``"not-wf"`` or ``"invalid"`` are handled
 * with ``"fails"``, and ``"valid"`` tests are handled with ``"succeed"``.
 *
 *
 * IMPORTANT NOTE: this selector selects some tests that ``xmllint`` will
 * fail. Yep, there are bugs in ``xmllint``.
 *
 * We have made the editioral decision to exclude the tests that test validation
 * constraints introduced by ``standalone="yes"``, because it appears that
 * supporting those constraints was not part of the scope of ``xmllint`` (but we
 * could be wrong).
 *
 * A notable source of problems is namespace validation. ``xmllint`` will
 * sometimes *report* a namespace error but exit with a status code of 0. To be
 * correct, ``xmllint`` should exit with a code of 1.
 *
 * As of this version of ``xmllint`` (output ``xmllint --version``, wrapped):
 *
 *     xmllint: using libxml version 20904
 *       compiled with: Threads Tree Output Push Reader Patterns Writer
 *       SAXv1 FTP HTTP DTDValid HTML Legacy C14N Catalog XPath XPointer
 *       XInclude Iconv ICU ISO8859X Unicode Regexps Automata Expr Schemas
 *       Schematron Modules Debug Zlib Lzma
 *
 * @copyright The contibutors of xml-conformance-suite.
 */
import { TestHandling } from "../selection";
import { TestSpec } from "../test-spec";
import { BaseSelection } from "./base";

// xmllint does not seem to enforce the validation constraints that
// ``standalone="yes"`` entails so it fails a bunch of tests that test for those
// constraints.
const STANDALONE_EXCLUSIONS = [
  "inv-not-sa05",
  "inv-not-sa06",
  "inv-not-sa07",
  "inv-not-sa09",
  "inv-not-sa10",
  "inv-not-sa11",
  "inv-not-sa12",
  "ibm-invalid-P32-ibm32i03.xml",
];

const OTHER_EXCLUSIONS = [
  // This tests an errata introduced for XML 1.0 edition 2. See section "E9" in
  // this document:
  //
  // https://www.w3.org/XML/xml-V10-2e-errata
  //
  // xmllint fails the test. It is not clear whether it is a real bug in xmllint
  // or whether later erratas or editions of XML 1.0 made it obsolete.
  "rmt-e2e-9a",
];

const ALL_EXCLUSIONS = STANDALONE_EXCLUSIONS.concat(OTHER_EXCLUSIONS);

export class Selection extends BaseSelection {
  getHandlingByType(test: TestSpec): TestHandling {
    const { testType } = test;
    switch (testType) {
    case "not-wf":
    case "invalid":
      return "fails";
    case "valid":
      return "succeeds";
    case "error":
      return "skip";
    default:
      throw new Error(`unexpected test type: ${testType}`);
    }
  }

  async shouldSkipTest(test: TestSpec): Promise<boolean> {
      return ALL_EXCLUSIONS.includes(test.id) ||
      test.includesRecommendation("NS1.1") ||
      !(test.includesVersion("1.0") && test.includesEdition("5"));
  }
}
