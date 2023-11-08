import { trim } from "lodash";

export type MakeEndpointOptions = {
  protocol?: string;
  subdomains?: string[];
  domain: string;
  basePath: string;
};

export const makeEndpoint = ({
  protocol = "https:",
  subdomains = [],
  domain,
  basePath,
}: MakeEndpointOptions) => {
  const getUrl = function (path: string | number | boolean = "/", search = {}) {
    const url = new URL(
      ["", trim(basePath, "/"), trim(String(path), "/")].join("/"),
      [protocol, [...subdomains, domain].join(".")].join("//"),
    );

    Object.entries(search).forEach(([k, v]) => {
      url.searchParams.set(k, String(v));
    });

    return url;
  };

  return {
    getUrl,
  };
};
