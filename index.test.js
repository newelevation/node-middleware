
const mid = ({ use = [] }) => {
  return () => {
    return async (input) => {
      const list = use.slice(0)

      let output

      let keep = true

      let current = list.shift()

      const next = (input, newOutput) => {
        output = newOutput

        current = list.shift()

        keep = !!current
      }

      while (keep) {
        keep = false

        await current(next)(input, output)
      }

      return output
    }
  }
}

test("", async () => {
  const client = mid({
    use: [
      n => async (i, o) => { n(i, 'a') },
      n => async (i, o) => { n(i, o + 'b') },
      n => async (i, o) => { n(i, o + 'c') }
    ]
  })

  const request = client()

  const output = await request('z')

  expect(output).toEqual('abc')
})