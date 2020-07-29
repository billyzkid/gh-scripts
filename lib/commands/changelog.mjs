import path from "path";
import * as git from "../common/git.mjs";
import * as github from "../common/github.mjs";

function run(args) {
  const { revisionRange, excludePattern, outputFile, outputEncoding } = {};//yargs.parse(args);
  //console.log("changelog.run", { revisionRange, excludePattern, outputFile, outputEncoding });

  // const repositoryPath = git.getRepositoryPath();
  // const currentPath = process.cwd();
  // const relativePath = path.relative(repositoryPath, currentPath);
  // const commitPaths = (relativePath) ? ["."] : undefined;

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
