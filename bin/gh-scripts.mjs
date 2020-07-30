#!/usr/bin/env node

import dotenv from "dotenv"
import * as authors from "../lib/commands/authors.mjs";
import * as changelog from "../lib/commands/changelog.mjs";
import * as github from "../lib/common/github.mjs";
import * as utilities from "../lib/common/utilities.mjs";

dotenv.config({ path: utilities.findFileUp(".env") });
github.config({ token: process.env.GITHUB_API_TOKEN });

const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case "authors":
    authors.run(args);
    break;

  case "changelog":
    changelog.run(args);
    break;

  default:
    throw new Error(`Invalid command: ${command}`);
}
