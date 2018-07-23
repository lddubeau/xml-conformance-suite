"use strict";

/**
 * Tests that the xml-conformance-suite project has deemed to be "bad". This is
 * an array of test ids.
 *
 * If you think we erred in deeming those tests "bad", please file an issue
 * report and present an argument as to why these tests are good.
 */
const BAD_TESTS = [
  //
  // This test purports to test a bad `CDEnd` production... however the `CDATA`
  // section begins with `cdata` not `CDATA`, which is an error in the `CDStart`
  // production. xmllint gives "invalid element name" there. Moreover, the extra
  // close brackets does not appear to actually *be* an error. xmllint does not
  // have an issue with ]]]> and if I run saxon on a source document with the
  // ]]]> construct, the first bracket is part of the cdata.
  //
  // Issue raised here:
  // https://lists.w3.org/Archives/Public/public-xml-testsuite/2005Mar/0004.html
  //
  // but there does not seem to have been any resolution.
  //
  "ibm-not-wf-P21-ibm21n02.xml",
  // These test an errata introduced for XML 1.0 edition 2. See section "E15" in
  // this document:
  //
  // https://www.w3.org/XML/xml-V10-2e-errata
  //
  // We think these tests are wrong. The later part of the errata states that
  // internal references that resolve to whitespace are fine. (Note that xmllint
  // fails both tests.)
  "rmt-e2e-15g",
  "rmt-e2e-15h",
];

exports.BAD_TESTS = BAD_TESTS;
