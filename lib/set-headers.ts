import { UnamedMiddleware } from "../middleware";

type SetHeaders = (headers: Record<string, string>) => UnamedMiddleware;

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
