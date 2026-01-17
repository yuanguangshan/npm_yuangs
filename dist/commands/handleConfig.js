"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleConfig = handleConfig;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const chalk_1 = __importDefault(require("chalk"));
const validation_1 = require("../core/validation");
const CONFIG_FILE = path_1.default.join(os_1.default.homedir(), '.yuangs.json');
function handleConfig(args) {
    const action = args[0]; // get, set, list
    if (!action || action === 'list') {
        const config = readConfig();
        console.log(chalk_1.default.bold.cyan('\n⚙️  当前配置 (~/.yuangs.json):\n'));
        if (Object.keys(config).length === 0) {
            console.log(chalk_1.default.gray('  (配置文件不存在或为空)'));
        }
        else {
            Object.entries(config).forEach(([key, value]) => {
                console.log(`  ${chalk_1.default.white(key)}: ${chalk_1.default.green(value)}`);
            });
        }
        console.log('\n使用方法:');
        console.log(chalk_1.default.gray('  yuangs config set <key> <value>'));
        console.log(chalk_1.default.gray('  yuangs config get <key>\n'));
        return;
    }
    if (action === 'set') {
        const key = args[1];
        const value = args[2];
        if (!key || !value) {
            console.log(chalk_1.default.red('错误: 请提供 key 和 value。例如: yuangs config set defaultModel gemini-2.5-flash-lite'));
            return;
        }
        const config = readConfig();
        config[key] = value;
        writeConfig(config);
        console.log(chalk_1.default.green(`✓ 已将 ${key} 设置为 ${value}`));
        return;
    }
    if (action === 'get') {
        const key = args[1];
        if (!key) {
            console.log(chalk_1.default.red('错误: 请提供 key。例如: yuangs config get defaultModel'));
            return;
        }
        const config = readConfig();
        if (config[key] !== undefined) {
            console.log(config[key]);
        }
        else {
            console.log(chalk_1.default.yellow(`配置项 ${key} 不存在`));
        }
        return;
    }
}
function readConfig() {
    if (fs_1.default.existsSync(CONFIG_FILE)) {
        try {
            return (0, validation_1.parseUserConfig)(fs_1.default.readFileSync(CONFIG_FILE, 'utf8'));
        }
        catch (e) {
            return {};
        }
    }
    return {};
}
function writeConfig(config) {
    const validated = validation_1.userConfigSchema.parse(config);
    fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(validated, null, 2));
}
//# sourceMappingURL=handleConfig.js.map