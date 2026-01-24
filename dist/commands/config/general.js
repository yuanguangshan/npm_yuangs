"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGeneralConfigCommand = handleGeneralConfigCommand;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const chalk_1 = __importDefault(require("chalk"));
const validation_1 = require("../../core/validation");
const CONFIG_FILE = path_1.default.join(os_1.default.homedir(), '.yuangs.json');
/**
 * 读取并验证配置
 */
function readConfig() {
    if (fs_1.default.existsSync(CONFIG_FILE)) {
        try {
            return (0, validation_1.parseUserConfig)(fs_1.default.readFileSync(CONFIG_FILE, 'utf8'));
        }
        catch (e) {
            console.log(chalk_1.default.yellow(`\n⚠️  配置文件解析失败: ${e.message}\n`));
            return {};
        }
    }
    return {};
}
/**
 * 写入配置
 */
function writeConfig(config) {
    try {
        const validated = validation_1.userConfigSchema.parse(config);
        fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(validated, null, 2));
    }
    catch (e) {
        console.log(chalk_1.default.red(`\n❌ 配置验证失败: ${e.message}\n`));
        throw e;
    }
}
/**
 * 处理通用配置命令
 */
function handleGeneralConfigCommand(action, key, value) {
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
    console.log(chalk_1.default.red(`\n❌ 未知操作: ${action}\n`));
    console.log(chalk_1.default.gray('可用操作: list, get, set\n'));
    console.log(chalk_1.default.gray('示例:'));
    console.log(chalk_1.default.gray('  yuangs config list              # 列出所有配置'));
    console.log(chalk_1.default.gray('  yuangs config get defaultModel  # 读取配置项'));
    console.log(chalk_1.default.gray('  yuangs config set aiProxyUrl https://...  # 设置配置项\n'));
}
/**
 * 列出所有配置项
 */
function listConfig() {
    const config = readConfig();
    console.log(chalk_1.default.bold.cyan('\n⚙️  当前配置 (~/.yuangs.json)\n'));
    if (Object.keys(config).length === 0) {
        console.log(chalk_1.default.gray('  (配置文件不存在或为空)\n'));
        return;
    }
    // 分组显示配置
    const groups = {
        'AI 配置': [],
        '账户配置': [],
        '上下文配置': [],
        '其他配置': []
    };
    for (const [key, value] of Object.entries(config)) {
        if (key === 'defaultModel' || key === 'aiProxyUrl') {
            groups['AI 配置'].push({ key, value });
        }
        else if (key === 'accountType') {
            groups['账户配置'].push({ key, value });
        }
        else if (key === 'contextWindow' || key === 'maxFileTokens' || key === 'maxTotalTokens') {
            groups['上下文配置'].push({ key, value });
        }
        else {
            groups['其他配置'].push({ key, value });
        }
    }
    for (const [groupName, items] of Object.entries(groups)) {
        if (items.length === 0)
            continue;
        console.log(chalk_1.default.yellow(`${groupName}:`));
        for (const item of items) {
            const displayValue = typeof item.value === 'object'
                ? JSON.stringify(item.value)
                : String(item.value);
            console.log(`  ${chalk_1.default.white(item.key)}: ${chalk_1.default.green(displayValue)}`);
        }
        console.log('');
    }
}
/**
 * 读取配置项
 */
function getConfigValue(key) {
    if (!key) {
        console.log(chalk_1.default.red('\n❌ 请提供配置项名称\n'));
        console.log(chalk_1.default.gray('用法: yuangs config get <key>\n'));
        console.log(chalk_1.default.gray('示例: yuangs config get defaultModel\n'));
        console.log(chalk_1.default.gray('常用配置项:'));
        console.log(chalk_1.default.gray('  - defaultModel: 默认 AI 模型'));
        console.log(chalk_1.default.gray('  - aiProxyUrl: API 代理地址'));
        console.log(chalk_1.default.gray('  - accountType: 账户类型 (free/pro/paid)'));
        console.log(chalk_1.default.gray('  - contextWindow: 上下文窗口大小'));
        console.log('');
        return;
    }
    const config = readConfig();
    const value = config[key];
    if (value === undefined) {
        console.log(chalk_1.default.yellow(`\n⚠️  配置项 "${key}" 不存在\n`));
        console.log(chalk_1.default.gray('使用 "yuangs config list" 查看所有配置项\n'));
        return;
    }
    console.log(`${value}`);
}
/**
 * 设置配置项
 */
function setConfigValue(key, value) {
    if (!key || !value) {
        console.log(chalk_1.default.red('\n❌ 请提供配置项名称和值\n'));
        console.log(chalk_1.default.gray('用法: yuangs config set <key> <value>\n'));
        console.log(chalk_1.default.gray('示例:'));
        console.log(chalk_1.default.gray('  yuangs config set defaultModel gemini-2.5-flash'));
        console.log(chalk_1.default.gray('  yuangs config set accountType paid'));
        console.log(chalk_1.default.gray('  yuangs config set contextWindow 8000\n'));
        return;
    }
    const config = readConfig();
    const oldValue = config[key];
    // 尝试解析值（处理数字、布尔值等）
    let parsedValue = value;
    try {
        // 尝试解析为 JSON
        parsedValue = JSON.parse(value);
    }
    catch {
        // 如果不是 JSON，保持原样
        parsedValue = value;
    }
    // 更新配置
    config[key] = parsedValue;
    try {
        writeConfig(config);
        console.log(chalk_1.default.bold.cyan('\n✔ 配置已更新\n'));
        console.log(`  ${chalk_1.default.green('配置项:')} ${chalk_1.default.white(key)}`);
        console.log(`  ${chalk_1.default.green('旧值:')} ${chalk_1.default.gray(oldValue !== undefined ? String(oldValue) : '(未设置)')}`);
        console.log(`  ${chalk_1.default.green('新值:')} ${chalk_1.default.white(String(parsedValue))}`);
        console.log(`  ${chalk_1.default.green('文件:')} ${chalk_1.default.gray('~/.yuangs.json')}`);
        console.log(chalk_1.default.gray('\n✅ 设置已立即生效\n'));
    }
    catch (e) {
        console.log(chalk_1.default.red(`\n❌ 配置更新失败: ${e.message}\n`));
    }
}
//# sourceMappingURL=general.js.map