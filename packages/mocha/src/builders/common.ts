import { Driver, DriverCtor } from "@xml-conformance-suite/js/driver";
import { ResourceLoader } from "@xml-conformance-suite/js/resource-loader";
import { Selection, SelectionCtor,
         TestHandling } from "@xml-conformance-suite/js/selection";
import { Suite, Test } from "@xml-conformance-suite/js/test-suite";

type TestInfo = { handling: TestHandling, test: Test };
type SuiteInfo = { title: string, children: (SuiteInfo|TestInfo)[] };

//
// We used to use Promise.all calls that processed all children of a suite at
// once, like this:
//
// return Promise.all((something.children ).map(handleTestCases));
//
// However, that became a problem because Chrome started giving out
// net::ERR_INSUFFICIENT_RESOURCES because some selections need to open the test
// files to determine whether the file needs to be included or not (e.g. BOM
// checks), and there are too many test files. (There are circa 3600 test files
// to open.)
//
// So now we break the list into smaller chunks. This is not a perfect
// solution. A better one would be to queue the calls to getTestHandling and
// have a limited number of pending calls. Maybe a future version will do this.
//

const CHUNK_SIZE = 100;

function *chunkify<T>(arr: T[]): Iterable<T[]> {
  for (let i = 0; i < arr.length; i += CHUNK_SIZE) {
    yield arr.slice(i, CHUNK_SIZE);
  }
}

/**
 * A mocha builder that builds the tests synchronously.
 */
async function convertSuite(suite: Suite,
                            // @ts-ignore
                            resourceLoader: ResourceLoader,
                            // @ts-ignore
                            driver: Driver,
                            selection: Selection):
Promise<(SuiteInfo | TestInfo)[]> {
  async function handleTest(test: Test): Promise<TestInfo> {
    const handling = await selection.getTestHandling(test);
    return { handling, test };
  }

  async function handleTestCases(testCases: Suite):
  Promise<SuiteInfo | TestInfo> {
    const children: (SuiteInfo | TestInfo)[] = [];
    for (const chunk of chunkify(testCases.children)) {
      children.push(...await Promise.all(chunk.map(child => {
        switch (child.name) {
          case "TESTCASES":
            return handleTestCases(child as Suite);
          case "TEST":
            return handleTest(child as Test);
          default:
            throw new Error(`unexpected child name: ${child.name}`);
        }
      })));
    }
    return {
      title: testCases.attributes.PROFILE ?? testCases.attributes["xml:base"],
      children,
    };
  }

  const ret: (SuiteInfo | TestInfo)[] = [];
  for (const chunk of chunkify(suite.children as Suite[])) {
    ret.push(...await Promise.all(chunk.map(handleTestCases)));
  }

  return ret;
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
