import mocha from "mocha";

import { Test } from "../../../lib/test-suite";

export const mochaTestToTest: WeakMap<mocha.Test, Test> = new WeakMap();
