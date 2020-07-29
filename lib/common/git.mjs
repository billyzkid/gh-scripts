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

  let result = utilities.execCommand(command, { encoding: "utf8" });

  if (array) {
    result = result.split("\n").filter((line) => line);
  }

  return result;
}

function getRepositoryPath() {
  const topLevelPath = utilities.execCommand("git rev-parse --show-toplevel", { encoding: "utf8" });

  return path.normalize(topLevelPath);
}

function getRelativePath(toPath) {
  const repositoryPath = getRepositoryPath();

  return path.relative(repositoryPath, toPath || "");
}

export {
  getCommitLog,
  getRepositoryPath,
  getRelativePath
};
