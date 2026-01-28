"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findProjectRoot = findProjectRoot;
exports.sortEntries = sortEntries;
exports.cached = cached;
exports.clearCache = clearCache;
exports.detectMode = detectMode;
exports.loadCommands = loadCommands;
exports.completeCommands = completeCommands;
exports.completePath = completePath;
exports.completeFileWithLine = completeFileWithLine;
exports.completeGitArgs = completeGitArgs;
exports.createCompleter = createCompleter;
exports.executeCommand = executeCommand;
exports.predictGhostText = predictGhostText;
exports.renderGhost = renderGhost;
exports.clearGhost = clearGhost;
exports.updateGhost = updateGhost;
exports.loadPlugins = loadPlugins;
exports.getPlugin = getPlugin;
exports.listPlugins = listPlugins;
exports.initialize = initialize;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const child_process_2 = require("child_process");
/* ========================================
   PROJECT CONTEXT
   ======================================== */
let PROJECT_ROOT = null;
function findProjectRoot(start = process.cwd()) {
    if (PROJECT_ROOT)
        return PROJECT_ROOT;
    let dir = start;
    const MAX_DEPTH = 10;
    let depth = 0;
    while (dir !== path_1.default.dirname(dir) && depth < MAX_DEPTH) {
        if (fs_1.default.existsSync(path_1.default.join(dir, 'package.json')) ||
            fs_1.default.existsSync(path_1.default.join(dir, '.git'))) {
            PROJECT_ROOT = dir;
            return dir;
        }
        dir = path_1.default.dirname(dir);
        depth++;
    }
    PROJECT_ROOT = start;
    return start;
}
const PRIORITY_DIRS = ['src', 'packages', 'apps', 'lib', 'components'];
function sortEntries(entries) {
    return entries.sort((a, b) => {
        const ai = PRIORITY_DIRS.indexOf(a.name);
        const bi = PRIORITY_DIRS.indexOf(b.name);
        if (ai === -1 && bi === -1)
            return 0;
        if (ai === -1)
            return 1;
        if (bi === -1)
            return -1;
        return ai - bi;
    });
}
const cache = new Map();
const TTL = 2000; // 2 seconds
function cached(key, fn) {
    const now = Date.now();
    const hit = cache.get(key);
    if (hit && now - hit.ts < TTL) {
        return hit.value;
    }
    const value = fn();
    cache.set(key, { ts: now, value });
    return value;
}
function clearCache() {
    cache.clear();
}
/* ========================================
   MODE DETECTION
   ======================================== */
function detectMode(line) {
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
let commandCache = null;
// Common shell builtins that should always be available
const SHELL_BUILTINS = [
    'cd', 'pwd', 'ls', 'mkdir', 'rmdir', 'rm', 'cp', 'mv', 'cat',
    'echo', 'grep', 'find', 'head', 'tail', 'less', 'more',
    'chmod', 'chown', 'touch', 'ln', 'df', 'du', 'free',
    'ps', 'top', 'kill', 'killall', 'bg', 'fg', 'jobs',
    'export', 'unset', 'env', 'alias', 'unalias',
    'history', 'type', 'which', 'whereis', 'man',
    'sleep', 'wait', 'date', 'cal', 'uptime', 'uname',
    'tar', 'gzip', 'gunzip', 'zip', 'unzip',
    'curl', 'wget', 'ssh', 'scp', 'rsync'
];
function loadCommands() {
    return cached('PATH_COMMANDS', () => {
        const paths = process.env.PATH?.split(path_1.default.delimiter) ?? [];
        const cmds = new Set(SHELL_BUILTINS);
        for (const p of paths) {
            try {
                for (const f of fs_1.default.readdirSync(p)) {
                    cmds.add(f);
                }
            }
            catch {
                // Ignore directories we can't read
            }
        }
        commandCache = [...cmds];
        return commandCache;
    });
}
function completeCommands(partial) {
    return loadCommands().filter(cmd => cmd.startsWith(partial));
}
/* ========================================
   FILE/DIRECTORY COMPLETION
   ======================================== */
function splitToken(line) {
    const match = line.match(/(.+?\s)?([^\s]*)$/);
    return {
        prefix: match?.[1] ?? '',
        token: match?.[2] ?? ''
    };
}
function completePath(raw, type) {
    // Remove sigil (@ or #)
    const withoutSigil = raw.slice(1);
    // Handle case: only sigil (e.g., "@")
    if (!withoutSigil) {
        const currentDir = process.cwd();
        try {
            let entries = fs_1.default.readdirSync(currentDir, { withFileTypes: true });
            entries = sortEntries(entries);
            return entries
                .filter(e => type === 'file' ? e.isFile() : e.isDirectory())
                .map(e => (type === 'file' ? '@' : '#') + e.name);
        }
        catch {
            return [];
        }
    }
    // Extract base directory and partial name
    const baseDir = withoutSigil.includes(path_1.default.sep)
        ? path_1.default.dirname(withoutSigil)
        : '.';
    const partial = withoutSigil.includes(path_1.default.sep)
        ? path_1.default.basename(withoutSigil)
        : withoutSigil;
    const resolvedBase = path_1.default.resolve(baseDir);
    if (!fs_1.default.existsSync(resolvedBase) || !fs_1.default.statSync(resolvedBase).isDirectory()) {
        return [];
    }
    let entries;
    try {
        entries = fs_1.default.readdirSync(resolvedBase, { withFileTypes: true });
        entries = sortEntries(entries);
    }
    catch {
        return [];
    }
    return entries
        .filter(e => {
        const matchesPrefix = e.name.startsWith(partial);
        if (!matchesPrefix)
            return false;
        return type === 'file' ? e.isFile() : e.isDirectory();
    })
        .map(e => {
        const fullName = (baseDir === '.' ? '' : baseDir + path_1.default.sep) + e.name;
        const sigil = type === 'file' ? '@' : '#';
        return sigil + fullName;
    });
}
/* ========================================
   FILE:LINE COMPLETION
   ======================================== */
function completeFileWithLine(token) {
    const [filePath, linePart] = token.slice(1).split(':');
    if (!filePath) {
        return completePath('@' + token, 'file');
    }
    const absolutePath = path_1.default.resolve(filePath);
    if (!fs_1.default.existsSync(absolutePath)) {
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
function completeGitArgs(args) {
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
                const branches = (0, child_process_2.execSync)('git branch --all', {
                    encoding: 'utf8',
                    cwd: process.cwd()
                });
                return branches
                    .split('\n')
                    .map(l => l.replace(/^[* ]+/, '').trim())
                    .filter(b => b && b.startsWith(args[2] || ''));
            }
            catch {
                return [];
            }
        }
    }
    catch {
        // Not in a git repo or git not available
    }
    return [];
}
/* ========================================
   SMART COMPLETER (Main Entry)
   ======================================== */
