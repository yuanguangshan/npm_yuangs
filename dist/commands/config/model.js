"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleModelCommand = handleModelCommand;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const chalk_1 = __importDefault(require("chalk"));
const modelRegistry_1 = require("./modelRegistry");
const validation_1 = require("../../core/validation");
const CONFIG_FILE = path_1.default.join(os_1.default.homedir(), '.yuangs.json');
/**
 * 读取并验证配置文件
 */
function readConfig() {
    if (fs_1.default.existsSync(CONFIG_FILE)) {
        try {
            return (0, validation_1.parseUserConfig)(fs_1.default.readFileSync(CONFIG_FILE, 'utf8'));
        }
        catch (e) {
            // 配置文件解析失败时返回空配置
            return {};
        }
    }
    return {};
}
/**
 * 写入配置文件
 */
function writeConfig(config) {
    try {
        // 确保写入前通过 schema 验证
        const validated = validation_1.userConfigSchema.parse(config);
        fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(validated, null, 2));
    }
    catch (e) {
        console.log(chalk_1.default.red(`\n❌ 配置验证失败: ${e.message}\n`));
        throw e;
    }
}
/**
 * 处理模型管理命令
 */
function handleModelCommand(action, modelName) {
    // 如果没有 action 或 action 是 get，显示当前模型
    if (!action || action === 'get') {
        showCurrentModel();
        return;
    }
    // 如果 action 是 list，列出所有模型
    if (action === 'list') {
        console.log((0, modelRegistry_1.listAvailableModels)());
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
    console.log(chalk_1.default.red(`\n❌ 未知操作: ${action}`));
    console.log(chalk_1.default.gray('\n可用操作: get, list, set, reset\n'));
    console.log(chalk_1.default.gray('示例:'));
    console.log(chalk_1.default.gray('  yuangs config model get           # 查看当前模型'));
    console.log(chalk_1.default.gray('  yuangs config model list          # 列出所有模型'));
    console.log(chalk_1.default.gray('  yuangs config model set gpt-4o    # 设置模型'));
    console.log(chalk_1.default.gray('  yuangs config model reset         # 重置为默认\n'));
}
/**
 * 显示当前默认模型
 */
function showCurrentModel() {
    const config = readConfig();
    const currentModel = config.defaultModel || (0, modelRegistry_1.getDefaultModel)();
    console.log(chalk_1.default.bold.cyan('\n🤖 当前默认模型\n'));
    console.log(`  ${chalk_1.default.green('Model:')} ${chalk_1.default.white(currentModel)}`);
    if ((0, modelRegistry_1.isSupportedModel)(currentModel)) {
        const meta = (0, modelRegistry_1.getModelMetadata)(currentModel);
        console.log(`  ${chalk_1.default.green('Provider:')} ${chalk_1.default.white(meta.provider)}`);
        console.log(`  ${chalk_1.default.green('Description:')} ${chalk_1.default.gray(meta.description)}`);
        if (meta.recommended) {
            console.log(`  ${chalk_1.default.green('⭐ 推荐')}`);
        }
    }
    console.log(`  ${chalk_1.default.green('Source:')} ${chalk_1.default.gray('~/.yuangs.json')}\n`);
}
/**
 * 设置默认模型
 */
function setDefaultModel(modelName) {
    if (!modelName) {
        console.log(chalk_1.default.red('\n❌ 请提供模型名称\n'));
        console.log(chalk_1.default.gray('用法: yuangs config model set <model-name>\n'));
        console.log(chalk_1.default.gray('示例: yuangs config model set gemini-2.5-flash\n'));
        console.log((0, modelRegistry_1.listAvailableModels)());
        return;
    }
    // 检查模型是否支持
    if (!(0, modelRegistry_1.isSupportedModel)(modelName)) {
        console.log(chalk_1.default.red(`\n❌ 不支持的模型: ${modelName}\n`));
        console.log((0, modelRegistry_1.listAvailableModels)());
        console.log(chalk_1.default.yellow('\n💡 提示: 如果您确认该模型可用，可以手动编辑 ~/.yuangs.json\n'));
        return;
    }
    const config = readConfig();
    const oldModel = config.defaultModel || (0, modelRegistry_1.getDefaultModel)();
    const newModel = modelName;
    // 更新配置
    config.defaultModel = newModel;
    writeConfig(config);
    // 显示成功消息
    console.log(chalk_1.default.bold.cyan('\n✔ 默认模型已更新\n'));
    console.log(`  ${chalk_1.default.green('旧模型:')} ${chalk_1.default.white(oldModel)}`);
    console.log(`  ${chalk_1.default.green('新模型:')} ${chalk_1.default.white(newModel)}`);
    console.log(`  ${chalk_1.default.green('配置文件:')} ${chalk_1.default.gray('~/.yuangs.json')}`);
    console.log(chalk_1.default.gray('\n✅ 设置已生效，下次 AI 调用将使用新模型\n'));
    // 显示模型信息
    if ((0, modelRegistry_1.isSupportedModel)(newModel)) {
        const meta = (0, modelRegistry_1.getModelMetadata)(newModel);
        console.log(chalk_1.default.gray(`${meta.provider} - ${meta.description}\n`));
    }
}
/**
 * 重置为默认模型
 */
function resetDefaultModel() {
    const config = readConfig();
    const oldModel = config.defaultModel;
    const defaultModel = (0, modelRegistry_1.getDefaultModel)();
    if (!oldModel) {
        console.log(chalk_1.default.yellow('\n⚠️  当前未设置默认模型，使用系统默认\n'));
        console.log(`  ${chalk_1.default.green('系统默认:')} ${chalk_1.default.white(defaultModel)}\n`);
        return;
    }
    // 删除 defaultModel 字段
    delete config.defaultModel;
    writeConfig(config);
    // 显示成功消息
    console.log(chalk_1.default.bold.cyan('\n✔ 默认模型已重置\n'));
    console.log(`  ${chalk_1.default.green('旧模型:')} ${chalk_1.default.white(oldModel)}`);
    console.log(`  ${chalk_1.default.green('新模型:')} ${chalk_1.default.white(defaultModel)} (系统默认)`);
    console.log(`  ${chalk_1.default.green('配置文件:')} ${chalk_1.default.gray('~/.yuangs.json')}`);
    console.log(chalk_1.default.gray('\n✅ 设置已生效，下次 AI 调用将使用系统默认模型\n'));
}
//# sourceMappingURL=model.js.map