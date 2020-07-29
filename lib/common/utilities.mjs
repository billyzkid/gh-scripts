import childProcess from "child_process";
import fs from "fs";

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

export {
  writeOutput,
  execCommand
};
