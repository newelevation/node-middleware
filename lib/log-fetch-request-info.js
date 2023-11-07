const { inspect } = require("util");

const logFetchRequestInfo = (n) => async (i, o) => {
  console.log(
    [`${i.method ?? "GET"} ${i.url}`, `${inspect(o, false, 3, true)}`].join(
      "\n",
    ),
  );

  return await n(i, o);
};

module.exports.logFetchRequestInfo = logFetchRequestInfo;
