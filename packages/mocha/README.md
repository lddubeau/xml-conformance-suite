This is an adapter for running the [XML conformance
suite](https://www.w3.org/XML/Test/) published by the W3C as part of a Mocha
test suite.

Using the Adapter
=================

There are two broad options:

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
$ mocha --delay [path to this package]/runners/basic.js \
  --xml-driver=@xml-conformance-suite/js/drivers/xmllint \
  --xml-selection=@xml-conformance-suite/js/selections/xmllint
```

The path to the runner needs to be appropriate to how you invoke your test
framework. If you run ``mocha`` you must give it the path where it can find the
runner in the same way you would if you asked it to run any other test file.
