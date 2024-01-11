import { UnamedMiddleware } from "../middleware";

export const duration: UnamedMiddleware = (n) => async (i, o) => {
  try {
    console.time("duration");

    return await n(i, o);
  } finally {
    console.timeEnd("duration");
  }
};
