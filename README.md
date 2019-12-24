This is a framework for running the [XML conformance
suite](https://www.w3.org/XML/Test/) published by the W3C.

This version includes version 20130923 of the W3C suite.

Caveats
=======

This suite is a binary pass/fail suite. A lot of this is due to
factors outside the control of this project.

First, XML specification does not got into great details as to how
errors must be reported. XPath 3.0, for instance, goes to great
lengths to specify exacly what error code must be produced when a
problem occurs. So it is possible to test an XPath 3.0 implementation
to verify that it reports specific problems. Not so for XML.

Second, (and probably due to the previous issue), the automatically
actionable information in the W3C suite is not enough for checking
specific error conditions. Someone reading the test descriptions and
reading the XML of the test cases could figure out what error an XML
processor should report. However, it is beyond the scope of this
project to check error messages.

The upshot is that a test that expects the XML processor to report an
error could pass because the XML processor reports an error *for the
wrong reason*.

Organization
============

The code is organized in NPM subpackages:

- ``@xml-conformance-suite/test-data`` contains the language-independent data
  for the test.

- ``@xml-conformance-suite/js`` contains the JS framework for running the test
  suite.
