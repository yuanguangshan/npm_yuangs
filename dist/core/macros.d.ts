import { type Macro } from './validation';
export type { Macro };
export declare function getMacros(): Record<string, Macro>;
export declare function saveMacro(name: string, commands: string, description?: string): boolean;
export declare function deleteMacro(name: string): boolean;
export declare function runMacro(name: string): boolean;
