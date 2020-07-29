import path from "path";
import * as utilities from "./utilities.mjs";

function getLog({ revisionRange, firstParent, paths, format, array } = {}) {
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

function getRepositoryPath() {
  const topLevelPath = utilities.execCommand("git rev-parse --show-toplevel", { encoding: "utf8" });
  return path.normalize(topLevelPath)
}

export {
  getLog,
  getRepositoryPath
};
