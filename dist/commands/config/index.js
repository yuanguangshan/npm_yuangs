"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerConfigCommands = registerConfigCommands;
const model_1 = require("./model");
const general_1 = require("./general");
/**
 * 注册 config 命令及其子命令
 */
function registerConfigCommands(program) {
    const configCmd = program
        .command('config')
        .description('管理本地配置 (~/.yuangs.json)');
    // 模型管理子命令
    configCmd
        .command('model')
        .description('管理默认 AI 模型')
        .argument('[action]', 'set, reset', 'get')
        .argument('[name]', '模型名称')
        .action((action, name) => {
        (0, model_1.handleModelCommand)(action, name);
    });
    // 通用配置子命令
    configCmd
        .command('get <key>')
        .description('读取配置项')
        .action((key) => {
        (0, general_1.handleGeneralConfigCommand)('get', key, undefined);
    });
    configCmd
        .command('set <key> <value>')
        .description('设置配置项')
        .action((key, value) => {
        (0, general_1.handleGeneralConfigCommand)('set', key, value);
    });
    configCmd
        .command('list')
        .description('列出所有配置项')
        .action(() => {
        (0, general_1.handleGeneralConfigCommand)('list', undefined, undefined);
    });
}
//# sourceMappingURL=index.js.map