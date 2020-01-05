import { Driver, DriverCtor } from "@xml-conformance-suite/js/drivers/driver";
import { ResourceLoader } from "@xml-conformance-suite/js/lib/resource-loader";
import { Suite, Test } from "@xml-conformance-suite/js/lib/test-suite";
import { Selection, SelectionCtor,
         TestHandling } from "@xml-conformance-suite/js/selections/selection";

type TestInfo = { handling: TestHandling, test: Test };
type SuiteInfo = { title: string, children: (SuiteInfo|TestInfo)[] };

/**
 * A mocha builder that builds the tests synchronously.
 */
function convertSuite(suite: Suite,
                      // @ts-ignore
                      resourceLoader: ResourceLoader,
                      // @ts-ignore
                      driver: Driver,
                      selection: Selection): Promise<(SuiteInfo | TestInfo)[]> {
  async function handleTest(test: Test): Promise<TestInfo> {
    const handling = await selection.getTestHandling(test);
    return { handling, test };
  }

  async function handleTestCases(testCases: Suite):
  Promise<SuiteInfo | TestInfo> {
    const children = await Promise.all(testCases.children.map(child => {
      switch (child.name) {
        case "TESTCASES":
          return handleTestCases(child as Suite);
        case "TEST":
          return handleTest(child as Test);
        default:
          throw new Error(`unexpected child name: ${child.name}`);
      }
    }));

    return { title: testCases.attributes.PROFILE ??
             testCases.attributes["xml:base"],
             children };
  }

  return Promise.all((suite.children as Suite[]).map(handleTestCases));
}

/**
 * Make a test suite from a loaded XML suite.
 *
 * @param suite The suite to process.
 *
 * @param name The name to give to the suite, as a whole.
 *
 * @param resourceLoader The resource loader to use.
 *
 * @param Driver The driver to use to drive the code under test.
 *
 * @param Selection The selection that determines how tests are handled.
 */
export async function handleSuite(
  suite: Suite, name: string,
  resourceLoader: ResourceLoader,
  // tslint:disable-next-line:variable-name no-shadowed-variable
  Driver: DriverCtor,
  // tslint:disable-next-line:variable-name no-shadowed-variable
  Selection: SelectionCtor): Promise<void> {
  const driver = new Driver(resourceLoader);
  const selection = new Selection(driver);

  function handleTest({ handling, test }: TestInfo): void {
    const id = test.mustGetAttribute("ID");

    switch (handling) {
      case "skip":
        break;
      case "succeeds":
      case "fails":
        it(id, () => driver.run(test, handling));
        break;
      default:
        throw new Error(`unexpected handling type: ${handling}`);
    }
  }

  function handleTestCases({ title, children }: SuiteInfo): void {
    describe(title, () => {
      for (const child of children) {
        if ((child as TestInfo).test) {
          handleTest(child as TestInfo);
        }
        else {
          handleTestCases(child as SuiteInfo);
        }
      }
    });
  }

  const testCasesArr =
    await convertSuite(suite, resourceLoader, driver, selection);

  describe(name, () => {
    for (const testCases of testCasesArr) {
      handleTestCases(testCases as SuiteInfo);
    }
  });
}
