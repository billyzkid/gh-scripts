// import * as git from "./git";
// import * as utilities from "./utilities";

function getCommits({ revisionRange, firstParent, paths } = {}) {
  return { "commits": true };
}

function getIssues({ state = "all" } = {}) {
  return { "issues": true };
}

function getReleases() {
  return { "releases": true };
}

// function sendRequest(url, { method = "GET", content, pages } = {}) {
//   const options = {
//     token: null,
//     endpoint: "https://api.github.com",
//     repository: git.getRepositoryName(),
//     pageSize: 100
//   };

//   let body;

//   if (content) {
//     body = JSON.stringify(content);
//   }

//   const headers = {
//     "User-Agent": options.repository,
//     "Accept": "application/vnd.github.v3+json"
//   };

//   if (options.token) {
//     headers["Authorization"] = `token ${options.token}`;
//   }

//   if (method === "POST" || method === "PATCH" || method === "PUT" || method === "DELETE") {
//     headers["Content-Type"] = "application/json";
//   }

//   return utilities.fetch(url, { method, headers, body }).then((response) => {
//     if (!response.ok) {
//       throw new Error(`Request failed with response status ${response.status} (${response.statusText}): ${url}`);
//     }

//     if (!pages) {
//       return response.json();
//     } else {
//       return response.json().then((data) => {
//         pages.push(...data);

//         const linkHeader = response.headers && response.headers.get("link");

//         if (linkHeader) {
//           let nextUrl;

//           linkHeader.split(", ").find((link) => {
//             nextUrl = utilities.match(link, /^<(.*)>; rel="next"$/, 1);
//             return (nextUrl) ? true : false;
//           });

//           if (nextUrl) {
//             return sendRequest(nextUrl, { method, content, pages });
//           }
//         }

//         return pages;
//       });
//     }
//   });
// }

export {
  getCommits,
  getIssues,
  getReleases
};
