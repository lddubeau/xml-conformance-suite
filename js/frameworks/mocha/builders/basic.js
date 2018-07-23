/**
 * A mocha builder that builds the tests asynchronously.
 */

"use strict";

const { handleSuite } = require("./common");

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
function build(suite, name, resourceLoader, Driver, Selection) {
  return handleSuite(suite, name, resourceLoader, Driver, Selection);
}

exports.build = build;
