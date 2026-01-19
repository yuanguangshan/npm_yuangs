"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setProgramInstance = setProgramInstance;
exports.resolveCompletion = resolveCompletion;
const utils_1 = require("./utils");
const builtin_1 = require("./builtin");
const apps_1 = require("../apps");
const macros_1 = require("../macros");
let programInstance = null;
function setProgramInstance(program) {
    programInstance = program;
}
function getProgramInstance() {
    return programInstance || {};
}
async function resolveCompletion(req) {
    const { words, currentIndex } = req;
    const currentWord = words[currentIndex] ?? '';
    const previousWord = words[currentIndex - 1] ?? '';
    if (currentIndex === 1) {
        return completeTopLevel(currentWord);
    }
    return completeSubcommand(words.slice(1, currentIndex), currentWord, previousWord);
}
function completeTopLevel(prefix) {
    const items = [];
    const commands = (0, builtin_1.getBuiltinCommands)();
    commands.forEach(cmd => {
        items.push({ label: cmd.name });
    });
    try {
        const apps = (0, apps_1.loadAppsConfig)();
        Object.keys(apps).forEach(name => {
            if (!items.find(i => i.label === name)) {
                items.push({ label: name });
            }
        });
    }
    catch { }
    try {
        const macros = (0, macros_1.getMacros)();
        Object.keys(macros).forEach(name => {
            if (!items.find(i => i.label === name)) {
                items.push({ label: name });
            }
        });
    }
    catch { }
    const filtered = items.filter(item => item.label.startsWith(prefix));
    return {
        items: (0, utils_1.unique)(filtered),
        isPartial: true
    };
}
function completeSubcommand(path, prefix, prev) {
    const items = [];
    if (prev === '--model' || prev === '-m') {
        items.push({ label: 'gemini-2.5-flash-lite' }, { label: 'gemini-2.5-pro' }, { label: 'Assistant' }, { label: 'GPT-4o-mini' });
    }
    else if (path.length > 0) {
        const baseCommand = path[0];
        const cmd = getProgramInstance().commands.find((c) => c.name() === baseCommand);
        if (cmd) {
            cmd.options.forEach((opt) => {
                opt.flags.split(/[, ]+/).forEach((flag) => {
                    if (flag.startsWith('-') && !flag.startsWith('--')) {
                        items.push({ label: flag });
                    }
                });
            });
            cmd.commands.forEach((subcmd) => {
                items.push({ label: subcmd.name() });
            });
        }
    }
    const filtered = items.filter(item => item.label.startsWith(prefix));
    return {
        items: (0, utils_1.unique)(filtered),
        isPartial: true
    };
}
//# sourceMappingURL=resolver.js.map