const m = require('./middleware')

test("linear", async () => {
  const f = m([
    n => async (i) => n(i, 'a'),
    n => async (i, o) => n(i, o + 'b'),
    n => async (i, o) => n(i, o + 'c')
  ])

  const r = f()

  const o = await r('z')

  expect(o).toEqual('abc')
})

test("nested", async () => {
  const f = m([
    n => async (i) => n(i, 'a'),
    n => async (i, o) => {
      const f = m([
        n => async (i, o) => n(i, o + 'b'),
        n => async (i, o) => n(i, o + 'c')
      ])

      const r = f()

      n(i, await r(i, o))
    }
  ])

  const r = f()

  const o = await r('z')

  expect(o).toEqual('abc')
})

test("nested 2", async () => {
  const f = m([
    n => async (i) => n(i, 'a'),
    n => async (i, o) => n(
      i,
      await m([
        n => async (i, o) => n(i, o + 'b'),
        n => async (i, o) => n(i, o + 'c')
      ])()(i, o)
    )
  ])

  const r = f()

  const o = await r('z')

  expect(o).toEqual('abc')
})
