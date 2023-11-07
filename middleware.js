const makePipeline = (use = []) => {
  const factory = () => {
    return async (input, output) => {
      const list = use.slice(0);

      const next = async (input, output) => {
        const current = list.shift();

        if (current) {
          return await current(next)(input, output);
        }

        return output;
      };

      const head = list.shift();

      if (head) {
        return await head(next)(input, output);
      }

      return output;
    };
  };

  return factory;
};

module.exports.makePipeline = makePipeline;
