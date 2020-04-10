/**
 * Parsing facilities for parsing the XML files that describe the W3C
 * conformance suite. The facilities here implement just as much as needed to
 * parse the suite. **They are not adequate for general XML processing!!!**
 *
 * @copyright The contibutors of xml-conformance-suite.
 */
import path from "path";

import { SaxesParser } from "saxes";

import { ResourceLoader } from "./resource-loader";
import { Suite, Test } from "./test-suite";

/**
 * A parser tailored for parsing the W3C suite.
 */
export class TestParser {
  /** The top element. This gets a value after ``parse`` returns. */
  top: Suite | undefined;
  private readonly stack: (Test | Suite)[] = [];
  private skip: number = 0;

  private readonly parser: SaxesParser;

  /**
   * @param documentBase The base URI of the document. Given that the XML
   * provided by the W3C must be preprocessed to flatten it, it is important to
   * make sure that the value passed here corresponds to the directory that
   * contained the *original* top level XML file before flattening.
   *
   * @param resourceLoader The resource loader to use to load external
   * resources.
   */
  constructor(private readonly documentBase: string,
              private readonly resourceLoader: ResourceLoader) {
    const parser = this.parser = new SaxesParser({ position: false });

    parser.on("opentag", elementData => {
      if (this.skip > 0) {
        this.skip++;
        return;
      }

      const { name } = elementData;
      let el;
      switch (name) {
        case "TEST":
          el = new Test(name, elementData.attributes as Record<string, string>,
                        this.documentBase,
                        this.resourceLoader);
          break;
          // As far as we are concerned TESTSUITE is just a top-level TESTCASES.
        case "TESTCASES":
        case "TESTSUITE":
          el =
            new Suite(name, elementData.attributes as Record<string, string>,
                      this.documentBase);
          break;
        case "B":
        case "EM":
          // B and EM can appear as children of TEST for marking up the text in
          // TEST. Since we do not use th text in TEST, we don't use these
          // either.
          this.skip++;
          return;
        default:
          throw new Error(`unexpected element ${name}`);
      }

      const topEl = this.stack[0];
      if (topEl) {
        topEl.appendChild(el);
      }

      if (!this.top) {
        if (!(el instanceof Suite)) {
          throw new Error("the top element must be a suite");
        }

        this.top = el;
      }

      this.stack.unshift(el);
    });

    parser.on("closetag", () => {
      if (this.skip > 0) {
        this.skip--;
        return;
      }

      if (this.stack.length === 0) {
        throw new Error("stack underflow");
      }
      this.stack.shift();
    });

    parser.on("error", err => {
      throw err;
    });
  }

  /**
   * Parse the *flattened* suite. "Flattened" is important. The document passed
   * to this function must not depend on external entities. So the W3C suite
   * must have been preprocessed with a tool that resolves all the entities and
   * replaces them with their values. e.g. ``xmllint --noent`` does this.
   *
   * @param text This must be the text of the suite *flattened* as a single XML
   * file.
   */
  parse(text: string): void {
    this.parser.write(text.toString()).close();
  }
}

export async function loadTests(resourceLoader: ResourceLoader):
Promise<Suite> {
  // We resolve the package.json because if we try resolving the package name by
  // itself it may fail if ``main`` is not set in ``package.json``, and there's
  // no point for ``main`` in this package. So resolve the file and then take
  // the dirname.
  const pkg =
    path.dirname(
      require.resolve("@xml-conformance-suite/test-data/package.json"));
  const source =
    await resourceLoader.loadFile(path.join(pkg, "cleaned",
                                            "xmlconf-flattened.xml"));
  const parser = new TestParser(path.join(pkg, "xmlconf"),
                                resourceLoader);
  parser.parse(source);
  return parser.top!;
}
