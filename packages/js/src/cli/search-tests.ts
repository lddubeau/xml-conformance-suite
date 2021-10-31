// tslint:disable:no-console non-literal-fs-path

import { spawn } from "child_process";
import fs from "fs";
import path from "path";

import argparse from "argparse";

const testData =
      path.dirname(require.resolve(
        "@xml-conformance-suite/test-data/package.json"));

import { ResourceLoader } from "../resource-loader";
import { TestParser } from "../test-parser";
import { isTest, Suite, Test } from "../test-suite";

function loadTests(resourceLoader: ResourceLoader): Suite {
  const testParser = new TestParser(path.join(testData, "xmlconf"),
                                    resourceLoader);
  testParser.parse(fs.readFileSync(path.join(testData,
                                             "cleaned/xmlconf-flattened.xml"))
                   .toString());
  const { top } = testParser;
  return top!;
}

const parser = new argparse.ArgumentParser({
  add_help: true,
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
                       path.join(testData, "cleaned/xmlconf-flattened.xml")],
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

const subparsers = parser.add_subparsers({
  title: "subcommands",
  dest: "subcommand",
});

const grepXML = subparsers.add_parser("grep-xml", {
  description: "Run grep on the XML of the test files. All parameters you pass \
are passed on to grep.",
  help: "Run grep on the XML of the test files.",
});

grepXML.set_defaults({ func: grepCommand });

const select = subparsers.add_parser("select", {
  description: "Select tests by XPath expression.",
  help: "Select tests by XPath expression.",
});

select.add_argument("expr", {
  help: "An XPath 1.0 expression.",
});

select.set_defaults({ func: selectCommand });

const findBOM = subparsers.add_parser("find-bom", {
  description: "Select tests that have a BOM in their main file.",
  help: "Select tests that have a BOM in their main file.",
});

findBOM.set_defaults({ func: findBOMCommand });

findBOM.add_argument("-m", "--method", {
  action: "store",
  choices: ["get-has-bom", "bytes"],
  default: "get-has-bom",
  help: "Select a method for checking the presence of the BOM. ``get-has-bom`` \
uses the ``getHasBOM`` method of ``Test`` elements. ``bytes`` reads the XML in \
binary mode. Default: ``%(defaultValue)s``.",
});

const cat = subparsers.add_parser("dump", {
  description: "Dump a test to the screen.",
  help: "Dump a test to the screen.",
});

cat.set_defaults({ func: catCommand });

cat.add_argument("id", {
  action: "store",
  help: "The id of the test.",
});

cat.add_argument("-a", "--aspect", {
  action: "store",
  choices: ["definition", "file"],
  default: "definition",
  help: "Select which aspect of the test to dump. ``definition`` selects the \
test definition. ``file`` selects the test file.",
});

const values = subparsers.add_parser("values", {
  description: "Dump the set of possible values for some properties of tests.",
  help: "Dump the set of possible values for some properties of tests.",
});

values.set_defaults({ func: valuesCommand });

values.add_argument("name", {
  action: "store",
  help: "The name of the property to get.",
});

values.add_argument("-a", "--attribute", {
  action: "storeTrue",
  default: false,
  help: "Whether to get the raw attribute value prior to any processing.",
});

// Patch argparse so that parseKnownArgs works with subparsers.
argparse.ArgumentParser.prototype.parse_args =
  function parseArgs(...params: any[]): any {
    const [namespace, extra] = this.parse_known_args(...params);
    if (extra.length) {
      // We stuff the unrecognized parameters into an __extra field. Otherwise,
      // they are lost.
      namespace.__extra = (namespace.__extra || []).concat(extra);
    }

    return namespace;
  };

const [args] = parser.parse_known_args();

checkUnrecognized(args);

args.func(args);
