This is a framework for running the [XML conformance
suite](https://www.w3.org/XML/Test/) published by the W3C.

In this package you'll find the framework for running the suite with JavaScript:

* ``drivers`` which contains drivers for various XML parsers. The role of a
  driver is to pass the test data to a parser, run the parser and return the
  results to the test suite.

* ``selections`` which contains... er... selections. A selection is a module
  which exports a ``Selection`` class which determines how the suite is to deal
  with a test.

* ``frameworks`` which has one subdirectory per test framework for which this
  suite provides examples of how you can use the suite. (Yes, the word
  "framework" does double duty: this package *as a whole* is a framework for
  running the suite with JavaScript. It contains a ``frameworks`` directory that
  covers different *test frameworks* (Mocha, Karma, etc.).)

* ``lib`` which contains libraries to be used by the drivers, selections and
  frameworks.

Using the Suite
===============

There are two broad options to run the conformance suite:

1. Execute a runner from under ``runners``. This is generally appropriate when
you want to just run XML tests in isolation from other kinds of test, and may be
helpful when you are setting up or testing your XML test suite
configuration. The runner will load the driver you specify and use the selection
of tests you specify and will just run these tests.

2. Build a series of tests by using a builder under ``builders``. The builders
export a ``build`` function which allows you to incorporate the conformance
tests as part of larger suite.

In all cases you must specify:

1. How to run the code under test and determine whether the test was successful
or not. You do this by specifying a "driver".

2. How to dertermine which test to run and which to skip. You do this by
specifying a "selection".

Using A Runner
==============

You need to disclose the runner to the test framework it is made for and specify
the driver and selection on the command line. By convention the driver is
specified using the argument ``--xml-driver`` and the selection using the
argument ``--xml-selection``.

For instance, if you want to use the Mocha runner with the `xmllint` driver and
the `xmllint` selection:

```terminal
$ mocha --delay ./frameworks/mocha/runners/basic.js \
  --xml-driver=./drivers/xmllint \
  --xml-selection=./selections/xmllint
```

By convention, the paths for the driver and selection must be relative to the
installed code tree of this project. The path to the runner needs to be
appropriate to how you invoke your test framework. If you run ``mocha`` you must
give it the path where it can find the runner in the same way you would if you
asked it to run any other test file.

Similarly, you can run the suite on Chrome with the Karma runner like this:

```terminal
$ karma start ./frameworks/karma/karma.mocha.conf.js \
  --browsers=ChromeHeadless \
  --single-run \
  --xml-driver=./drivers/dom-parser \
  --xml-selection=./selections/chrome
```

Selections
==========

Selections determine how to handle each tests of the suite. A test may
be handled in one of three ways, represented by strings:

- ``"succeeds"`` indicates that the test runner must expect the XML processor to
  run without any error.

- ``"fails"`` indicates that the test runner must expect the XML processor to
  emit one or more errors.

- ``"skip"`` indicates that the test runner must ignore the test. This handling
  makes sense for dealing with tests that an XML processor will never ever
  pass. A common example is non-validating processors which normally cannot pass
  tests of type ``"invalid"``. Validation is deemed to be outside the scope of
  the processor. There's no point in including these tests in the suite: they
  did not pass yesterday, they don't pass today, and they won't pass tomorrow.

``search-tests``
================

The ``search-tests`` utility can be used to search through the test
suite. Consult its help to learn how to use it. **NOTE THAT ``search-tests`` IS
NOT PART OF THE API.** It may radically change or be removed without
warning. Such changes won't be considered to be "breaking changes".
