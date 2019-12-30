import { ResourceLoader } from "../lib/resource-loader";
import { Test } from "../lib/test-suite";
import { TestHandling } from "../selections/base";
import { BaseDriver } from "./base";

export class Driver extends BaseDriver {
  constructor(private readonly resourceLoader: ResourceLoader) {
    super();
  }

  async run(test: Test, handling: TestHandling): Promise<void> {
    const { resolvedURI } = test;
    const source = await this.resourceLoader.loadFile(resolvedURI);
    const parser = new DOMParser();
    let doc: Document;

    let failed = false;
    try {
      doc = parser.parseFromString(source, "text/xml");
    }
    catch (ex) {
      // On IE10/11 bad source will cause a SyntaxError.
      if (ex.name !== "SyntaxError" || ex.code !== 12) {
        throw ex;
      }

      failed = true;
    }

    failed = failed ||
      // Firefox
      doc!.getElementsByTagNameNS(
        // tslint:disable-next-line:no-http-string
        "http://www.mozilla.org/newlayout/xml/parsererror.xml",
        "parsererror")[0] !== undefined ||
      // Chrome
      // tslint:disable-next-line:no-http-string
      doc!.getElementsByTagNameNS("http://www.w3.org/1999/xhtml",
                                  "parsererror")[0] !== undefined;

    this.processResult(test, handling, !failed);
  }
}
