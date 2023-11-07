const middleware = require('./middleware')

test("linear", async () => {
  const factory = middleware([
    next => async (input) => { next(input, 'a') },
    next => async (input, output) => { next(input, output + 'b') },
    next => async (input, output) => { next(input, output + 'c') }
  ])

  const request = factory()

  const output = await request('z')

  expect(output).toEqual('abc')
})

test("nested", async () => {
  const factory = middleware([
    next => async (input) => { next(input, 'a') },
    next => async (input, output) => {
      const factory = middleware([
        next => async (input, output) => { next(input, output + 'b') },
        next => async (input, output) => { next(input, output + 'c') }
      ])

      const request = factory()

      next(input, await request(input, output))
    }
  ])

  const request = factory()

  const output = await request('z')

  expect(output).toEqual('abc')
})
