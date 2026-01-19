import type { CompletionRequest } from './types';
export declare function complete(req: CompletionRequest): Promise<CompletionResponse>;
export declare function setProgramInstance(program: any): void;
