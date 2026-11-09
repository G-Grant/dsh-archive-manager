declare module "@deepseek-ai/dsh-typert-protocol" {
  export class TypertRemoteService {
    protected ctx: any;
    constructor(ctx: any, name: string);
  }
  export class RemoteError extends Error {
    code: string;
    details?: unknown;
    constructor(code: string, message: string, details?: unknown);
  }
  export function Remote(name: string): (target: unknown, context: unknown) => unknown;
}

declare module "@deepseek-ai/dsh-session" {
  export function SessionId(value: string): string;
}

declare global {
  interface Window {
    __ModuleLoader__: {
      load(module: { id: string; factory: (require: (name: string) => any) => unknown }): void;
    };
  }
}

export {};
