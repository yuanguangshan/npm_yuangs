import { OSProfile } from '../core/os';
export declare function buildCommandPrompt(userInput: string, os: OSProfile): string;
export declare function buildFixPrompt(originalCmd: string, stderr: string, os: OSProfile): string;
