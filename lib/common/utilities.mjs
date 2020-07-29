import childProcess from "child_process";
import fs from "fs";
import nodeFetch from "node-fetch";

function match(text, regExp, group = 0) {
  const match = text.match(regExp);
  const result = (match && match.length > group) ? match[group] : null;

  return result;
}

function writeOutput(text, { file, encoding } = {}) {
  if (file) {
    fs.writeFileSync(file, text, { encoding });
  } else {
    process.stdout.write(text, encoding);
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
  match,
  writeOutput,
  execCommand,
  fetch
};
