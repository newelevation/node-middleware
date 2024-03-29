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

test("places a middleware prior to", async () => {
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

test("adds a middleware subsequent to", async () => {
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

test("produces an error if the modification reference cannot be found", async () => {
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

test("modifications do not affect the original input list", async () => {
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

test("normal pipelines do not affect the original input list", async () => {
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

test("modifications are processed in the same sequence as they are provided", async () => {
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

test("modifications are processed in the same sequence as they are provided ( extended case )", async () => {
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

test("substituting middlewares", async () => {
  const pipeline = makePipeline([
    (next) => async (input) => await next(input, input),
    [
      "foo",
      (next) => async (input, output) => await next(input, output + "foo"),
    ],
    [
      "bar",
      (next) => async (input, output) => await next(input, output + " bar"),
    ],
  ]);

  expect(await pipeline()("")).toEqual("foo bar");

  expect(
    await pipeline([
      [
        "replace",
        "foo",
        (next) => async (input, output) => await next(input, output + "qux"),
      ],
      [
        "replace",
        "bar",
        (next) => async (input, output) => await next(input, output + " waldo"),
      ],
    ])(""),
  ).toEqual("qux waldo");
});

test("bypassing middleware processing", async () => {
  const pipeline = makePipeline([
    (next) => async (input) => await next(input, input),
    ["1st", (next) => async (input, output) => await next(input, output + "1")],
    [
      "2nd",
      (next) => async (input, output) => await next(input, output + " 2"),
    ],
    [
      "3rd",
      (next) => async (input, output) => await next(input, output + " 3"),
    ],
  ]);

  expect(await pipeline()("")).toEqual("1 2 3");

  expect(await pipeline([["skip", "2nd"]])("")).toEqual("1 3");
});
