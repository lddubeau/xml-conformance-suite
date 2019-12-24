/**
 * A selection that encompasses all tests, except for tests that we deemed
 * inherently faulty.
 *
 * Tests of type ``not-wf``, ``invalid`` and ``error`` are expected to result in
 * a failure of the XML processor. Tests of type ``valid`` are expected to
 * result in a successful run of the XML processor.
 */

"use strict";

exports.Selection = require("./base").BaseSelection;
