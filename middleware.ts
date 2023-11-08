type N = (i: any, o: any) => Promise<any>;

type M = (n: N) => (i: any, o: any) => Promise<any>;

export const makePipeline = (use: M[] = []) => {
  const factory = () => {
    return async (input: any, output?: any) => {
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
