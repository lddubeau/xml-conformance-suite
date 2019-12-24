/**
 * THIS IS EXAMPLE CODE. IT IS NOT PART OF THE API AND MAY CHANGE OR DISAPPEAR
 * AT ANY POINT.
 *
 * This selector is meant to select only those tests that Chrome passes.
 */

"use strict";

const { Selection: WhatwgSelection } = require("./whatwg");

//
// Most likely platform issues (i.e. issues outside the XML parser itself but
// with the JavaScript runtime, either due to the ES standard or the runtime's
// own quirks):
//
// - surrogate encoding:
//
//   V8 goes off the rails when it encounters a surrogate outside a pair. There
//   does not appear to be a workaround.
//
// - unicode garbage-in garbage-out:
//
//   V8 passes garbage upon encountering bad unicode instead of throwing a
//   runtime error. (Python throws.)
//
// - xml declaration encoding:
//
//   By the time the parser sees the document, it cannot know what the original
//   encoding was. It may have been UTF16, which was converted correctly to an
//   internal format.
//
// These are genuine parser errors:
//
// - ignores wf errors in DOCTYPE:
//
//   Even non-validating parsers must report wellformedness errors in DOCTYPE.
//
// - naming error with namespaces:
//
//   The parser should error on an element name like a:b:c due to the two
//   colons. Chrome currently just omits the elements that are not well-formed.
//

const PROBLEMATIC = {
  "not-wf-sa-168": "surrogate encoding",
  "not-wf-sa-169": "surrogate encoding",
  "not-wf-sa-170": "unicode garbage-in garbage-out",
  "ibm-not-wf-P02-ibm02n30.xml": "surrogate encoding",
  "ibm-not-wf-P02-ibm02n31.xml": "surrogate encoding",
  "ibm-not-wf-P82-ibm82n03.xml": "ignores wf errors in DOCTYPE",
  "rmt-e2e-27": "surrogate encoding",
  "rmt-e2e-61": "xml declaration encoding",
  "rmt-ns10-013": "naming error with namespaces",
  "rmt-ns10-016": "naming error with namespaces",
  "rmt-ns10-026": "naming error with namespaces",
  "x-ibm-1-0.5-not-wf-P04-ibm04n21.xml": "surrogate encoding",
  "x-ibm-1-0.5-not-wf-P04-ibm04n22.xml": "surrogate encoding",
  "x-ibm-1-0.5-not-wf-P04-ibm04n23.xml": "surrogate encoding",
  "x-ibm-1-0.5-not-wf-P04-ibm04n24.xml": "surrogate encoding",
  "x-ibm-1-0.5-not-wf-P04a-ibm04an21.xml": "surrogate encoding",
  "x-ibm-1-0.5-not-wf-P04a-ibm04an22.xml": "surrogate encoding",
  "x-ibm-1-0.5-not-wf-P04a-ibm04an23.xml": "surrogate encoding",
  "x-ibm-1-0.5-not-wf-P04a-ibm04an24.xml": "surrogate encoding",
  "hst-lhs-007": "xml declaration encoding",
};

class Selection extends WhatwgSelection {
  getTestHandling(test) {
    return Promise.resolve()
      .then(() => (PROBLEMATIC[test.id] ? "skip" :
                   super.getTestHandling(test)));
  }
}

exports.Selection = Selection;
