import { inspect } from "util";
import { UnamedMiddleware } from "../middleware";

export const logFetchRequestInfo: UnamedMiddleware = (n) => async (i, o) => {
  console.log(
    [`${i.method ?? "GET"} ${i.url}`, `${inspect(o, false, 3, true)}`].join(
      "\n",
    ),
  );

  return await n(i, o);
};
