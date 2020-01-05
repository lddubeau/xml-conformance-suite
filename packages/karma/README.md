This is an example of what is needed for running the [XML conformanc
suite](https://www.w3.org/XML/Test/) published by the W3C with Karma.

You can run the suite on Chrome with the Karma runner like this:

```terminal
$ karma start [path to this package]/karma/karma.mocha.conf.js \
  --browsers=ChromeHeadless \
  --single-run \
  --xml-driver=@xml-conformance-suite/js/drivers/dom-parser \
  --xml-selection=@xml-conformance-suite/js/selections/chrome
```
