import Yargs from "yargs/yargs.js";
import { EOL } from "os";
import * as git from "../common/git.mjs";
import * as utilities from "../common/utilities.mjs";

const yargs = new Yargs()
  .usage("Usage: gh-scripts authors [options]")
  .option("help", {
    alias: ["h", "?"],
    describe: "Show help for this command",
    type: "boolean",
    nargs: 0
  })
  .option("version", {
    alias: "v",
    describe: "Show the package version",
    type: "boolean",
    nargs: 0
  })
  .option("revision-range", {
    alias: "r",
    describe: "Revision range containing the authors to include in the output",
    type: "string",
    nargs: 1
  })
  .option("exclude-pattern", {
    alias: "x",
    describe: "Regular expression pattern matching the authors to exclude from the output",
    type: "string",
    nargs: 1
  })
  .option("output-file", {
    alias: "f",
    describe: "Path to the output file",
    type: "string",
    nargs: 1
  })
  .option("output-encoding", {
    alias: "e",
    describe: "Encoding to use for the output file",
    type: "string",
    nargs: 1
  })
  .example("gh-scripts authors", "Generate a list of authors for all commits and output it to stdout")
  .example("gh-scripts authors -r v1.0.0.. -x robot -f ./AUTHORS -e utf8", "Generate a list of authors for the commits tagged v1.0.0 or later (excluding \"robot\" authors) and output it to the specified file (utf-8 encoding)")
  .epilog("Documentation: https://github.com/billyzkid/gh-scripts#authors")
  .wrap(120);

function run(args) {
  const { revisionRange, excludePattern, outputFile, outputEncoding } = yargs.parse(args);

  console.log("authors.run", { revisionRange, excludePattern, outputFile, outputEncoding });

  // get commit paths
  const relativePath = git.getRelativePath();
  const commitPaths = (relativePath) ? [relativePath] : null;
  const commitLog = git.getCommitLog(revisionRange, { firstParent: true, paths: commitPaths, format: "%an <%ae>", array: true });

  // filter duplicate authors
  let authors = commitLog.filter((item, index) => commitLog.indexOf(item) == index);

  // filter excluded authors
  if (excludePattern) {
    const excludeRegExp = new RegExp(excludePattern);
    authors = authors.filter((item) => !excludeRegExp.test(item));
  }

  // sort authors alphabetically
  authors.sort((a, b) => a.localeCompare(b));

  // format output
  const output = (authors.length > 0) ? authors.join(EOL) + EOL : "";

  // write output
  utilities.writeOutput(output, { file: outputFile, encoding: outputEncoding });
}

export {
  run
};
