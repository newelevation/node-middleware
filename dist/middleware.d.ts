export type MiddlewareHandler<Input = any> = (input: Input, output?: any) => Promise<any>;
export type Next = (input: any, output: any) => Promise<any>;
export type Middleware<Input = any> = (next?: Next) => MiddlewareHandler<Input>;
export type Pipeline<Input = any> = () => MiddlewareHandler<Input>;
export declare const makePipeline: <Input>(use?: Middleware[]) => Pipeline<Input>;
