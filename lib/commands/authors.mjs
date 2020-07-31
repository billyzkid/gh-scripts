import path from "path";
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
    default: false,
    nargs: 0
  })
  .option("version", {
    alias: "v",
    describe: "Show the package version",
    type: "boolean",
    default: false,
    nargs: 0
  })
  .option("revision-range", {
    alias: "r",
    describe: "Revision range containing the commits to include in the output",
    type: "string",
    default: null,
    nargs: 1
  })
  .option("exclude-pattern", {
    alias: "x",
    describe: "Regular expression pattern matching the commits to exclude from the output",
    type: "string",
    default: null,
    nargs: 1
  })
  .option("output-file", {
    alias: "f",
    describe: "Path to the output file",
    type: "string",
    default: './AUTHORS',
    nargs: 1
  })
  .option("output-encoding", {
    alias: "e",
    describe: "Encoding used for the output file",
    type: "string",
    default: 'utf8',
    nargs: 1
  })
  .example("gh-scripts authors", "Generate a list of authors for all commits and output it to an AUTHORS file (using utf-8 encoding)")
  .example("gh-scripts authors -r v1.0.0.. -x robot -f ./AUTHORS -e utf8", "Generate a list of authors for the commits tagged v1.0.0 or later (excluding \"robot\" commits) and output it to the specified file (using utf-8 encoding)")
  .epilog("Documentation: https://github.com/billyzkid/gh-scripts#authors")
  .wrap(140);

function run(args) {
  const { revisionRange, excludePattern, outputFile, outputEncoding } = yargs.parse(args);
  // console.log("authors.run", { revisionRange, excludePattern, outputFile, outputEncoding });

  const repositoryPath = git.getRepositoryPath();
  const relativePath = path.relative(repositoryPath, "");
  const commitPaths = relativePath ? [relativePath] : null;

  // get commit log
  let log = git.getLog({ revisionRange, firstParent: true, format: "fuller", paths: commitPaths, array: true });

  // filter excluded items
  if (excludePattern) {
    const excludeRegExp = new RegExp(excludePattern);
    log = log.filter((item) => !excludeRegExp.test(item));
  }

  const authors = [];
  const authorRegExp = new RegExp("^Author:     (.+)$", "m")

  // extract author substrings while removing duplicates
  log.forEach((item) => {
    const match = authorRegExp.exec(item);

    if (match && authors.indexOf(match[1]) == -1) {
      authors.push(match[1]);
    }
  });

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
