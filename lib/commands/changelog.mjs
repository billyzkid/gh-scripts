import { EOL } from "os";
import path from "path";
import Yargs from "yargs/yargs.js";
import * as git from "../common/git.mjs";
import * as github from "../common/github.mjs";
import * as utilities from "../common/utilities.mjs";

const yargs = new Yargs()
  .usage("Usage: gh-scripts changelog [options]")
  .option("help", {
    alias: ["h", "?"],
    describe: "Show help for this command",
    type: "boolean",
    default: false,
    nargs: 0
  })
  .option("version", {
    alias: "v",
    describe: "Show the package version",
    type: "boolean",
    default: false,
    nargs: 0
  })
  .option("revision-range", {
    alias: "r",
    describe: "Revision range containing the commits to include in the output",
    type: "string",
    default: null,
    nargs: 1
  })
  .option("exclude-pattern", {
    alias: "x",
    describe: "Regular expression pattern matching the commits to exclude from the output",
    type: "string",
    default: null,
    nargs: 1
  })
  .option("output-file", {
    alias: "f",
    describe: "Path to the output file",
    type: "string",
    default: './CHANGELOG.md',
    nargs: 1
  })
  .option("output-encoding", {
    alias: "e",
    describe: "Encoding used for the output file",
    type: "string",
    default: 'utf8',
    nargs: 1
  })
  .example("gh-scripts changelog", "Generate a changelog for all commits and output it to a CHANGELOG.md file (using utf-8 encoding)")
  .example("gh-scripts changelog -r v1.0.0.. -x robot -f ./CHANGELOG.md -e utf8", "Generate a changelog for the commits tagged v1.0.0 or later (excluding \"robot\" commits) and output it to the specified file (using utf-8 encoding)")
  .epilog("Documentation: https://github.com/billyzkid/gh-scripts#changelog")
  .wrap(140);

// TODO: make these configurable
const groupByRelease = true;
const groupByLabel = true;
const groupByPath = false;

// TODO: make these configurable
const releases = {
  default: {
    name: "Unreleased",
    description: "The following commits are not released."
  }
};

const labels = {
  default: {
    name: "Unlabeled",
    description: "The following commits are not labeled."
  },
  "bug": {
    name: "Bug",
    description: "The following commits are labeled 'bug'."
  },
  "duplicate": {
    name: "Duplicate",
    description: "The following commits are labeled 'duplicate'."
  },
  "enhancement": {
    name: "Enhancement",
    description: "The following commits are labeled 'enhancement'."
  },
  "good first issue": {
    name: "Good First Issue",
    description: "The following commits are labeled 'good first issue'."
  },
  "help wanted": {
    name: "Help Wanted",
    description: "The following commits are labeled 'help wanted'."
  },
  "invalid": {
    name: "Invalid",
    description: "The following commits are labeled 'invalid'."
  },
  "question": {
    name: "Question",
    description: "The following commits are labeled 'question'."
  },
  "wontfix": {
    name: "Won't Fix",
    description: "The following commits are labeled 'wontfix'."
  }
};

const paths = {
  default: {
    name: "Unspecified",
    description: "The following commits are not on specified paths."
  }
};

function run(args) {
  const { revisionRange, excludePattern, outputFile, outputEncoding } = yargs.parse(args);
  // console.log("changelog.run", { revisionRange, excludePattern, outputFile, outputEncoding });

  const repositoryPath = git.getRepositoryPath();
  const relativePath = path.relative(repositoryPath, "");
  const commitPaths = relativePath ? [relativePath] : null;

  return Promise.all([
    github.getCommits({ revisionRange, firstParent: true, paths: commitPaths }),
    github.getIssues(),
    github.getReleases()
  ]).then(([allCommits, allIssues, allReleases]) => {
    const commits = getCommits(allCommits, allIssues, allReleases, excludePattern);
    const releaseConfig = getReleaseConfig(releases, allReleases);
    const labelConfig = getConfig(labels);
    const pathConfig = getConfig(paths);
    const output = getOutput(commits, groupByRelease, groupByLabel, groupByPath, releaseConfig, labelConfig, pathConfig);

    utilities.writeOutput(output, { file: outputFile, encoding: outputEncoding });
  });
}

