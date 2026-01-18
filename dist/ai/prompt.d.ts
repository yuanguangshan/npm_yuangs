import { OSProfile } from '../core/os';
import type { Macro } from '../core/validation';
export declare function buildCommandPrompt(userInput: string, os: OSProfile, macros?: Record<string, Macro>, context?: string): string;
export declare function buildFixPrompt(originalCmd: string, stderr: string, os: OSProfile): string;
