
const middleware = (use = []) => {
  const factory = () => {
    return async (input, outputSeed) => {
      const list = use.slice(0);

      let output = outputSeed;

      let keep = true;

      let current = list.shift();

      const next = (input, newOutput) => {
        output = newOutput;

        current = list.shift();

        keep = !!current;
      };

      while (keep) {
        keep = false;

        await current(next)(input, output);
      }

      return output;
    };
  };

  return factory;
};

module.exports = middleware;
