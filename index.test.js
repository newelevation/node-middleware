const { inspect } = require("util");
const { makeEndpoint } = require("./make-endpoint");
const fetch = require("./fetch");
const m = require("./middleware");

test("linear", async () => {
  const f = m([
    (n) => async (i) => await n(i, "a"),
    (n) => async (i, o) => await n(i, o + "b"),
    (n) => async (i, o) => await n(i, o + "c"),
  ]);

  const r = f();

  const o = await r("z");

  expect(o).toEqual("abc");
});

test("nested", async () => {
  const f = m([
    (n) => async (i) => await n(i, "a"),
    (n) => async (i, o) =>
      await n(
        i,
        await m([
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
  const f = m([
    (n) => async (i, o) =>
      await n(
        {
          ...i,
          headers: {
            "content-type": "text/plain",
          },
        },
        o,
      ),
    (n) => async (i, o) => {
      try {
        console.time("duration");

        return await n(i, o);
      } finally {
        console.timeEnd("duration");
      }
    },
    fetch,
    (n) => async (i, o) => {
      console.log(
        [`${i.method ?? "GET"} ${i.url}`, `${inspect(o, false, 3, true)}`].join(
          "\n",
        ),
      );

      return await n(i, o);
    },
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
    const pipeline = m(middlewares);

    return {
      pipeline,
    };
  };

  const makeTodoClient = ({ protocol, domain, subdomains, basePath }) => {
    const endpoint = makeEndpoint({ protocol, domain, subdomains, basePath });

    const commonClient = makeCommonClient({
      middlewares: [
        (n) => async (i, o) => {
          const { url } = i;

          console.log(url);

          return await n(i, o);
        },
        fetch,
      ],
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
