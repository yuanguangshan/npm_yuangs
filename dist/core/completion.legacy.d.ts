import { Command } from 'commander';
export declare function getAllCommands(program: Command): string[];
/**
 * 获取命令的子命令或参数
 */
export declare function getCommandSubcommands(program: Command, commandName: string): string[];
/**
 * 生成 Bash 补全脚本
 */
export declare function generateBashCompletion(program: Command): string;
/**
 * 生成 Zsh 补全脚本
 */
export declare function generateZshCompletion(program: Command): string;
export declare function installBashCompletion(program: Command): Promise<boolean>;
export declare function installZshCompletion(program: Command): Promise<boolean>;
/**
 * 获取命令描述（用于补全提示）
 */
export declare function getCommandDescription(program: Command, commandName: string): string;
