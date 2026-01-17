import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { parseUserConfig, userConfigSchema, type UserConfig } from '../core/validation';

const CONFIG_FILE = path.join(os.homedir(), '.yuangs.json');

export function handleConfig(args: string[]) {
    const action = args[0]; // get, set, list

    if (!action || action === 'list') {
        const config = readConfig();
        console.log(chalk.bold.cyan('\n⚙️  当前配置 (~/.yuangs.json):\n'));
        if (Object.keys(config).length === 0) {
            console.log(chalk.gray('  (配置文件不存在或为空)'));
        } else {
            Object.entries(config).forEach(([key, value]) => {
                console.log(`  ${chalk.white(key)}: ${chalk.green(value)}`);
            });
        }
        console.log('\n使用方法:');
        console.log(chalk.gray('  yuangs config set <key> <value>'));
        console.log(chalk.gray('  yuangs config get <key>\n'));
        return;
    }

    if (action === 'set') {
        const key = args[1];
        const value = args[2];
        if (!key || !value) {
            console.log(chalk.red('错误: 请提供 key 和 value。例如: yuangs config set defaultModel gemini-2.5-flash-lite'));
            return;
        }
        const config = readConfig();
        config[key] = value;
        writeConfig(config);
        console.log(chalk.green(`✓ 已将 ${key} 设置为 ${value}`));
        return;
    }

    if (action === 'get') {
        const key = args[1];
        if (!key) {
            console.log(chalk.red('错误: 请提供 key。例如: yuangs config get defaultModel'));
            return;
        }
        const config = readConfig();
        if (config[key] !== undefined) {
            console.log(config[key]);
        } else {
            console.log(chalk.yellow(`配置项 ${key} 不存在`));
        }
        return;
    }
}

function readConfig(): UserConfig {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            return parseUserConfig(fs.readFileSync(CONFIG_FILE, 'utf8'));
        } catch (e) {
            return {};
        }
    }
    return {};
}

function writeConfig(config: UserConfig) {
    const validated = userConfigSchema.parse(config);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(validated, null, 2));
}
