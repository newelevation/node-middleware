import { MakeEndpointOptions, makeEndpoint } from "./helpers/endpoint";
import { duration } from "./lib/duration";
import { fetch } from "./lib/fetch";
import { logFetchRequestInfo } from "./lib/log-fetch-request-info";
import { setHeaders } from "./lib/set-headers";
import { makePipeline } from "./middleware";

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
