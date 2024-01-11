import { isArray, isFunction } from "lodash";

export type MiddlewareHandler<Input = any, Output = any> = (
  input: Input,
  output?: Output,
) => Promise<Output>;

export type Next = (input: any, output: any) => Promise<any>;

export type Middleware<Input = any> = (next: Next) => MiddlewareHandler<Input>;

export type NamedMiddleware<Input = any> = [string, Middleware<Input>];

export type PipelineMiddleware<Input = any> =
  | Middleware<Input>
  | NamedMiddleware<Input>;

export type InsertionPlacement = "before" | "after";

export type Insertion = [InsertionPlacement, name: string, Middleware];

export type Pipeline<Input = any> = <Output>(
  insertions?: Insertion[],
) => MiddlewareHandler<Input, Output>;

export const makePipeline = <Input>(
  use: PipelineMiddleware[] = [],
): Pipeline<Input> => {
  const pipeline: Pipeline<Input> = <Output>(insertions = []) => {
    return async (input: Input, output?: Output) => {
      const list = makeInsertions(use, insertions);

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

function makeInsertions(
  use: ReadonlyArray<PipelineMiddleware>,
  insertions: any[],
): PipelineMiddleware[] {
  const list = use.slice(0);

  for (const [placement, name, item] of insertions) {
    const index = list.findIndex((m) => isArray(m) && name === m[0]);

    if (index < 0) {
      throw new Error(
        `could not find middleware named: ${JSON.stringify(name)}`,
      );
    }

    list.splice(placement === "before" ? index : index + 1, 0, item);
  }

  return list;
}
