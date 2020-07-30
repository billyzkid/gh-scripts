import * as git from "./git.mjs";
import * as utilities from "./utilities.mjs";

const options = {
  token: "",
  endpoint: "https://api.github.com",
  repository: git.getRepositoryName(),
  pageSize: 100
};

function config(obj) {
  Object.assign(options, obj);
}

function getCommits({ revisionRange, firstParent, paths } = {}) {
  const url = `${options.endpoint}/repos/${options.repository}/commits?per_page=${options.pageSize}`;

  return sendRequest(url, { pages: [] }).then((commits) => {
    const result = [];
    const log1 = git.getLog({ revisionRange, firstParent, format: "%H", paths });
    const log2 = git.getLog({ revisionRange, firstParent, nameOnly: true, format: ";%H;%D;" });
    const logRegExp = /;([^;]*);([^;]*);([^;]*)/g;
    const tagRegExp = /tag: ([^,]+)/g;

    let logMatch;
    let tagMatch;
    let currentTags;

    while ((logMatch = logRegExp.exec(log2))) {
      const sha = logMatch[1];
      const refs = logMatch[2];
      const files = logMatch[3].split("\n").filter((line) => line);
      const tags = [];

      while ((tagMatch = tagRegExp.exec(refs))) {
        tags.push(tagMatch[1]);
      }

      if (currentTags) {
        tags.push(...currentTags);
      }

      currentTags = tags;

      const commitRegExp = new RegExp(`^${sha}$`, "m");
      const commit = commitRegExp.test(log1) && commits.find((commit) => commit.sha === sha);

      if (commit) {
        Object.assign(commit, { tags, files });
        result.push(commit);
      }
    }

    return result;
  }, (error) => {
    if (error.message.indexOf("409") !== -1) {
      return []; // repository is empty
    } else {
      throw error;
    }
  });
}

function getIssues({ state = "all" } = {}) {
  let url = `${options.endpoint}/repos/${options.repository}/issues?per_page=${options.pageSize}`;

  if (state) {
    url += `&state=${state}`;
  }

  return sendRequest(url, { pages: [] });
}

function getReleases() {
  const url = `${options.endpoint}/repos/${options.repository}/releases?per_page=${options.pageSize}`;

  return sendRequest(url, { pages: [] });
}

function sendRequest(url, { method = "GET", content, pages } = {}) {
  let body;

  if (content) {
    body = JSON.stringify(content);
  }

  const headers = {
    "User-Agent": options.repository,
    "Accept": "application/vnd.github.v3+json"
  };

  if (options.token) {
    headers["Authorization"] = `token ${options.token}`;
  }

  if (method === "POST" || method === "PATCH" || method === "PUT" || method === "DELETE") {
    headers["Content-Type"] = "application/json";
  }

  return utilities.fetch(url, { method, headers, body }).then((response) => {
    if (!response.ok) {
      throw new Error(`Request failed with response status ${response.status} (${response.statusText}): ${url}`);
    }

    if (!pages) {
      return response.json();
    } else {
      return response.json().then((data) => {
        pages.push(...data);

        const linkHeader = response.headers && response.headers.get("link");

        if (linkHeader) {
          let nextUrl;

          linkHeader.split(", ").find((link) => {
            nextUrl = utilities.match(link, /^<(.*)>; rel="next"$/, 1);
            return (nextUrl) ? true : false;
          });

          if (nextUrl) {
            return sendRequest(nextUrl, { method, content, pages });
          }
        }

        return pages;
      });
    }
  });
}

export {
  config,
  getCommits,
  getIssues,
  getReleases
};
