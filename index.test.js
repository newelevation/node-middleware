const { inspect } = require("util");
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

test("mix with objects", async () => {
  const makeCommonClient = ({ middlewares }) => {
    const pipeline = m(middlewares);

    return {
      pipeline,
    };
  };

  const makeTodoClient = () => {
    const commonClient = makeCommonClient({
      middlewares: [fetch],
    });

    const getById = async function (id) {
      const request = this.pipeline();

      return request({
        url: `https://jsonplaceholder.typicode.com/todos/${id}`,
      });
    };

    return {
      ...commonClient,
      getById,
    };
  };

  const client = makeTodoClient();

  const todo = await client.getById(1);

  expect(todo).toEqual({
    completed: false,
    id: 1,
    title: "delectus aut autem",
    userId: 1,
  });
});
