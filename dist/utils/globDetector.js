"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectGlobExpansion = detectGlobExpansion;
exports.wouldExpandAsGlob = wouldExpandAsGlob;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Detects if the given pattern would expand to files/directories in the current directory
 * This is particularly important for patterns like '??' which could match 2-character filenames
 */
function detectGlobExpansion(pattern, cwd = process.cwd()) {
    try {
        // Handle common glob patterns that could be dangerous
        const matches = [];
        if (pattern === '??') {
            // Look for all 2-character filenames in the current directory
            const items = fs_1.default.readdirSync(cwd);
            for (const item of items) {
                if (item.length === 2) {
                    const fullPath = path_1.default.join(cwd, item);
                    const stat = fs_1.default.statSync(fullPath);
                    matches.push(stat.isDirectory() ? `${item}/` : item);
                }
            }
        }
        else if (pattern === '?') {
            // Look for all 1-character filenames in the current directory
            const items = fs_1.default.readdirSync(cwd);
            for (const item of items) {
                if (item.length === 1) {
                    const fullPath = path_1.default.join(cwd, item);
                    const stat = fs_1.default.statSync(fullPath);
                    matches.push(stat.isDirectory() ? `${item}/` : item);
                }
            }
        }
        else if (pattern === '*') {
            // Look for all items in the current directory
            const items = fs_1.default.readdirSync(cwd);
            for (const item of items) {
                const fullPath = path_1.default.join(cwd, item);
                const stat = fs_1.default.statSync(fullPath);
                matches.push(stat.isDirectory() ? `${item}/` : item);
            }
        }
        else if (pattern.endsWith('?')) {
            // Pattern like 'abc?' - look for files with one additional character
            const prefix = pattern.slice(0, -1);
            const items = fs_1.default.readdirSync(cwd);
            for (const item of items) {
                if (item.startsWith(prefix) && item.length === prefix.length + 1) {
                    const fullPath = path_1.default.join(cwd, item);
                    const stat = fs_1.default.statSync(fullPath);
                    matches.push(stat.isDirectory() ? `${item}/` : item);
                }
            }
        }
        else if (pattern.endsWith('*')) {
            // Pattern like 'abc*' - look for files with that prefix
            const prefix = pattern.slice(0, -1);
            const items = fs_1.default.readdirSync(cwd);
            for (const item of items) {
                if (item.startsWith(prefix)) {
                    const fullPath = path_1.default.join(cwd, item);
                    const stat = fs_1.default.statSync(fullPath);
                    matches.push(stat.isDirectory() ? `${item}/` : item);
                }
            }
        }
        return matches;
    }
    catch (error) {
        // If there's an error reading the directory, return empty array
        console.warn(`Warning: Could not read directory ${cwd} for glob detection:`, error);
        return [];
    }
}
/**
 * Checks if a raw input might be subject to shell glob expansion
 * Returns true if the input contains glob patterns that would match files
 */
function wouldExpandAsGlob(rawInput, cwd = process.cwd()) {
    const trimmed = rawInput.trim();
    // Check for common glob patterns
    if (trimmed === '??' || trimmed === '?' || trimmed === '*') {
        const matches = detectGlobExpansion(trimmed, cwd);
        return {
            wouldExpand: matches.length > 0,
            matches
        };
    }
    // Check for other patterns ending with ? or *
    if (trimmed.endsWith('?') || trimmed.endsWith('*')) {
        const matches = detectGlobExpansion(trimmed, cwd);
        return {
            wouldExpand: matches.length > 0,
            matches
        };
    }
    // Check if the input starts with a glob pattern followed by space and other content
    // e.g., "?? explain this command"
    const parts = trimmed.split(/\s+/);
    if (parts.length > 0) {
        const firstPart = parts[0];
        if (firstPart === '??' || firstPart === '?' || firstPart === '*') {
            const matches = detectGlobExpansion(firstPart, cwd);
            return {
                wouldExpand: matches.length > 0,
                matches
            };
        }
    }
    return {
        wouldExpand: false,
        matches: []
    };
}
//# sourceMappingURL=globDetector.js.map