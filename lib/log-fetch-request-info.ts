import { inspect } from "util";
import { Middleware } from "../middleware";

export const logFetchRequestInfo: Middleware = (n) => async (i, o) => {
  console.log(
    [`${i.method ?? "GET"} ${i.url}`, `${inspect(o, false, 3, true)}`].join(
      "\n",
    ),
  );

  return await n(i, o);
};
