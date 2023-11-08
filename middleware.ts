export type PipelineOptions<Input = any> = {
  middlewares: Middleware<Input>[];
};

export type MiddlewareHandler<Input = any> = (
  input: Input,
  output?: any,
) => Promise<any>;

export type Next = (input: any, output: any) => Promise<any>;

export type Middleware<Input = any> = (next: Next) => MiddlewareHandler<Input>;

export const makePipeline = (use: Middleware[] = []) => {
  const factory = () => {
    return async (input: any, output?: any) => {
      const list = use.slice(0);

      const next: Next = async (input, output) => {
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
