import { Middleware } from "../middleware";

type SetHeaders = (headers: Record<string, string>) => Middleware;

export const setHeaders: SetHeaders = (headers) => (n) => async (i, o) =>
  await n(
    {
      ...i,
      headers: {
        ...i.headers,
        ...headers,
      },
    },
    o,
  );
