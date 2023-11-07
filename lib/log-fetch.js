const { inspect } = require("util");

const logFetch = (n) => async (i, o) => {
  console.log(
    [`${i.method ?? "GET"} ${i.url}`, `${inspect(o, false, 3, true)}`].join(
      "\n",
    ),
  );

  return await n(i, o);
};

module.exports.logFetch = logFetch;
