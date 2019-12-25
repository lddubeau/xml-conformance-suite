/**
 * THIS IS EXAMPLE CODE. IT IS NOT PART OF THE API AND MAY CHANGE OR DISAPPEAR
 * AT ANY POINT.
 */
import sax from "sax";

import { ResourceLoader } from "../lib/resource-loader";
import { Test } from "../lib/test-parser";
import { TestHandling } from "../selections/base";
import { BaseDriver } from "./base";

export class Driver extends BaseDriver {
  /**
   * @param resourceLoader A resource loader required by for loading test files.
   */
  constructor(private readonly resourceLoader: ResourceLoader) {
    super();
  }

  async run(test: Test, handling: TestHandling): Promise<void> {
    const { resolvedURI } = test;
    const source = await this.resourceLoader.loadFile(resolvedURI);
    const errors = [];
    // We have to use `as any` to work around a bug in the typings of sax.
    const parser = sax.parser(true, {
      xmlns: !test.forbidsNamespaces,
      strictEntities: true,
    } as any);
    parser.onerror = err => {
      errors.push(err);
    };

    parser.write(source);
    parser.close();
    this.processResult(test, handling, errors.length === 0);
  }
}
