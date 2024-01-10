import { isFunction } from "lodash";

export type MiddlewareHandler<Input = any, Output = any> = (
  input: Input,
  output?: Output,
) => Promise<Output>;

export type Next = (input: any, output: any) => Promise<any>;

export type Middleware<Input = any> = (next: Next) => MiddlewareHandler<Input>;

export type NamedMiddleware = [string, Middleware];

export type Pipeline<Input = any> = <Output>() => MiddlewareHandler<
  Input,
  Output
>;

export const makePipeline = <Input>(
  use: (Middleware | NamedMiddleware)[] = [],
): Pipeline<Input> => {
  const pipeline: Pipeline<Input> = <Output>() => {
    return async (input: Input, output?: Output) => {
      const list = use.slice(0);

      const next: Next = async (input, output) => {
        const current = list.shift();

        if (current) {
          return await invoke(current, next, input, output);
        }

        return output;
      };

      const head = list.shift();

      if (head) {
        return await invoke(head, next, input, output);
      }

      return output;

      async function invoke(node, next, input, output) {
        if (isFunction(node)) {
          return await node(next)(input, output);
        } else {
          return await node[1](next)(input, output);
        }
      }
    };
  };

  return pipeline;
};

export const passOutputAlong: Next = async (_, output) => output;
