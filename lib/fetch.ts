import nodeFetch from "node-fetch-cjs";
import { Middleware } from "../middleware";

export const fetch: Middleware = (n) => async (i, o) => {
  const { url, ...info } = i;

  const r = await nodeFetch(url, info);

  const ct = r.headers.get("content-type")?.toLowerCase();

  if (ct?.startsWith("text/")) {
    return n(i, await r.text());
  }

  if (ct?.includes("json")) {
    return n(i, await r.json());
  }

  return n(i, await r.arrayBuffer());
};
