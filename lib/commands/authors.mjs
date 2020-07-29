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
    default: './AUTHORS',
    nargs: 1
  })
  .option("output-encoding", {
    alias: "e",
    describe: "Encoding to use for the output file",
    type: "string",
    default: 'utf8',
    nargs: 1
  })
  .example("gh-scripts authors", "Generate a list of authors for all commits and output it to stdout")
  .example("gh-scripts authors -r v1.0.0.. -x robot -f ./AUTHORS -e utf8", "Generate a list of authors for the commits tagged v1.0.0 or later (excluding \"robot\" authors) and output it to the specified file (utf-8 encoding)")
  .epilog("Documentation: https://github.com/billyzkid/gh-scripts#authors")
  .wrap(120);

function run(args) {
  const { revisionRange, excludePattern, outputFile, outputEncoding } = yargs.parse(args);
  console.log("authors.run", { revisionRange, excludePattern, outputFile, outputEncoding });

  // get commit log
  const repositoryPath = git.getRepositoryPath("");
  const commitPaths = repositoryPath ? [repositoryPath] : null;
  let commitLog = git.getCommitLog(revisionRange, { firstParent: true, paths: commitPaths, format: "fuller", array: true });

  // filter excluded items
  if (excludePattern) {
    const excludeRegExp = new RegExp(excludePattern);
    commitLog = commitLog.filter((item) => !excludeRegExp.test(item));
  }

  // extract author substrings
  const authors = [];
  const authorRegExp = new RegExp("^Author:     (.+)$", "m")

  commitLog.forEach((item) => {
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
