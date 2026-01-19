import { CompletionRequest, CompletionResponse } from './types';
import { Command } from 'commander';
export declare function setProgramInstance(program: Command): void;
export declare function resolveCompletion(req: CompletionRequest): Promise<CompletionResponse>;
