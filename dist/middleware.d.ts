export type MiddlewareHandler<Input = any, Output = any> = (
  input: Input,
  output?: Output,
) => Promise<Output>;
export type Next = (input: any, output: any) => Promise<any>;
export type Middleware<Input = any> = (next: Next) => MiddlewareHandler<Input>;
export type Pipeline<Input = any> = <Output>() => MiddlewareHandler<
  Input,
  Output
>;
export declare const makePipeline: <Input>(
  use?: Middleware[],
) => Pipeline<Input>;
export declare const passOutputAlong: Next;
