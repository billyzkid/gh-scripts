#!/usr/bin/env node

import * as authors from "../lib/authors.mjs";
import * as changelog from "../lib/changelog.mjs";
import * as release from "../lib/release.mjs";

const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case "authors":
    authors.run(args);
    break;

  case "changelog":
    changelog.run(args);
    break;

  case "release":
    release.run(args);
    break;

  default:
    throw new Error(`Invalid command: ${command}`);
}
