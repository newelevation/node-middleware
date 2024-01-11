import { MakeEndpointOptions, makeEndpoint } from "./helpers/endpoint";
import { duration } from "./lib/duration";
import { fetch } from "./lib/fetch";
import { logFetchRequestInfo } from "./lib/log-fetch-request-info";
import { setHeaders } from "./lib/set-headers";
import { Middleware, PipelineMiddleware, makePipeline } from "./middleware";

test("linear", async () => {
  const pipeline = makePipeline([
    (next) => async (input) => await next(input, input + " b"),
    (next) => async (input, output) => await next(input, output + "a"),
    (next) => async (input, output) => await next(input, output + "r"),
  ]);

  const request = pipeline();

  const reply = await request("foo");

  expect(reply).toEqual("foo bar");
});

test("nested", async () => {
  const pipeline = makePipeline([
    (next) => async (input) => await next(input, "a"),
    (next) => async (input, output) =>
      await next(
        input,
        await makePipeline([
          (next) => async (input, output) => await next(input, output + "b"),
          (next) => async (input, output) => await next(input, output + "c"),
        ])()(input, output),
      ),
  ]);

  const request = pipeline();

  const reply = await request("z");

  expect(reply).toEqual("abc");
});

test("http", async () => {
  const pipeline = makePipeline([
    setHeaders({ "content-type": "text/plain" }),
    duration,
    fetch,
    logFetchRequestInfo,
  ]);

  const request = pipeline();

  const reply = await request({
    url: "https://jsonplaceholder.typicode.com/todos/1",
  });

  expect(reply).toEqual({
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

  const makeTodoClient = ({
    protocol,
    domain,
    subdomains,
    basePath,
  }: MakeEndpointOptions) => {
    const endpoint = makeEndpoint({ protocol, domain, subdomains, basePath });

    const commonClient = makeCommonClient({
      middlewares: [logFetchRequestInfo, fetch],
    });

    const getById = async function (id) {
      const request = this.pipeline();

      return request({ url: endpoint.getUrl(id) });
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

test("named middlewares", async () => {
  const pipeline = makePipeline([
    (next) => async (input) => await next(input, input + " b"),
    [
      "adds a",
      (next) => async (input, output) => await next(input, output + "a"),
    ],
    [
      "adds r",
      (next) => async (input, output) => await next(input, output + "r"),
    ],
  ]);

  const request = pipeline();

  const reply = await request("foo");

  expect(reply).toEqual("foo bar");
});

test("inserts a middleware before", async () => {
  const pipeline = makePipeline([
    (next) => async (input) => await next(input, input + " b"),
    [
      "adds r",
      (next) => async (input, output) => await next(input, output + "r"),
    ],
  ]);

  const request = pipeline([
    [
      "before",
      "adds r",
      (next) => async (input, output) => await next(input, output + "a"),
    ],
  ]);

  const reply = await request("foo");

  expect(reply).toEqual("foo bar");
});

test("inserts a middleware after", async () => {
  const pipeline = makePipeline([
    (next) => async (input) => await next(input, input + " b"),
    [
      "adds a",
      (next) => async (input, output) => await next(input, output + "a"),
    ],
  ]);

  const request = pipeline([
    [
      "after",
      "adds a",
      (next) => async (input, output) => await next(input, output + "r"),
    ],
  ]);

  const reply = await request("foo");

  expect(reply).toEqual("foo bar");
});

test("throws a error if can not find the insertion reference", async () => {
  const pipeline = makePipeline([
    (next) => async (input) => await next(input, input + " b"),
    [
      "adds r",
      (next) => async (input, output) => await next(input, output + "r"),
    ],
  ]);

  const request = pipeline([
    [
      "before",
      "foo bar",
      (next) => async (input, output) => await next(input, output + "a"),
    ],
  ]);

  await expect(async () => {
    await request("foo");
  }).rejects.toThrow('could not find middleware named: "foo bar"');
});

test("insertion does not affect the input list", async () => {
  const list: PipelineMiddleware[] = [
    (next) => async (input) => await next(input, input + " b"),
    [
      "adds r",
      (next) => async (input, output) => await next(input, output + "r"),
    ],
  ];

  const pipeline = makePipeline(list);

  expect(list).toHaveLength(2);

  const request = pipeline([
    [
      "before",
      "adds r",
      (next) => async (input, output) => await next(input, output + "a"),
    ],
  ]);

  const reply = await request("foo");

  expect(reply).toEqual("foo bar");

  expect(list).toHaveLength(2);
});

test("normal pipeline execution does not affect the input list", async () => {
  const list: Middleware[] = [
    (next) => async (input) => await next(input, input + " b"),
    (next) => async (input, output) => await next(input, output + "a"),
    (next) => async (input, output) => await next(input, output + "r"),
  ];

  const pipeline = makePipeline(list);

  expect(list).toHaveLength(3);

  const request = pipeline();

  const reply = await request("foo");

  expect(reply).toEqual("foo bar");

  expect(list).toHaveLength(3);
});

test("insertions appear in the same order they are passed", async () => {
  const list: PipelineMiddleware[] = [
    ["first", (next) => async (input) => await next(input, input + " b")],
  ];

  const pipeline = makePipeline(list);

  const request = pipeline([
    [
      "after",
      "first",
      (next) => async (input, output) => await next(input, output + "a"),
    ],
    [
      "after",
      "first",
      (next) => async (input, output) => await next(input, output + "r"),
    ],
  ]);

  const reply = await request("foo");

  expect(reply).toEqual("foo bar");
});

test("insertions appear in the same order they are passed", async () => {
  const list: PipelineMiddleware[] = [
    ["1st", (next) => async (input) => await next(input, input + "1")],
    ["2nd", (next) => async (input, output) => await next(input, output + "2")],
    ["3rd", (next) => async (input, output) => await next(input, output + "3")],
    ["4th", (next) => async (input, output) => await next(input, output + "4")],
  ];

  const pipeline = makePipeline(list);

  const request = pipeline([
    [
      "after",
      "1st",
      (next) => async (input, output) => await next(input, output + "a"),
    ],
    [
      "after",
      "4th",
      (next) => async (input, output) => await next(input, output + "d"),
    ],
    [
      "before",
      "3rd",
      (next) => async (input, output) => await next(input, output + "c"),
    ],
    [
      "after",
      "1st",
      (next) => async (input, output) => await next(input, output + "b"),
    ],
  ]);

  const reply = await request("");

  expect(reply).toEqual("1ab2c34d");
});
