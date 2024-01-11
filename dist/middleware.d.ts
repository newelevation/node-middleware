export type MiddlewareHandler<Input = any, Output = any> = (input: Input, output?: Output) => Promise<Output>;
export type Next = (input: any, output: any) => Promise<any>;
export type Middleware<Input = any> = (next: Next) => MiddlewareHandler<Input>;
export type NamedMiddleware<Input = any> = [string, Middleware<Input>];
export type PipelineMiddleware<Input = any> = Middleware<Input> | NamedMiddleware<Input>;
export type Modification<Input = any> = ["before" | "after" | "replace", name: string, Middleware<Input>] | ["skip", name: string];
export type Pipeline<Input = any> = <Output>(modifications?: Modification[]) => MiddlewareHandler<Input, Output>;
export declare const makePipeline: <Input>(middlewares?: PipelineMiddleware[]) => Pipeline<Input>;
export declare const passOutputAlong: Next;
