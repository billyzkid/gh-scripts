import Yargs from "yargs/yargs.js";
import path from "path";
import * as git from "../common/git.mjs";
import * as github from "../common/github.mjs";

const yargs = new Yargs()
  .usage("Usage: gh-scripts changelog [options]")
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
    describe: "Revision range containing the commits to include in the output",
    type: "string",
    nargs: 1
  })
  .option("exclude-pattern", {
    alias: "x",
    describe: "Regular expression pattern matching the commits to exclude from the output",
    type: "string",
    nargs: 1
  })
  .option("output-file", {
    alias: "f",
    describe: "Path to the output file",
    type: "string",
    default: './CHANGELOG.md',
    nargs: 1
  })
  .option("output-encoding", {
    alias: "e",
    describe: "Encoding used for the output file",
    type: "string",
    default: 'utf8',
    nargs: 1
  })
  .example("gh-scripts changelog", "Generate a changelog for all commits and output it to a CHANGELOG.md file (using utf-8 encoding)")
  .example("gh-scripts changelog -r v1.0.0.. -x robot -f ./CHANGELOG.md -e utf8", "Generate a changelog for the commits tagged v1.0.0 or later (excluding \"robot\" commits) and output it to the specified file (using utf-8 encoding)")
  .epilog("Documentation: https://github.com/billyzkid/gh-scripts#changelog")
  .wrap(140);

function run(args) {
  const { revisionRange, excludePattern, outputFile, outputEncoding } = yargs.parse(args);
  console.log("changelog.run", { revisionRange, excludePattern, outputFile, outputEncoding });

  const repositoryPath = git.getRepositoryPath();
  const relativePath = path.relative(repositoryPath, "");
  const commitPaths = relativePath ? [relativePath] : null;

  return Promise.all([
    github.getCommits({ revisionRange, firstParent: true, paths: commitPaths }),
    github.getIssues(),
    github.getReleases()
  ]).then(([allCommits, allIssues, allReleases]) => {
    console.log(allCommits, allIssues, allReleases);
  });
}

export {
  run
};
