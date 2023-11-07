const { makeEndpoint } = require("./make-endpoint");

test("happy path", () => {
  const endpoint = makeEndpoint({
    subdomains: ["jsonplaceholder"],
    domain: "typicode.com",
    basePath: "/todos",
  });

  expect(endpoint.getUrl(1, { status: "live" }).toString()).toEqual(
    "https://jsonplaceholder.typicode.com/todos/1?status=live",
  );
});
