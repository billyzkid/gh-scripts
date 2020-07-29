function getCommits({ revisionRange, firstParent, paths } = {}) {
  return { "commits": true };
}

function getIssues({ state = "all" } = {}) {
  return { "issues": true };
}

function getReleases() {
  return { "releases": true };
}

export {
  getCommits,
  getIssues,
  getReleases
};
