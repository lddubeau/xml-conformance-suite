/**
 * A mocha builder that builds the tests asynchronously.
 */
import { DriverCtor } from "@xml-conformance-suite/js/drivers/driver";
import { ResourceLoader } from "@xml-conformance-suite/js/lib/resource-loader";
import { Suite } from "@xml-conformance-suite/js/lib/test-suite";
import { SelectionCtor } from "@xml-conformance-suite/js/selections/selection";
import { handleSuite } from "./common";

/**
 * @param suite The loaded test suite.
 *
 * @param name The name to give to the suite, as a whole.
 *
 * @param resourceLoader A resource loader for loading the resources needed by
 * the tests.
 *
 * @param Driver The driver to use to drive the code under test.
 *
 * @param Selection The selection that determines how tests are handled.
 */
export function build(suite: Suite, name: string,
                      resourceLoader: ResourceLoader,
                      // tslint:disable-next-line:variable-name
                      Driver: DriverCtor,
                      // tslint:disable-next-line:variable-name
                      Selection: SelectionCtor): Promise<void> {
  return handleSuite(suite, name, resourceLoader, Driver, Selection);
}
