import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { execSync } from 'child_process';

/* ========================================
   TYPE DEFINITIONS
   ======================================== */

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

/* ========================================
   PROJECT CONTEXT
   ======================================== */

let PROJECT_ROOT: string | null = null;

export function findProjectRoot(start = process.cwd()): string {
    if (PROJECT_ROOT) return PROJECT_ROOT;

    let dir = start;
    const MAX_DEPTH = 10;
    let depth = 0;

    while (dir !== path.dirname(dir) && depth < MAX_DEPTH) {
        if (fs.existsSync(path.join(dir, 'package.json')) ||
            fs.existsSync(path.join(dir, '.git'))) {
            PROJECT_ROOT = dir;
            return dir;
        }
        dir = path.dirname(dir);
        depth++;
    }

    PROJECT_ROOT = start;
    return start;
}

const PRIORITY_DIRS = ['src', 'packages', 'apps', 'lib', 'components'];

export function sortEntries(entries: fs.Dirent[]): fs.Dirent[] {
    return entries.sort((a, b) => {
        const ai = PRIORITY_DIRS.indexOf(a.name);
        const bi = PRIORITY_DIRS.indexOf(b.name);

        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
    });
}

/* ========================================
   CACHING SYSTEM
   ======================================== */

interface CacheEntry<T> {
    ts: number;
    value: T;
}

const cache = new Map<string, CacheEntry<any>>();
const TTL = 2000; // 2 seconds

export function cached<T>(key: string, fn: () => T): T {
    const now = Date.now();
    const hit = cache.get(key);

    if (hit && now - hit.ts < TTL) {
        return hit.value;
    }

    const value = fn();
    cache.set(key, { ts: now, value });
    return value;
}

export function clearCache(): void {
    cache.clear();
}

/* ========================================
   MODE DETECTION
   ======================================== */

export function detectMode(line: string): Mode {
    const trimmed = line.trimStart();

    // Check for explicit command prefixes
    if (trimmed.startsWith('$') || trimmed.startsWith('!')) {
        return 'command';
    }

    const tokens = line.split(/\s+/);
    const last = tokens[tokens.length - 1];

    // Check for file reference (@)
    if (last?.startsWith('@')) {
        return 'file';
    }

    // Check for directory reference (#)
    if (last?.startsWith('#')) {
        return 'dir';
    }

    // Check if first token is a command (fish-style)
    const first = tokens[0];
    if (first) {
        const commands = loadCommands();
        if (commands.includes(first)) {
            return 'command';
        }
    }

    // Default to chat mode
    return 'chat';
}

/* ========================================
   COMMAND COMPLETION (PATH)
   ======================================== */

let commandCache: string[] | null = null;

export function loadCommands(): string[] {
    return cached('PATH_COMMANDS', () => {
        const paths = process.env.PATH?.split(path.delimiter) ?? [];
        const cmds = new Set<string>();

        for (const p of paths) {
            try {
                for (const f of fs.readdirSync(p)) {
                    cmds.add(f);
                }
            } catch {
                // Ignore directories we can't read
            }
        }

        commandCache = [...cmds];
        return commandCache;
    });
}

export function completeCommands(partial: string): string[] {
    return loadCommands().filter(cmd => cmd.startsWith(partial));
}

/* ========================================
   FILE/DIRECTORY COMPLETION
   ======================================== */

function splitToken(line: string): { prefix: string; token: string } {
    const match = line.match(/(.+?\s)?([^\s]*)$/);
    return {
        prefix: match?.[1] ?? '',
        token: match?.[2] ?? ''
    };
}

export function completePath(
    raw: string,
    type: 'file' | 'dir'
): string[] {
    // Remove sigil (@ or #)
    const withoutSigil = raw.slice(1);

    // Handle case: only sigil (e.g., "@")
    if (!withoutSigil) {
        const currentDir = process.cwd();
        try {
            let entries = fs.readdirSync(currentDir, { withFileTypes: true });
            entries = sortEntries(entries);
            return entries
                .filter(e => type === 'file' ? e.isFile() : e.isDirectory())
                .map(e => (type === 'file' ? '@' : '#') + e.name);
        } catch {
            return [];
        }
    }

    // Extract base directory and partial name
    const baseDir = withoutSigil.includes(path.sep)
        ? path.dirname(withoutSigil)
        : '.';

    const partial = withoutSigil.includes(path.sep)
        ? path.basename(withoutSigil)
        : withoutSigil;

    const resolvedBase = path.resolve(baseDir);

    if (!fs.existsSync(resolvedBase) || !fs.statSync(resolvedBase).isDirectory()) {
        return [];
    }

    let entries: fs.Dirent[];
    try {
        entries = fs.readdirSync(resolvedBase, { withFileTypes: true });
        entries = sortEntries(entries);
    } catch {
        return [];
    }

    return entries
        .filter(e => {
            const matchesPrefix = e.name.startsWith(partial);
            if (!matchesPrefix) return false;
            return type === 'file' ? e.isFile() : e.isDirectory();
        })
        .map(e => {
            const fullName = (baseDir === '.' ? '' : baseDir + path.sep) + e.name;
            const sigil = type === 'file' ? '@' : '#';
            return sigil + fullName;
        });
}

/* ========================================
   FILE:LINE COMPLETION
   ======================================== */

export function completeFileWithLine(token: string): string[] {
    const [filePath, linePart] = token.slice(1).split(':');

    if (!filePath) {
        return completePath('@' + token, 'file');
    }

    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
        return [];
    }

    if (linePart !== undefined) {
        // Suggest common line numbers
        const lineNums = ['1', '10', '20', '50', '100', '200'];
        const matches = lineNums.filter(ln => ln.startsWith(linePart));
        return matches.map(ln => '@' + filePath + ':' + ln);
    }

    // File exists, add colon for line input
    return ['@' + filePath + ':'];
}