function getCommits(allCommits, allIssues, allReleases, excludePattern) {
  let commits = allCommits.map((commit) => {
    const issue = getCommitIssue(commit, allIssues);
    const release = getCommitRelease(commit, allReleases);

    return Object.assign({}, commit, { issue, release });
  });

  if (excludePattern) {
    const excludeRegExp = new RegExp(excludePattern);
    commits = commits.filter((commit) => getCommitKeywords(commit).every((keyword) => !excludeRegExp.test(keyword)));
  }

  return commits;
}

function getCommitIssue(commit, allIssues) {
  const message = commit.commit.message;
  const issueMatch = message.match(/^Merge pull request #(\d+)/m) || message.match(/\(#(\d+)\)$/m);
  const issueNumber = (issueMatch) ? Number(issueMatch[1]) : NaN;

  if (issueNumber) {
    return allIssues.find((issue) => issue.number === issueNumber);
  }
}

function getCommitRelease(commit, allReleases) {
  const releases = commit.tags.map((tag) => allReleases.find((release) => release.tag_name === tag)).filter((release) => release);

  if (releases.length > 0) {
    return releases[0];
  }
}

function getCommitKeywords(commit) {
  const keywords = [];

  keywords.push(commit.sha);
  keywords.push(commit.author.login);
  keywords.push(commit.commit.author.name);
  keywords.push(commit.commit.author.email);
  keywords.push(commit.commit.message);

  if (commit.issue) {
    keywords.push(`#${commit.issue.number}`);
    keywords.push(commit.issue.title);
    keywords.push(commit.issue.body);
  }

  if (commit.release) {
    keywords.push(commit.release.tag_name);
    keywords.push(commit.release.name);
    keywords.push(commit.release.body);
  }

  return keywords;
}

function getReleaseConfig(obj, allReleases) {
  const config = getConfig(obj);

  return allReleases.reduce((config, release) => {
    const key = release.tag_name;
    const value = { name: release.name, description: release.body, release };

    return Object.assign(config, { [key]: value });
  }, config);
}

function getConfig(obj) {
  const config = Object.assign({}, obj);

  return Object.keys(config).reduce((config, key) => {
    const value = config[key];

    if (typeof value === "string") {
      Object.assign(config, { [key]: { name: value } });
    }

    return config;
  }, config);
}

function getOutput(commits, groupByRelease, groupByLabel, groupByPath, releaseConfig, labelConfig, pathConfig) {
  let output = "";
  let releaseGroups;
  let labelGroups;
  let pathGroups;

  if (groupByRelease && (releaseGroups = getCommitsByRelease(commits, releaseConfig)) && releaseGroups.length > 0) {
    releaseGroups.filter((releaseGroup) => releaseGroup.commits.length > 0).forEach((releaseGroup) => {
      const releaseCommits = releaseGroup.commits;
      const releaseAuthors = getAuthors(releaseCommits);

      output += formatGroupHeading(releaseGroup, 1);
      output += formatCommitsHeading(releaseCommits);

      if (groupByLabel && (labelGroups = getCommitsByLabel(releaseCommits, labelConfig)) && labelGroups.length > 0) {
        labelGroups.filter((labelGroup) => labelGroup.commits.length > 0).forEach((labelGroup) => {
          const labelCommits = labelGroup.commits;

          output += formatGroupHeading(labelGroup, 3);

          if (groupByPath && (pathGroups = getCommitsByPath(labelCommits, pathConfig)) && pathGroups.length > 0) {
            pathGroups.filter((pathGroup) => pathGroup.commits.length > 0).forEach((pathGroup) => {
              const pathCommits = pathGroup.commits;

              output += formatGroupHeading(pathGroup, 4);
              output += formatCommitsList(pathCommits, 1);
            });
          } else {
            output += formatCommitsList(labelCommits, 1);
          }
        });
      } else if (groupByPath && (pathGroups = getCommitsByPath(releaseCommits, pathConfig)) && pathGroups.length > 0) {
        pathGroups.filter((pathGroup) => pathGroup.commits.length > 0).forEach((pathGroup) => {
          const pathCommits = pathGroup.commits;

          output += formatGroupHeading(pathGroup, 2);
          output += formatCommitsList(pathCommits, 2);
        });
      } else {
        output += formatCommitsList(releaseCommits, 2);
      }

      output += formatAuthorsHeading(releaseAuthors);
      output += formatAuthorsList(releaseAuthors);
    });
  } else if (groupByLabel && (labelGroups = getCommitsByLabel(commits, labelConfig)) && labelGroups.length > 0) {
    labelGroups.filter((labelGroup) => labelGroup.commits.length > 0).forEach((labelGroup) => {
      const labelCommits = labelGroup.commits;
      const labelAuthors = getAuthors(labelCommits);

      output += formatGroupHeading(labelGroup, 1);
      output += formatCommitsHeading(labelCommits);

      if (groupByPath && (pathGroups = getCommitsByPath(labelCommits, pathConfig)) && pathGroups.length > 0) {
        pathGroups.filter((pathGroup) => pathGroup.commits.length > 0).forEach((pathGroup) => {
          const pathCommits = pathGroup.commits;

          output += formatGroupHeading(pathGroup, 3);
          output += formatCommitsList(pathCommits, 1);
        });
      } else {
        output += formatCommitsList(labelCommits, 1);
      }

      output += formatAuthorsHeading(labelAuthors);
      output += formatAuthorsList(labelAuthors);
    });
  } else if (groupByPath && (pathGroups = getCommitsByPath(commits, pathConfig)) && pathGroups.length > 0) {
    pathGroups.filter((pathGroup) => pathGroup.commits.length > 0).forEach((pathGroup) => {
      const pathCommits = pathGroup.commits;
      const pathAuthors = getAuthors(pathCommits);

      output += formatGroupHeading(pathGroup, 1);
      output += formatCommitsHeading(pathCommits);
      output += formatCommitsList(pathCommits, 1);
      output += formatAuthorsHeading(pathAuthors);
      output += formatAuthorsList(pathAuthors);
    });
  } else if (commits.length > 0) {
    const authors = getAuthors(commits);

    output += formatCommitsHeading(commits);
    output += formatCommitsList(commits, 1);
    output += formatAuthorsHeading(authors);
    output += formatAuthorsList(authors);
  }

  output = output.trim();

  if (output) {
    output += EOL;
  }

  return output;
}

function getCommitsByRelease(commits, releaseConfig) {
  const keys = Object.keys(releaseConfig);
  const keysExceptDefault = keys.filter((key) => key !== "default");

  return keys.reduce((groups, key) => {
    const group = { ...releaseConfig[key] };

    group.commits = commits.filter((commit) => {
      if (key !== "default") {
        return commit.release && commit.release.tag_name === key;
      } else {
        return !commit.release || !keysExceptDefault.includes(commit.release.tag_name);
      }
    });

    groups.push(group);
    return groups;
  }, []);
}

function getCommitsByLabel(commits, labelConfig) {
  const keys = Object.keys(labelConfig);
  const keysExceptDefault = keys.filter((key) => key !== "default");

  return keys.reduce((groups, key) => {
    const group = { ...labelConfig[key] };

    group.commits = commits.filter((commit) => {
      if (key !== "default") {
        return commit.issue && commit.issue.labels.some((label) => label.name === key);
      } else {
        return !commit.issue || commit.issue.labels.every((label) => !keysExceptDefault.includes(label.name));
      }
    });

    groups.push(group);
    return groups;
  }, []);
}

function getCommitsByPath(commits, pathConfig) {
  const keys = Object.keys(pathConfig);
  const keysExceptDefault = keys.filter((key) => key !== "default");
  const repositoryPath = git.getRepositoryPath();

  return keys.reduce((groups, key) => {
    const group = { ...pathConfig[key] };

    group.commits = commits.filter((commit) => {
      if (key !== "default") {
        return commit.files.some((file) => path.resolve(repositoryPath, file).startsWith(path.resolve(repositoryPath, key)));
      } else {
        return commit.files.length === 0 || commit.files.some((file) => !keysExceptDefault.some((key) => path.resolve(repositoryPath, file).startsWith(path.resolve(repositoryPath, key))));
      }
    });

    groups.push(group);
    return groups;
  }, []);
}

function getAuthors(commits) {
  const authors = commits.reduce((obj, commit) => {
    if (!commit.author) {
      commit.author = {};
    }

    const key = commit.author.id;

    if (!obj[key]) {
      const { login, html_url } = commit.author;
      const { name, email } = commit.commit.author;

      let sortText;
      let displayText;

      if (login) {
        sortText = `${name} <${email}> (@${login})`;
        displayText = `${name} \\<${email}> ([@${login}](${html_url}))`;
      } else {
        sortText = `${name} <${email}>`;
        displayText = `${name} \\<${email}>`;
      }

      obj[key] = { sortText, displayText };
    }

    return obj;
  }, {});

  return utilities.values(authors).sort((a, b) => a.sortText.localeCompare(b.sortText)).map((author) => author.displayText);
}

function formatGroupHeading(group, level) {
  let prefix1;
  let prefix2;

  switch (level) {
    case 1:
      prefix1 = "## ";
      prefix2 = "> ";
      break;

    case 2:
      prefix1 = "### ";
      prefix2 = "> ";
      break;

    case 3:
      prefix1 = "#### ";
      prefix2 = "> ";
      break;

    case 4:
      prefix1 = "##### ";
      prefix2 = "> ";
      break;
  }

  if (group.description) {
    return prefix1 + group.name + EOL + prefix2 + group.description + EOL.repeat(2);
  } else {
    return prefix1 + group.name + EOL.repeat(2);
  }
}

function formatCommitsHeading(commits) {
  return `### Commits (${commits.length})` + EOL.repeat(2);
}

function formatCommitsList(commits, level) {
  let prefix1;
  let prefix2;

  switch (level) {
    case 1:
      prefix1 = "* ";
      prefix2 = "  ";
      break;

    case 2:
      prefix1 = " * ";
      prefix2 = "   ";
      break;

    case 3:
      prefix1 = "   * ";
      prefix2 = "     ";
      break;
  }

  let output = "";

  commits.forEach((commit, index, array) => {
    const head = (commit.issue) ? `[#${commit.issue.number}](${commit.issue.html_url}) - ${commit.issue.title} (${commit.commit.author.email})` : `${commit.commit.message} (${commit.commit.author.email})`;
    const body = (commit.issue) ? commit.issue.body : "";

    if (body) {
      output += prefix1 + utilities.indent(head, { space: prefix1.length }) + EOL.repeat(2) + prefix2 + utilities.indent(body, { space: prefix2.length }) + EOL.repeat(2);
    } else if (index === array.length - 1) {
      output += prefix1 + utilities.indent(head, { space: prefix1.length }) + EOL.repeat(2);
    } else {
      output += prefix1 + utilities.indent(head, { space: prefix1.length }) + EOL;
    }
  });

  return output;
}

function formatAuthorsHeading(authors) {
  return `### Authors (${authors.length})` + EOL.repeat(2);
}

function formatAuthorsList(authors) {
  let output = "";

  authors.forEach((author, index, array) => {
    if (index === array.length - 1) {
      output += `* ${author}` + EOL.repeat(2);
    } else {
      output += `* ${author}` + EOL;
    }
  });

  return output;
}

export {
  run
};
