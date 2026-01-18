import readline from 'readline';
import fs from 'fs';
export type Mode = 'chat' | 'file' | 'dir' | 'command';
export interface CompletionContext {
    line: string;
    cursor: number;
    mode: Mode;
    cwd: string;
}
export interface CommandPlugin {
    command: string;
    complete(args: string[], context: CompletionContext): string[];
}
export declare function findProjectRoot(start?: string): string;
export declare function sortEntries(entries: fs.Dirent[]): fs.Dirent[];
export declare function cached<T>(key: string, fn: () => T): T;
export declare function clearCache(): void;
export declare function detectMode(line: string): Mode;
export declare function loadCommands(): string[];
export declare function completeCommands(partial: string): string[];
export declare function completePath(raw: string, type: 'file' | 'dir'): string[];
export declare function completeFileWithLine(token: string): string[];
export declare function completeGitArgs(args: string[]): string[];
export declare function createCompleter(): readline.Completer;
export declare function executeCommand(cmdLine: string, onExit?: (code: number | null) => void): Promise<void>;
export declare function predictGhostText(line: string): string;
export declare function renderGhost(rl: readline.Interface): void;
export declare function clearGhost(rl: readline.Interface): void;
export declare function updateGhost(line: string): void;
export declare function loadPlugins(): void;
export declare function getPlugin(command: string): CommandPlugin | undefined;
export declare function listPlugins(): string[];
export declare function initialize(): void;
