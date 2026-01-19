import { CompletionRequest, CompletionResponse } from './types';
export declare function complete(req: CompletionRequest): Promise<CompletionResponse>;
export { setProgramInstance } from './resolver';
export { getAllCommands, getCommandSubcommands, getCommandDescription, installBashCompletion, installZshCompletion } from '../completion.legacy';
