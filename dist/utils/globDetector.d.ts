/**
 * Detects if the given pattern would expand to files/directories in the current directory
 * This is particularly important for patterns like '??' which could match 2-character filenames
 */
export declare function detectGlobExpansion(pattern: string, cwd?: string): string[];
/**
 * Checks if a raw input might be subject to shell glob expansion
 * Returns true if the input contains glob patterns that would match files
 */
export declare function wouldExpandAsGlob(rawInput: string, cwd?: string): {
    wouldExpand: boolean;
    matches: string[];
};
