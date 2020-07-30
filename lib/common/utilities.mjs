import childProcess from "child_process";
import fs from "fs";
import nodeFetch from "node-fetch";
import path from "path";

function values(obj) {
  return Object.values(obj);
}

function match(text, regExp, group = 0) {
  const match = text.match(regExp);
  const result = (match && match.length > group) ? match[group] : null;

  return result;
}

function indent(text, { space = 2 } = {}) {
  const spaces = (typeof space === "number") ? " ".repeat(space) : space;
  const result = text.replace(/\r?\n/g, "$&" + spaces);

  return result;
}

function writeOutput(text, { file, encoding } = {}) {
  if (file) {
    fs.writeFileSync(file, text, { encoding });
  } else {
    process.stdout.write(text, encoding);
  }
}

function findFileUp(file, { fromPath, toPath } = {}) {
  const initialPath = (fromPath) ? path.resolve(fromPath) : path.resolve();
  const finalPath = (toPath) ? path.resolve(toPath) : path.parse(initialPath).root;

  let currentPath = initialPath;
  let filePath;

  do {
    filePath = path.resolve(currentPath, file);

    if (existsPath(filePath)) {
      return filePath;
    } else if (currentPath === finalPath) {
      return null;
    }

    currentPath = path.dirname(currentPath);
  } while (true);
}

function existsPath(path) {
  try {
    fs.accessSync(path);
    return true;
  } catch (error) {
    return false;
  }
}

function execCommand(command, { encoding, stdio } = {}) {
  let result = childProcess.execSync(command, { encoding, stdio });

  if (typeof result === "string") {
    result = result.trim();
  }

  return result;
}

function fetch(url, { method, headers, body } = {}) {
  return nodeFetch(url, { method, headers, body });
}

export {
  values,
  match,
  indent,
  writeOutput,
  findFileUp,
  existsPath,
  execCommand,
  fetch
};
