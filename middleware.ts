export type MiddlewareHandler<Input = any> = (
  input: Input,
  output?: any
) => Promise<any>;

export type Next = (input: any, output: any) => Promise<any>;

export const getOutput: Next = async (_, output) => output;

export type Middleware<Input = any> = (next: Next) => MiddlewareHandler<Input>;

export type Pipeline<Input = any> = () => MiddlewareHandler<Input>;

export const makePipeline = <Input>(
  use: Middleware[] = []
): Pipeline<Input> => {
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