/* ========================================
   ARGUMENT COMPLETION (GIT, etc.)
   ======================================== */

export function completeGitArgs(args: string[]): string[] {
    try {
        if (args.length <= 1) {
            // Complete subcommands
            const subcommands = [
                'add', 'branch', 'checkout', 'commit', 'diff',
                'log', 'merge', 'pull', 'push', 'rebase',
                'status', 'reset', 'revert', 'stash'
            ];
            return subcommands.filter(cmd => cmd.startsWith(args[1] || ''));
        }

        if (args[1] === 'checkout' && args.length <= 2) {
            // Complete branches
            try {
                const branches = execSync('git branch --all', {
                    encoding: 'utf8',
                    cwd: process.cwd()
                });
                return branches
                    .split('\n')
                    .map(l => l.replace(/^[* ]+/, '').trim())
                    .filter(b => b && b.startsWith(args[2] || ''));
            } catch {
                return [];
            }
        }
    } catch {
        // Not in a git repo or git not available
    }

    return [];
}

/* ========================================
   SMART COMPLETER (Main Entry)
   ======================================== */

export function createCompleter(): readline.Completer {
    return (line: string) => {
        try {
            const mode = detectMode(line);
            const { prefix, token } = splitToken(line);

            if (mode === 'file' && token.startsWith('@')) {
                if (token.includes(':')) {
                    // File:line mode
                    const matches = completeFileWithLine(token);
                    return [matches, token];
                }

                // File completion
                const matches = completePath(token, 'file');
                return [matches, token];
            }

            if (mode === 'dir' && token.startsWith('#')) {
                // Directory completion
                const matches = completePath(token, 'dir');
                return [matches, token];
            }

            if (mode === 'command') {
                // Command completion
                const cmdLine = line.replace(/^[$!]/, '');
                const parts = cmdLine.split(/\s+/);
                const cmd = parts[0];
                const current = parts[parts.length - 1] || '';

                // Git argument completion
                if (cmd === 'git') {
                    const matches = completeGitArgs(parts);
                    const filtered = matches.filter(m => m.startsWith(current));
                    return [filtered, current];
                }

                // General command completion
                const matches = completeCommands(current);
                return [matches, current];
            }

            // Default: no completion in chat mode
            return [[], line];
        } catch (error) {
            // Fail gracefully
            return [[], line];
        }
    };
}

/* ========================================
   COMMAND EXECUTION
   ======================================== */

export async function executeCommand(
    cmdLine: string,
    onExit?: (code: number | null) => void
): Promise<void> {
    const trimmed = cmdLine.trim();
    const command = trimmed.replace(/^[$!]\s*/, '');

    const child = spawn(command, {
        stdio: 'inherit',
        shell: true,
        cwd: process.cwd()
    });

    child.on('exit', (code) => {
        if (onExit) {
            onExit(code);
        }
    });

    child.on('error', (err) => {
        console.error(`\n[Command Error]: ${err.message}`);
        if (onExit) {
            onExit(1);
        }
    });

    return new Promise((resolve) => {
        child.on('close', () => resolve());
    });
}

/* ========================================
   GHOST TEXT (Suggestions)
   ======================================== */

let currentGhostText = '';

export function predictGhostText(line: string): string {
    const mode = detectMode(line);

    if (mode === 'command') {
        const cmdLine = line.replace(/^[$!]/, '');

        // Git suggestions
        if (cmdLine === 'git ch') return 'eckout';
        if (cmdLine === 'git st') return 'atus';
        if (cmdLine === 'git co') return 'mmit';

        // NPM suggestions
        if (cmdLine === 'npm r') return 'un dev';
        if (cmdLine === 'npm b') return 'uild';

        // LS suggestions
        if (cmdLine === 'ls -') return 'la';

        // Common patterns
        if (cmdLine === 'gi') return 't';
    }

    return '';
}

export function renderGhost(rl: readline.Interface): void {
    if (!currentGhostText) return;
    process.stdout.write(`\x1b[90m${currentGhostText}\x1b[0m`);
}

export function clearGhost(rl: readline.Interface): void {
    if (currentGhostText) {
        process.stdout.write(`\x1b[2K\r`);
        currentGhostText = '';
    }
}

export function updateGhost(line: string): void {
    currentGhostText = predictGhostText(line);
}

/* ========================================
   PLUGIN SYSTEM
   ======================================== */

const plugins = new Map<string, CommandPlugin>();
const PLUGIN_DIR = path.join(findProjectRoot(), '.shell', 'plugins');

export function loadPlugins(): void {
    if (!fs.existsSync(PLUGIN_DIR)) {
        try {
            fs.mkdirSync(PLUGIN_DIR, { recursive: true });
        } catch {
            // Can't create plugin directory
        }
        return;
    }

    try {
        for (const file of fs.readdirSync(PLUGIN_DIR)) {
            if (file.endsWith('.js') || file.endsWith('.ts')) {
                try {
                    const pluginPath = path.join(PLUGIN_DIR, file);
                    const plugin = require(pluginPath);
                    if (plugin.command && plugin.complete) {
                        plugins.set(plugin.command, plugin);
                    }
                } catch {
                    // Invalid plugin
                }
            }
        }
    } catch {
        // Can't read plugin directory
    }
}

export function getPlugin(command: string): CommandPlugin | undefined {
    return plugins.get(command);
}

export function listPlugins(): string[] {
    return [...plugins.keys()];
}

/* ========================================
   INITIALIZE
   ======================================== */

export function initialize(): void {
    findProjectRoot();
    loadPlugins();
    loadCommands();
}

// Auto-initialize on import
initialize();
