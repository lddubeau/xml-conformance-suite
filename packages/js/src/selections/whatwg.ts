/**
 * This selector is meant to select those tests that test that portion of the
 * XML standard that pertains to what whatwg-conformant browsers must implement.
 *
 * Here is the principal part of whatwg that pertains to this selector:
 *
 * https://html.spec.whatwg.org/multipage/xhtml.html#the-xhtml-syntax
 *
 * whatwg does not require browsers to provide validation facilities so this
 * selector excludes all validation tests.
 */
import { TestSpec } from "../lib/test-spec";
import { BaseSelection } from "./base";
import { TestHandling } from "./selection";

export class Selection extends BaseSelection {
  getHandlingByType(test: TestSpec): TestHandling {
    const { testType } = test;
    switch (testType) {
    case "not-wf":
      return "fails";
    case "valid":
      return "succeeds";
    case "invalid":
    case "error":
      return "skip";
    default:
      throw new Error(`unexpected test type: ${testType}`);
    }
  }

  async shouldSkipTest(test: TestSpec): Promise<boolean> {
    // whatwg refers to XML version 1.0 edition 5, and to XML Namespaces version
    // 1.0. So we include only those tests that pertain to XML version 1.0
    // edition 5 and exclude those tests pertaining to XML Namespaces version
    // 1.1.
    return test.includesRecommendation("NS1.1") ||
      !(test.includesVersion("1.0") && test.includesEdition("5")) ||
      // whatwg does not define a way to turn off namespace processing
      test.forbidsNamespaces ||
      // The tests that use BOM rely on the parser being able to look at the
      // *raw* data, without decoding. There does not seem to be a way to do
      // this.
      await test.getHasBOM();
  }
}
