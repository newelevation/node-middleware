const trim = require("lodash.trim");

const makeEndpoint = ({
  protocol = "https:",
  subdomains,
  domain,
  basePath,
}) => {
  const getUrl = function (path = "/", search = {}) {
    const url = new URL(
      ["", trim(basePath, "/"), trim(path, "/")].join("/"),
      [protocol, [...subdomains, domain].join(".")].join("//"),
    );

    Object.entries(search).forEach(([k, v]) => {
      url.searchParams.set(k, v);
    });

    return url;
  };

  return {
    getUrl,
  };
};

module.exports.makeEndpoint = makeEndpoint;