function createCompleter() {
    return (line) => {
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
        }
        catch (error) {
            // Fail gracefully
            return [[], line];
        }
    };
}
/* ========================================
   COMMAND EXECUTION
   ======================================== */
async function executeCommand(cmdLine, onExit, stdinData, captureStdout = false) {
    const trimmed = cmdLine.trim();
    const command = trimmed.replace(/^[$!]\s*/, '');
    return new Promise((resolve) => {
        const child = (0, child_process_1.spawn)(command, {
            stdio: [
                stdinData ? 'pipe' : 'inherit',
                captureStdout ? 'pipe' : 'inherit',
                'inherit'
            ],
            shell: true,
            cwd: process.cwd()
        });
        let stdout = '';
        if (captureStdout && child.stdout) {
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });
        }
        if (stdinData && child.stdin) {
            child.stdin.write(stdinData);
            child.stdin.end();
        }
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
        child.on('close', () => {
            if (captureStdout) {
                resolve(stdout.trim());
            }
            else {
                resolve(undefined);
            }
        });
    });
}
/* ========================================
   GHOST TEXT (Suggestions)
   ======================================== */
let currentGhostText = '';
function predictGhostText(line) {
    const mode = detectMode(line);
    if (mode === 'command') {
        const cmdLine = line.replace(/^[$!]/, '');
        // Git suggestions
        if (cmdLine === 'git ch')
            return 'eckout';
        if (cmdLine === 'git st')
            return 'atus';
        if (cmdLine === 'git co')
            return 'mmit';
        // NPM suggestions
        if (cmdLine === 'npm r')
            return 'un dev';
        if (cmdLine === 'npm b')
            return 'uild';
        // LS suggestions
        if (cmdLine === 'ls -')
            return 'la';
        // Common patterns
        if (cmdLine === 'gi')
            return 't';
    }
    return '';
}
function renderGhost(rl) {
    if (!currentGhostText)
        return;
    process.stdout.write(`\x1b[90m${currentGhostText}\x1b[0m`);
}
function clearGhost(rl) {
    if (currentGhostText) {
        process.stdout.write(`\x1b[2K\r`);
        currentGhostText = '';
    }
}
function updateGhost(line) {
    currentGhostText = predictGhostText(line);
}
/* ========================================
   PLUGIN SYSTEM
   ======================================== */
const plugins = new Map();
const PLUGIN_DIR = path_1.default.join(findProjectRoot(), '.shell', 'plugins');
function loadPlugins() {
    if (!fs_1.default.existsSync(PLUGIN_DIR)) {
        try {
            fs_1.default.mkdirSync(PLUGIN_DIR, { recursive: true });
        }
        catch {
            // Can't create plugin directory
        }
        return;
    }
    try {
        for (const file of fs_1.default.readdirSync(PLUGIN_DIR)) {
            if (file.endsWith('.js') || file.endsWith('.ts')) {
                try {
                    const pluginPath = path_1.default.join(PLUGIN_DIR, file);
                    const plugin = require(pluginPath);
                    if (plugin.command && plugin.complete) {
                        plugins.set(plugin.command, plugin);
                    }
                }
                catch {
                    // Invalid plugin
                }
            }
        }
    }
    catch {
        // Can't read plugin directory
    }
}
function getPlugin(command) {
    return plugins.get(command);
}
function listPlugins() {
    return [...plugins.keys()];
}
/* ========================================
   INITIALIZE
   ======================================== */
function initialize() {
    findProjectRoot();
    loadPlugins();
    loadCommands();
}
// Auto-initialize on import
initialize();
//# sourceMappingURL=shellCompletions.js.map