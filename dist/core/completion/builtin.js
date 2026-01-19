"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBuiltinCommands = getBuiltinCommands;
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
//# sourceMappingURL=builtin.js.map