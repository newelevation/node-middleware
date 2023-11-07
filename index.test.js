const { duration } = require("./lib/duration");
const { fetch } = require("./lib/fetch");
const { logFetchRequestInfo } = require("./lib/log-fetch-request-info");
const { makeEndpoint } = require("./make-endpoint");
const { makePipeline } = require("./middleware");
const { setHeaders } = require("./lib/set-headers");

test("linear", async () => {
  const f = makePipeline([
    (n) => async (i) => await n(i, "a"),
    (n) => async (i, o) => await n(i, o + "b"),
    (n) => async (i, o) => await n(i, o + "c"),
  ]);

  const r = f();

  const o = await r("z");

  expect(o).toEqual("abc");
});

test("nested", async () => {
  const f = makePipeline([
    (n) => async (i) => await n(i, "a"),
    (n) => async (i, o) =>
      await n(
        i,
        await makePipeline([
          (n) => async (i, o) => await n(i, o + "b"),
          (n) => async (i, o) => await n(i, o + "c"),
        ])()(i, o),
      ),
  ]);

  const r = f();

  const o = await r("z");

  expect(o).toEqual("abc");
});

test("http", async () => {
  const f = makePipeline([
    setHeaders({ "content-type": "text/plain" }),
    duration,
    fetch,
    logFetchRequestInfo,
  ]);

  const r = f();

  const o = await r({ url: "https://jsonplaceholder.typicode.com/todos/1" });

  expect(o).toEqual({
    completed: false,
    id: 1,
    title: "delectus aut autem",
    userId: 1,
  });
});

test("mixed use with objects", async () => {
  const makeCommonClient = ({ middlewares }) => {
    const pipeline = makePipeline(middlewares);

    return {
      pipeline,
    };
  };

  const makeTodoClient = ({ protocol, domain, subdomains, basePath }) => {
    const endpoint = makeEndpoint({ protocol, domain, subdomains, basePath });

    const commonClient = makeCommonClient({
      middlewares: [logFetchRequestInfo, fetch],
    });

    const getById = async function (id) {
      const request = this.pipeline();

      return request({
        url: endpoint.getUrl(id),
      });
    };

    return {
      ...commonClient,
      getById,
    };
  };

  const client = makeTodoClient({
    subdomains: ["jsonplaceholder"],
    domain: "typicode.com",
    basePath: "/todos",
  });

  const todo = await client.getById(1);

  expect(todo).toEqual({
    completed: false,
    id: 1,
    title: "delectus aut autem",
    userId: 1,
  });
});
