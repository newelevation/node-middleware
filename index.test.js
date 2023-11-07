const middleware = require('./middleware')

test("linear", async () => {
  const client = middleware({
    use: [
      n => async (i) => { n(i, 'a') },
      n => async (i, o) => { n(i, o + 'b') },
      n => async (i, o) => { n(i, o + 'c') }
    ]
  })

  const request = client()

  const output = await request('z')

  expect(output).toEqual('abc')
})

test("nested", async () => {
  const client = middleware({
    use: [
      n => async (i) => { n(i, 'a') },
      middleware({
        use: [
          n => async (i, o) => { n(i, o + 'b') },
          n => async (i, o) => { n(i, o + 'c') }
        ]
      })
    ]
  })

  const request = client()

  const output = await request('z')

  expect(output).toEqual('abc')
})
