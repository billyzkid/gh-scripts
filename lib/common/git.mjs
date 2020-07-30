import path from "path";
import * as utilities from "./utilities.mjs";

function getLog({ revisionRange, firstParent, nameOnly, format, paths, array } = {}) {
  let command = "git log";

  if (revisionRange) {
    command += ` ${revisionRange}`;
  }

  if (firstParent) {
    command += " --first-parent";
  }

  if (nameOnly) {
    command += " --name-only";
  }

  if (format) {
    command += ` --pretty="${format}"`;
  }

  if (paths && paths.length > 0) {
    command += ` -- ${paths.join(" ")}`;
  }

  let log = utilities.execCommand(command, { encoding: "utf8" });

  if (array) {
    log = log.split("\n").filter((line) => line);
  }

  return log;
}

function getRepositoryName() {
  const result = utilities.execCommand("git remote --verbose", { encoding: "utf8" });
  return utilities.match(result, /([\w-]+\/[\w-]+)\.git/, 1);
}

function getRepositoryPath() {
  const result = utilities.execCommand("git rev-parse --show-toplevel", { encoding: "utf8" });
  return path.normalize(result)
}

export {
  getLog,
  getRepositoryName,
  getRepositoryPath
};
