#
# This Makefile should be run when a new version of the **W3C suite** is
# released.
#
all: cleaned/xmlconf-flattened.xml cleaned/testcases.dtd

cleaned/xmlconf-flattened.xml:
	-mkdir -p cleaned
# The sed bit is there to fix a path mistake in the test suite. The issue was
# reported a long time ago, but got no action!
#
# https://lists.w3.org/Archives/Public/public-xml-testsuite/2013Dec/0000.html
	xmllint --noent xmlconf/xmlconf.xml | sed 's/eduni\/namespaces\/misc/eduni\/misc/' > $@

cleaned/testcases.dtd:
	-mkdir -p cleaned
	cp $@ xmlconf/testcases.dtd
