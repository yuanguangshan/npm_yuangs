import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { parseUserConfig, userConfigSchema, type UserConfig } from '../../core/validation';

const CONFIG_FILE = path.join(os.homedir(), '.yuangs.json');

/**
 * 读取并验证配置
 */
function readConfig(): UserConfig {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return parseUserConfig(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
      console.log(chalk.yellow(`\n⚠️  配置文件解析失败: ${(e as Error).message}\n`));
      return {};
    }
  }
  return {};
}

/**
 * 写入配置
 */
function writeConfig(config: UserConfig): void {
  try {
    const validated = userConfigSchema.parse(config);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(validated, null, 2));
  } catch (e) {
    console.log(chalk.red(`\n❌ 配置验证失败: ${(e as Error).message}\n`));
    throw e;
  }
}

/**
 * 处理通用配置命令
 */
export function handleGeneralConfigCommand(
  action: string,
  key: string | undefined,
  value: string | undefined
): void {
  if (action === 'list') {
    listConfig();
    return;
  }

  if (action === 'get') {
    getConfigValue(key);
    return;
  }

  if (action === 'set') {
    setConfigValue(key, value);
    return;
  }

  console.log(chalk.red(`\n❌ 未知操作: ${action}\n`));
  console.log(chalk.gray('可用操作: list, get, set\n'));
  console.log(chalk.gray('示例:'));
  console.log(chalk.gray('  yuangs config list              # 列出所有配置'));
  console.log(chalk.gray('  yuangs config get defaultModel  # 读取配置项'));
  console.log(chalk.gray('  yuangs config set aiProxyUrl https://...  # 设置配置项\n'));
}

/**
 * 列出所有配置项
 */
function listConfig(): void {
  const config = readConfig();

  console.log(chalk.bold.cyan('\n⚙️  当前配置 (~/.yuangs.json)\n'));

  if (Object.keys(config).length === 0) {
    console.log(chalk.gray('  (配置文件不存在或为空)\n'));
    return;
  }

  // 分组显示配置
  const groups: Record<string, Array<{key: string, value: any}>> = {
    'AI 配置': [],
    '账户配置': [],
    '上下文配置': [],
    '其他配置': []
  };

  for (const [key, value] of Object.entries(config)) {
    if (key === 'defaultModel' || key === 'aiProxyUrl') {
      groups['AI 配置'].push({ key, value });
    } else if (key === 'accountType') {
      groups['账户配置'].push({ key, value });
    } else if (key === 'contextWindow' || key === 'maxFileTokens' || key === 'maxTotalTokens') {
      groups['上下文配置'].push({ key, value });
    } else {
      groups['其他配置'].push({ key, value });
    }
  }

  for (const [groupName, items] of Object.entries(groups)) {
    if (items.length === 0) continue;

    console.log(chalk.yellow(`${groupName}:`));
    for (const item of items) {
      const displayValue = typeof item.value === 'object' 
        ? JSON.stringify(item.value) 
        : String(item.value);
      console.log(`  ${chalk.white(item.key)}: ${chalk.green(displayValue)}`);
    }
    console.log('');
  }
}

/**
 * 读取配置项
 */
function getConfigValue(key: string | undefined): void {
  if (!key) {
    console.log(chalk.red('\n❌ 请提供配置项名称\n'));
    console.log(chalk.gray('用法: yuangs config get <key>\n'));
    console.log(chalk.gray('示例: yuangs config get defaultModel\n'));
    console.log(chalk.gray('常用配置项:'));
    console.log(chalk.gray('  - defaultModel: 默认 AI 模型'));
    console.log(chalk.gray('  - aiProxyUrl: API 代理地址'));
    console.log(chalk.gray('  - accountType: 账户类型 (free/pro/paid)'));
    console.log(chalk.gray('  - contextWindow: 上下文窗口大小'));
    console.log('');
    return;
  }

  const config = readConfig();
  const value = config[key as keyof UserConfig];

  if (value === undefined) {
    console.log(chalk.yellow(`\n⚠️  配置项 "${key}" 不存在\n`));
    console.log(chalk.gray('使用 "yuangs config list" 查看所有配置项\n'));
    return;
  }

  console.log(`${value}`);
}

/**
 * 设置配置项
 */
function setConfigValue(key: string | undefined, value: string | undefined): void {
  if (!key || !value) {
    console.log(chalk.red('\n❌ 请提供配置项名称和值\n'));
    console.log(chalk.gray('用法: yuangs config set <key> <value>\n'));
    console.log(chalk.gray('示例:'));
    console.log(chalk.gray('  yuangs config set defaultModel gemini-2.5-flash'));
    console.log(chalk.gray('  yuangs config set accountType paid'));
    console.log(chalk.gray('  yuangs config set contextWindow 8000\n'));
    return;
  }

  const config = readConfig();
  const oldValue = config[key as keyof UserConfig];

  // 尝试解析值（处理数字、布尔值等）
  let parsedValue: any = value;
  try {
    // 尝试解析为 JSON
    parsedValue = JSON.parse(value);
  } catch {
    // 如果不是 JSON，保持原样
    parsedValue = value;
  }

  // 更新配置
  (config as any)[key] = parsedValue;

  try {
    writeConfig(config);

    console.log(chalk.bold.cyan('\n✔ 配置已更新\n'));
    console.log(`  ${chalk.green('配置项:')} ${chalk.white(key)}`);
    console.log(`  ${chalk.green('旧值:')} ${chalk.gray(oldValue !== undefined ? String(oldValue) : '(未设置)')}`);
    console.log(`  ${chalk.green('新值:')} ${chalk.white(String(parsedValue))}`);
    console.log(`  ${chalk.green('文件:')} ${chalk.gray('~/.yuangs.json')}`);
    console.log(chalk.gray('\n✅ 设置已立即生效\n'));
  } catch (e) {
    console.log(chalk.red(`\n❌ 配置更新失败: ${(e as Error).message}\n`));
  }
}
