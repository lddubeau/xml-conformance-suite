import mocha from "mocha";

import { Test } from "../../../lib/test-parser";

export const mochaTestToTest: WeakMap<mocha.Test, Test> = new WeakMap();
