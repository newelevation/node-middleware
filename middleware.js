const tip = Symbol.for("tip");

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

        if (tip in current) {
          let request = current();

          next(input, await request(input, output));
        } else {
          await current(next)(input, output);
        }
      }

      return output;
    };
  };

  factory[tip] = true;

  return factory;
};

module.exports = middleware;
