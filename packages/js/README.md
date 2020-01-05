This is the JavaScript infrastructure for running the [XML conformance
suite](https://www.w3.org/XML/Test/) published by the W3C.

In this package you'll find:

* ``drivers`` which contains drivers for various XML parsers. The role of a
  driver is to pass the test data to a parser, run the parser and return the
  results to the test suite.

* ``selections`` which contains... er... selections. A selection is a module
  which exports a ``Selection`` class which determines how the suite is to deal
  with each test: run it, skip it, expect it to pass, expect it to fail, etc.

* ``lib`` which contains libraries to be used by the drivers and selections.

Using the Suite
===============

This library provides you with infrastructure, which is fine if you want to use
the infrastructure directly.

If you want to integrate the conformance suite to an existing test suite for
your application, you may instead use one of the packages that provide builders
and runners, or otherwise interfaces to your test framework of choice:
``@xml-conformance-suite/mocha``, ``@xml-conformance-suite/karma``.

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
