// tslint:disable:no-console non-literal-fs-path

import { spawn } from "child_process";
import fs from "fs";
import path from "path";

import argparse from "argparse";

const testData =
      path.dirname(require.resolve(
        "@xml-conformance-suite/test-data/package.json"));

import { ResourceLoader } from "../lib/resource-loader";
import { isTest, Suite, Test, TestParser } from "../lib/test-parser";

function loadTests(resourceLoader: ResourceLoader): Suite {
  const testParser = new TestParser(path.join(testData, "xmlconf"),
                                    resourceLoader);
  testParser.parse(fs.readFileSync(path.join(testData,
                                             "cleaned/xmlconf-flattened.xml"))
                   .toString());
  const { top } = testParser;
  if (top!.name !== "TESTSUITE") {
    throw new Error("the top level element must be TESTSUITE");
  }

  return top as Suite;
}

const parser = new argparse.ArgumentParser({
  addHelp: true,
  description: "Search through the test suite.",
});

function checkUnrecognized(unknown: string[]): void {
  if (unknown && unknown.length) {
    parser.error(`Unrecognized arguments: ${unknown.join(", ")}`);
  }
}

function grepCommand(subargs: Record<string, any>): void {
  const uris: string[] = [];
  loadTests(new ResourceLoader()).walkChildElements(child => {
    if (isTest(child)) {
      uris.push(child.resolvedURI);
    }
  });

  if (!subargs.__extra) {
    parser.error("grep-xml at least needs a pattern");
  }

  spawn("grep", subargs.__extra.concat(uris), { stdio: "inherit" });
}

async function findBOMCommand(subargs: Record<string, any>): Promise<void> {
  checkUnrecognized(subargs.__extra);

  const { method } = subargs;
  const promises: Promise<{ test: Test, bom: boolean }>[] = [];
  switch (method) {
  case "get-has-bom":
    loadTests(new ResourceLoader()).walkChildElements(child => {
      if (isTest(child)) {
        promises.push(child.getHasBOM().then(bom => ({ test: child, bom })));
      }
    });
    break;
  case "bytes":
    loadTests(new ResourceLoader()).walkChildElements(child => {
      if (isTest(child)) {
        promises.push(new Promise((resolve, reject) => {
          fs.readFile(child.resolvedURI, (err, buf) => {
            if (err) {
              reject(err);

              return;
            }

            let zero;
            try {
              zero = buf.readUInt16LE(0);
            }
            catch (ex) {
              if (ex instanceof RangeError) {
                resolve({ test: child, bom: false });
                return;
              }

              reject(ex);
              return;
            }

            resolve({
              test: child,
              bom: zero === 0xFFFE || zero === 0xFEFF,
            });
          });
        }));
      }
    });
    break;
  default:
    throw new Error(`unknown method: ${method}`);
  }

  for (const { test, bom } of await Promise.all(promises)) {
    if (bom) {
      console.log(test.id);
    }
  }
}

const XSL_TEMPLATE = `\
<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    version="1.0">

 <xsl:template match="node()|@*">
   <xsl:apply-templates select="node()|@*"/>
 </xsl:template>

  <xsl:template match="@@EXPR@@">
    <xsl:choose>
      <xsl:when test="self::*">
        <xsl:copy-of select="."/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="."/>
      </xsl:otherwise>
    </xsl:choose>
    <xsl:text>&#xA;</xsl:text>
  </xsl:template>
</xsl:stylesheet>
`;

function selectCommand(subargs: Record<string, any>): void {
  checkUnrecognized(subargs.__extra);

  const child = spawn("xsltproc",
                      ["-",
                       path.join(__dirname,
                                 "../cleaned/xmlconf-flattened.xml")],
                      { stdio: ["pipe", "inherit", "inherit"] });
  child.stdin.write(XSL_TEMPLATE.replace("@@EXPR@@", subargs.expr));
  child.stdin.end();
}

