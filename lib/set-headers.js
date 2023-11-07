const setHeaders = (headers) => (n) => async (i, o) =>
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

module.exports.setHeaders = setHeaders;