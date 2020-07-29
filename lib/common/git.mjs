import path from "path";
import * as utilities from "./utilities.mjs";

function getCommitLog(revisionRange, { firstParent, paths, format, array } = {}) {
  let command = "git log";

  if (format) {
    command += ` --pretty="${format}"`;
  }

  if (firstParent) {
    command += " --first-parent";
  }

  if (revisionRange) {
    command += " " + revisionRange;
  }

  if (paths && paths.length > 0) {
    command += " -- " + paths.join(" ");
  }

  let log = utilities.execCommand(command, { encoding: "utf8" });

  if (array) {
    log = log.split("\n").filter((line) => line);
  }

  return log;
}

function getCommitPaths() {
  const repositoryPath = getRepositoryPath();
  const relativePath = path.relative(repositoryPath, "");
  const commitPaths = relativePath ? [relativePath] : null;

  return commitPaths;
}

function getRepositoryPath() {
  const topLevelPath = utilities.execCommand("git rev-parse --show-toplevel", { encoding: "utf8" });
  const repositoryPath = path.normalize(topLevelPath);

  return repositoryPath;
}

export {
  getCommitLog,
  getCommitPaths,
  getRepositoryPath
};
