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

The code organized in subdirectories based on language. For now we
only have a top level ``js`` subdirectory for JavaScript. Other
languages may be added later. Under ``js`` you find:

* ``drivers`` which contains drivers for various XML parsers. The
  role of a driver is to pass the test data to a parser, run the
  parser and return the results to the test suite.

* ``selections`` which contains... er... selections. A selection is a
  module which exports a ``Selection`` class which determines how the
  suite is to deal with a test.

* ``frameworks`` which has one subdirectory per test framework for
  which this suite provides examples of how you can use the suite.

* ``lib`` which contains libraries to be used by the drivers,
  selections and frameworks.

Using the Suite
===============

There are two broad options to run the conformance suite:

1. Execute a runner from under ``runners``. This is generally
appropriate when you want to just run XML tests in isolation from
other kinds of test, and may be helpful when you are setting up or
testing your XML test suite configuration. The runner will load the
driver you specify and use the selection of tests you specify and will
just run these tests.

2. Build a series of tests by using a builder under ``builders``. The
builders export a ``build`` function which allows you to incorporate
the conformance tests as part of larger suite.

In all cases you must specify:

1. How to run the code under test and determine whether the test was
successful or not. You do this by specifying a "driver".

2. How to dertermine which test to run and which to skip. You do this
by specifying a "selection".

Using A Runner
==============

You need to disclose the runner to the test framework it is made for
and specify the driver and selection on the command line. By
convention the driver is specified using the argument ``--xml-driver``
and the selection using the argument ``--xml-selection``.

For instance, if you want to use the Mocha runner with the `xmllint`
driver and the `xmllint` selection:

```terminal
$ mocha --delay js/frameworks/mocha/runners/basic.js \
  --xml-driver=js/drivers/xmllint \
  --xml-selection=js/selections/xmllint
```

By convention, the paths must be relative to the top of this project.

Similarly, you can run the suite on Chrome with the Karma runner like
this:

```terminal
$ karma start js/frameworks/karma/karma.mocha.conf.js \
  --browsers=ChromeHeadless \
  --single-run \
  --xml-driver=js/drivers/dom-parser \
  --xml-selection=js/selections/chrome
```

Selections
==========

Selections determine how to handle each tests of the suite. A test may
be handled in one of three ways, represented by strings:

- ``"succeeds"`` indicates that the test runner must expect the XML
  processor to run without any error.

- ``"fails"`` indicates that the test runner must expect the XML
  processor to emit one or more errors.

- ``"skip"`` indicates that the test runner must ignore the test. This
  handling makes sense for dealing with tests that an XML processor
  will never ever pass. A common example is non-validating processors
  which normally cannot pass tests of type ``"invalid"``. There's no
  point is including these tests in the suite, they did not pass
  yesterday, don't pass today, and won't pass tomorrow.

``search-tests``
================

The ``search-tests`` utility can be used to search through the test
suite. Consult its help to learn how to use it. **NOTE THAT
``search-test`` IS NOT PART OF THE API.** It may radically change or
be removed without warning. Such changes won't be considered to be
"breaking changes".
