import { Driver } from "../../build/dist/drivers/xmllint";

import { makeCommonTests } from "./common-tests";

export function makeTests(): void {
  makeCommonTests(() => new Driver(), {
    canValidate: true,
    processesExternalEntities: true,
  });
}