function catCommand(subargs: Record<string, any>): void {
  checkUnrecognized(subargs.__extra);
  const { aspect, id } = subargs;
  switch (aspect) {
    case "definition":
      selectCommand({ expr: `//TEST[@ID='${id}']` });
      break;
    case "file":
      loadTests(new ResourceLoader()).walkChildElements(child => {
        if (child.attributes.id === id) {
          console.log(fs.readFileSync((child as Test).resolvedURI).toString());
        }
      });
      break;
    default:
      throw new Error(`uknown aspect: ${aspect}`);
  }
}

function dumpStat(stat: Map<unknown, unknown>): void {
  for (const [version, sum] of stat.entries()) {
    console.log(version, sum);
  }
}

function valuesCommand(subargs: Record<string, any>): void {
  checkUnrecognized(subargs.__extra);
  const suite = loadTests(new ResourceLoader());

  const { name, attribute } = subargs;
  if (attribute) {
    dumpStat(suite.getXMLAttributeStats(name));
  }
  else {
    if (!["version", "recommendation", "editions", "sections",
          "productions", "testType", "entities"].includes(name)) {
      throw new Error(`unsupported name: ${name}`);
    }
    dumpStat(suite.getPropertyStats(name));
  }
}

const subparsers = parser.addSubparsers({
  title: "subcommands",
  dest: "subcommand",
});

const grepXML = subparsers.addParser("grep-xml", {
  description: "Run grep on the XML of the test files. All parameters you pass \
are passed on to grep.",
  help: "Run grep on the XML of the test files.",
});

grepXML.setDefaults({ func: grepCommand });

const select = subparsers.addParser("select", {
  description: "Select tests by XPath expression.",
  help: "Select tests by XPath expression.",
});

select.addArgument("expr", {
  help: "An XPath 1.0 expression.",
});

select.setDefaults({ func: selectCommand });

const findBOM = subparsers.addParser("find-bom", {
  description: "Select tests that have a BOM in their main file.",
  help: "Select tests that have a BOM in their main file.",
});

findBOM.setDefaults({ func: findBOMCommand });

findBOM.addArgument(["-m", "--method"], {
  action: "store",
  choices: ["get-has-bom", "bytes"],
  defaultValue: "get-has-bom",
  help: "Select a method for checking the presence of the BOM. ``get-has-bom`` \
uses the ``getHasBOM`` method of ``Test`` elements. ``bytes`` reads the XML in \
binary mode. Default: ``%(defaultValue)s``.",
});

const cat = subparsers.addParser("dump", {
  description: "Dump a test to the screen.",
  help: "Dump a test to the screen.",
});

cat.setDefaults({ func: catCommand });

cat.addArgument("id", {
  action: "store",
  help: "The id of the test.",
});

cat.addArgument(["-a", "--aspect"], {
  action: "store",
  choices: ["definition", "file"],
  defaultValue: "definition",
  help: "Select which aspect of the test to dump. ``definition`` selects the \
test definition. ``file`` selects the test file.",
});

const values = subparsers.addParser("values", {
  description: "Dump the set of possible values for some properties of tests.",
  help: "Dump the set of possible values for some properties of tests.",
});

values.setDefaults({ func: valuesCommand });

values.addArgument("name", {
  action: "store",
  help: "The name of the property to get.",
});

values.addArgument(["-a", "--attribute"], {
  action: "storeTrue",
  defaultValue: false,
  help: "Whether to get the raw attribute value prior to any processing.",
});

// Patch argparse so that parseKnownArgs works with subparsers.
argparse.ArgumentParser.prototype.parseArgs =
  function parseArgs(...params: any[]): any {
    const [namespace, extra] = this.parseKnownArgs(...params);
    if (extra.length) {
      // We stuff the unrecognized parameters into an __extra field. Otherwise,
      // they are lost.
      namespace.__extra = (namespace.__extra || []).concat(extra);
    }

    return namespace;
  };

const [args] = parser.parseKnownArgs();

checkUnrecognized(args);

args.func(args);
