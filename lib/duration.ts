import { Middleware } from "../middleware";

export const duration: Middleware = (n) => async (i, o) => {
  try {
    console.time("duration");

    return await n(i, o);
  } finally {
    console.timeEnd("duration");
  }
};
