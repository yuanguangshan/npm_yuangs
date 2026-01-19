"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complete = complete;
exports.setProgramInstance = setProgramInstance;
const cache_1 = require("./cache");
const apps_1 = require("../apps");
const macros_1 = require("../macros");
async function complete(req) {
    const { words, currentIndex, currentWord, previousWord, command } = req;
    const cache = cache_1.CompletionCache.getInstance();
    const cacheKey = command || 'root';
    const cached = cache.get(cacheKey);
    if (cached) {
        return {
            items: cached.filter(item => item.label.startsWith(currentWord)),
            isPartial: true
        };
    }
    let items = [];
    if (currentIndex === 1) {
        items = await getAllCommandItems();
    }
    else if (command && currentIndex > 1) {
        items = await getCompletionItemsForCommand(command, previousWord, currentWord);
    }
    cache.set(cacheKey, items);
    return {
        items: items.filter(item => item.label.startsWith(currentWord)),
        isPartial: false
    };
}
async function getAllCommandItems() {
    const items = [];
    const commands = getBuiltinCommands();
    commands.forEach((cmd) => {
        items.push({
            type: { type: 'command', name: cmd.name, description: cmd.description },
            label: cmd.name,
            description: cmd.description
        });
    });
    try {
        const apps = (0, apps_1.loadAppsConfig)();
        Object.entries(apps).forEach(([name, url]) => {
            items.push({
                type: { type: 'app', name, description: `打开 ${url}` },
                label: name,
                description: `打开 ${url}`
            });
        });
    }
    catch { }
    try {
        const macros = (0, macros_1.getMacros)();
        Object.entries(macros).forEach(([name, macro]) => {
            items.push({
                type: { type: 'macro', name, description: macro.description || '' },
                label: name,
                description: macro.description
            });
        });
    }
    catch { }
    return items;
}
async function getCompletionItemsForCommand(command, previousWord, currentWord) {
    const items = [];
    const program = getProgramInstance();
    const cmd = program.commands.find((c) => c.name() === command);
    if (!cmd)
        return items;
    cmd.options.forEach((opt) => {
        opt.flags.split(/[, ]+/).forEach((flag) => {
            if (flag.startsWith('-') && !flag.startsWith('--')) {
                items.push({
                    type: { type: 'flag', parent: command, flag, description: opt.description || '' },
                    label: flag,
                    description: opt.description
                });
            }
        });
    });
    if (previousWord === '--model' || previousWord === '-m') {
        const models = getModelValues();
        models.forEach((model) => {
            items.push({
                type: { type: 'flag-value', flag: '--model', value: model, description: '' },
                label: model,
                description: ''
            });
        });
    }
    cmd.commands.forEach((subcmd) => {
        items.push({
            type: { type: 'subcommand', parent: command, name: subcmd.name(), description: subcmd.description() || '' },
            label: subcmd.name(),
            description: subcmd.description()
        });
    });
    return items;
}
function getModelValues() {
    return [
        'gemini-2.5-flash-lite',
        'gemini-2.5-pro',
        'Assistant',
        'GPT-4o-mini'
    ];
}
let programInstance = null;
function setProgramInstance(program) {
    programInstance = program;
}
function getProgramInstance() {
    return programInstance;
}
//# sourceMappingURL=runtime.js.map