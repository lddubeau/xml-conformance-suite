import { Driver } from "../../build/dist/drivers/sax";

import { GOOD_FIXTURE_PATH, makeCommonTests } from "./common-tests";

class FakeLoader {
  loadFile(path: string): Promise<string> {
    return Promise.resolve(path === GOOD_FIXTURE_PATH ? "<doc/>" : "<doc");
  }
}

export function makeTests(): void {
  makeCommonTests(() => new Driver(new FakeLoader()), {
    canValidate: false,
    processesExternalEntities: false,
  });
}
