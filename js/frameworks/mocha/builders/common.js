/**
 * A mocha builder that builds the tests synchronously.
 */
/* global it describe */

"use strict";

function convertSuite(suite, resourceLoader, driver, selection) {
  function handleTest(test) {
    return Promise.resolve()
      .then(() => {
        if (test.name !== "TEST") {
          throw new Error("expected a TEST element");
        }

        return selection.getTestHandling(test)
          .then(handling => ({ handling, test }));
      });
  }

  function handleTestCases(testCases) {
    return Promise.resolve()
      .then(() => {
        if (testCases.name !== "TESTCASES") {
          throw new Error("expected a TESTCASES element");
        }

        let title = testCases.attributes.PROFILE;
        if (!title) {
          title = testCases.attributes["xml:base"];
        }

        return Promise.all(testCases.children.map((child) => {
          switch (child.name) {
          case "TESTCASES":
            return handleTestCases(child);
          case "TEST":
            return handleTest(child);
          default:
            throw new Error(`unexpected child name: ${child.name}`);
          }
        }))
          .then(children => ({ title, children }));
      });
  }

  return Promise.all(suite.children.map(handleTestCases));
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
function handleSuite(suite, name, resourceLoader, Driver, Selection) {
  const driver = new Driver(resourceLoader);
  const selection = new Selection(driver);

  function handleTest({ handling, test }) {
    const id = test.mustGetAttribute("ID");

    // 1660 passing (25s)
    // 84 failing

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

  function handleTestCases({ title, children }) {
    describe(title, () => {
      for (const child of children) {
        if (child.test) {
          handleTest(child);
        }
        else {
          handleTestCases(child);
        }
      }
    });
  }

  return convertSuite(suite, resourceLoader, driver, selection)
    .then((testCasesArr) => {
      describe(name, () => {
        for (const testCases of testCasesArr) {
          handleTestCases(testCases);
        }
      });
    });
}

exports.handleSuite = handleSuite;
