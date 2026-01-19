"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complete = complete;
exports.getCommandSubcommands = getCommandSubcommands;
exports.setProgramInstance = setProgramInstance;
const path_1 = require("./path");
const macros_1 = require("../macros");
const apps_1 = require("../apps");
async function complete(req) {
    const { words, currentIndex, currentWord, previousWord } = req;
    const items = [];
    if (previousWord === '--model' || previousWord === '-m') {
        return [
            'gemini-2.5-flash-lite',
            'gemini-2.5-pro',
            'Assistant',
            'GPT-4o-mini'
        ];
    }
    if (currentWord.startsWith('@')) {
        return (0, path_1.resolvePathSuggestions)(currentWord, 'file');
    }
    if (currentWord.startsWith('#')) {
        return (0, path_1.resolvePathSuggestions)(currentWord, 'dir');
    }
    const commands = getBuiltinCommands();
    commands.forEach((cmd) => {
        items.push({
            type: 'command',
            name: cmd.name,
            label: cmd.name,
            description: cmd.description
        });
    });
    try {
        const apps = (0, apps_1.loadAppsConfig)();
        Object.entries(apps).forEach(([name, url]) => {
            items.push({
                type: 'app',
                name: name,
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
                type: 'macro',
                name: name,
                label: name,
                description: macro.description || ''
            });
        });
    }
    catch { }
    return items;
}
function getCommandSubcommands(program, commandName) {
    const items = [];
    const cmd = program.commands.find((c) => c.name() === commandName);
    if (!cmd)
        return items;
    cmd.options.forEach((opt) => {
        opt.flags.split(/[, ]+/).forEach((flag) => {
            if (flag.startsWith('-') && !flag.startsWith('--')) {
                items.push({
                    type: 'flag',
                    parent: commandName,
                    flag: flag,
                    label: flag,
                    description: opt.description || ''
                });
            }
        });
    });
    cmd.commands.forEach((subcmd) => {
        items.push({
            type: 'subcommand',
            parent: commandName,
            name: subcmd.name(),
            label: subcmd.name(),
            description: subcmd.description() || ''
        });
    });
    return items;
}
function getBuiltinCommands() {
    return [
        { name: 'ai', description: '向 AI 提问' },
        { name: 'list', description: '列出所有应用' },
        { name: 'history', description: '查看及执行命令历史' },
        { name: 'config', description: '管理本地配置' },
        { name: 'macros', description: '查看所有快捷指令' },
        { name: 'save', description: '保存快捷指令' },
        { name: 'run', description: '执行快捷指令' },
        { name: 'help', description: '显示帮助信息' },
        { name: 'completion', description: '安装 Shell 补全' },
        { name: 'shici', description: '打开古诗词 PWA' },
        { name: 'dict', description: '打开英语词典' },
        { name: 'pong', description: '打开 Pong 游戏' }
    ];
}
let programInstance = null;
function setProgramInstance(program) {
    programInstance = program;
}
function getProgramInstance() {
    return programInstance || {};
}
//# sourceMappingURL=unified.js.map