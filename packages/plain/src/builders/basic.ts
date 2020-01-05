/**
 * A mocha builder that builds the tests asynchronously.
 */
import { Driver, DriverCtor } from "@xml-conformance-suite/js/driver";
import { ResourceLoader } from "@xml-conformance-suite/js/resource-loader";
import { Selection,
         SelectionCtor } from "@xml-conformance-suite/js/selection";
import { isTest, Suite, Test } from "@xml-conformance-suite/js/test-suite";

export interface TestRun {
  test: Test;
  run: () => Promise<boolean>;
}

export interface Results {
  driver: Driver;
  selection: Selection;
  testRuns: TestRun[];
}

/**
 * @param suite The loaded test suite.
 *
 * @param resourceLoader A resource loader for loading the resources needed by
 * the tests.
 *
 * @param DriverConstructor The driver constructor form which to create the
 * driver to use to drive the parser under test.
 *
 * @param SelectionConstructor The selection constructor from which to create
 * the selector that determines how tests are handled.
 */
export async function build(suite: Suite,
                            resourceLoader: ResourceLoader,
                            // tslint:disable-next-line:variable-name
                            DriverConstructor: DriverCtor,
                            // tslint:disable-next-line:variable-name
                            SelectionConstructor: SelectionCtor):
Promise<Results> {
  const driver = new DriverConstructor(resourceLoader);
  const selection = new SelectionConstructor(driver);

  // We use the promises array only to know when the computation is done.  We
  // could combine promises and result in a single array but then the array
  // would have to be first created with elements we do not care about, and then
  // filtered.
  const promises: Promise<void>[] = [];
  // We stuff the results in this array.
  const result: TestRun[] = [];
  suite.walkChildElements(child => {
    if (!isTest(child)) {
      return;
    }

    promises.push((async () => {
      const handling = await selection.getTestHandling(child);
      switch (handling) {
        case "skip":
          break;
        case "succeeds":
        case "fails":
          result.push({
            test: child,
            run: async () => {
              try {
                await driver.run(child, handling);
                return true;
              }
              catch {
                return false;
              }
            },
          });
          break;
        default:
          throw new Error(`unexpected handling type: ${handling}`);
      }
    })());
  });

  await Promise.all(promises); // Wait for result to be computed.
  return {
    driver,
    selection,
    testRuns: result,
  };
}
