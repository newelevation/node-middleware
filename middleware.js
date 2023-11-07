const middleware = ({ use = [] }) => {
  return () => {
    return async (input) => {
      const list = use.slice(0);

      let output;

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
};

module.exports = middleware
