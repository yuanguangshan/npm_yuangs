import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import {
  isSupportedModel,
  listAvailableModels,
  getModelMetadata,
  getDefaultModel,
  type SupportedModel
} from './modelRegistry';
import { parseUserConfig, userConfigSchema, type UserConfig } from '../../core/validation';

const CONFIG_FILE = path.join(os.homedir(), '.yuangs.json');

/**
 * 读取并验证配置文件
 */
function readConfig(): UserConfig {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return parseUserConfig(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
      // 配置文件解析失败时返回空配置
      return {};
    }
  }
  return {};
}

/**
 * 写入配置文件
 */
function writeConfig(config: UserConfig): void {
  try {
    // 确保写入前通过 schema 验证
    const validated = userConfigSchema.parse(config);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(validated, null, 2));
  } catch (e) {
    console.log(chalk.red(`\n❌ 配置验证失败: ${(e as Error).message}\n`));
    throw e;
  }
}

/**
 * 处理模型管理命令
 */
export function handleModelCommand(action: string, modelName: string): void {
  // 如果没有 action 或 action 是 get，显示当前模型
  if (!action || action === 'get') {
    showCurrentModel();
    return;
  }

  // 如果 action 是 list，列出所有模型
  if (action === 'list') {
    console.log(listAvailableModels());
    return;
  }

  // 如果 action 是 set，设置默认模型
  if (action === 'set') {
    setDefaultModel(modelName);
    return;
  }

  // 如果 action 是 reset，重置为默认模型
  if (action === 'reset') {
    resetDefaultModel();
    return;
  }

  // 未知操作
  console.log(chalk.red(`\n❌ 未知操作: ${action}`));
  console.log(chalk.gray('\n可用操作: get, list, set, reset\n'));
  console.log(chalk.gray('示例:'));
  console.log(chalk.gray('  yuangs config model get           # 查看当前模型'));
  console.log(chalk.gray('  yuangs config model list          # 列出所有模型'));
  console.log(chalk.gray('  yuangs config model set gpt-4o    # 设置模型'));
  console.log(chalk.gray('  yuangs config model reset         # 重置为默认\n'));
}

/**
 * 显示当前默认模型
 */
function showCurrentModel(): void {
  const config = readConfig();
  const currentModel = config.defaultModel || getDefaultModel();

  console.log(chalk.bold.cyan('\n🤖 当前默认模型\n'));
  console.log(`  ${chalk.green('Model:')} ${chalk.white(currentModel)}`);

  if (isSupportedModel(currentModel)) {
    const meta = getModelMetadata(currentModel);
    console.log(`  ${chalk.green('Provider:')} ${chalk.white(meta.provider)}`);
    console.log(`  ${chalk.green('Description:')} ${chalk.gray(meta.description)}`);
    if (meta.recommended) {
      console.log(`  ${chalk.green('⭐ 推荐')}`);
    }
  }

  console.log(`  ${chalk.green('Source:')} ${chalk.gray('~/.yuangs.json')}\n`);
}

/**
 * 设置默认模型
 */
function setDefaultModel(modelName: string): void {
  if (!modelName) {
    console.log(chalk.red('\n❌ 请提供模型名称\n'));
    console.log(chalk.gray('用法: yuangs config model set <model-name>\n'));
    console.log(chalk.gray('示例: yuangs config model set gemini-2.5-flash\n'));
    console.log(listAvailableModels());
    return;
  }

  // 检查模型是否支持
  if (!isSupportedModel(modelName)) {
    console.log(chalk.red(`\n❌ 不支持的模型: ${modelName}\n`));
    console.log(listAvailableModels());
    console.log(chalk.yellow('\n💡 提示: 如果您确认该模型可用，可以手动编辑 ~/.yuangs.json\n'));
    return;
  }

  const config = readConfig();
  const oldModel = config.defaultModel || getDefaultModel();
  const newModel = modelName;

  // 更新配置
  config.defaultModel = newModel;
  writeConfig(config);

  // 显示成功消息
  console.log(chalk.bold.cyan('\n✔ 默认模型已更新\n'));
  console.log(`  ${chalk.green('旧模型:')} ${chalk.white(oldModel)}`);
  console.log(`  ${chalk.green('新模型:')} ${chalk.white(newModel)}`);
  console.log(`  ${chalk.green('配置文件:')} ${chalk.gray('~/.yuangs.json')}`);
  console.log(chalk.gray('\n✅ 设置已生效，下次 AI 调用将使用新模型\n'));

  // 显示模型信息
  if (isSupportedModel(newModel)) {
    const meta = getModelMetadata(newModel);
    console.log(chalk.gray(`${meta.provider} - ${meta.description}\n`));
  }
}

/**
 * 重置为默认模型
 */
function resetDefaultModel(): void {
  const config = readConfig();
  const oldModel = config.defaultModel;
  const defaultModel = getDefaultModel();

  if (!oldModel) {
    console.log(chalk.yellow('\n⚠️  当前未设置默认模型，使用系统默认\n'));
    console.log(`  ${chalk.green('系统默认:')} ${chalk.white(defaultModel)}\n`);
    return;
  }

  // 删除 defaultModel 字段
  delete config.defaultModel;
  writeConfig(config);

  // 显示成功消息
  console.log(chalk.bold.cyan('\n✔ 默认模型已重置\n'));
  console.log(`  ${chalk.green('旧模型:')} ${chalk.white(oldModel)}`);
  console.log(`  ${chalk.green('新模型:')} ${chalk.white(defaultModel)} (系统默认)`);
  console.log(`  ${chalk.green('配置文件:')} ${chalk.gray('~/.yuangs.json')}`);
  console.log(chalk.gray('\n✅ 设置已生效，下次 AI 调用将使用系统默认模型\n'));
}
