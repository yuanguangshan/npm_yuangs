import chalk from 'chalk';
import { Command } from 'commander';
import { handleModelCommand } from './model';
import { handleGeneralConfigCommand } from './general';

/**
 * 注册 config 命令及其子命令
 */
export function registerConfigCommands(program: Command): void {
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
            handleModelCommand(action, name);
        });

    // 通用配置子命令
    configCmd
        .command('get <key>')
        .description('读取配置项')
        .action((key) => {
            handleGeneralConfigCommand('get', key, undefined);
        });

    configCmd
        .command('set <key> <value>')
        .description('设置配置项')
        .action((key, value) => {
            handleGeneralConfigCommand('set', key, value);
        });

    configCmd
        .command('list')
        .description('列出所有配置项')
        .action(() => {
            handleGeneralConfigCommand('list', undefined, undefined);
        });
}
