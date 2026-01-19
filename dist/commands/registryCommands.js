"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRegistryCommands = registerRegistryCommands;
const chalk_1 = __importDefault(require("chalk"));
const registryAPI_1 = require("../api/registryAPI");
let registryAPI = null;
function getRegistryAPI(storagePath) {
    if (!registryAPI) {
        registryAPI = new registryAPI_1.RegistryAPI(storagePath);
    }
    return registryAPI;
}
function registerRegistryCommands(program) {
    program
        .command('registry')
        .description('Macro Registry 管理命令')
        .argument('[action]', 'publish, get, list, approve, deprecate, risk, explain')
        .argument('[id]', 'Macro ID')
        .argument('[version]', 'Macro version')
        .action(async (action, id, version) => {
        if (!action) {
            console.log(chalk_1.default.yellow('请指定操作: publish, get, list, approve, deprecate, risk, explain'));
            return;
        }
        try {
            const api = getRegistryAPI();
            await api.initialize();
            switch (action) {
                case 'publish':
                    await handlePublish();
                    break;
                case 'get':
                    if (!id) {
                        console.log(chalk_1.default.red('请指定 Macro ID'));
                        return;
                    }
                    await handleGet(api, id, version);
                    break;
                case 'list':
                    await handleList(api);
                    break;
                case 'approve':
                    if (!id || !version) {
                        console.log(chalk_1.default.red('请指定 Macro ID 和版本'));
                        return;
                    }
                    await handleApprove(api, id, version);
                    break;
                case 'deprecate':
                    if (!id) {
                        console.log(chalk_1.default.red('请指定 Macro ID'));
                        return;
                    }
                    await handleDeprecate(api, id, version);
                    break;
                case 'risk':
                    if (!id) {
                        console.log(chalk_1.default.red('请指定 Macro ID'));
                        return;
                    }
                    await handleRisk(api, id, version);
                    break;
                case 'explain':
                    if (!id) {
                        console.log(chalk_1.default.red('请指定 Macro ID 或 capability'));
                        return;
                    }
                    await handleExplain(api, id);
                    break;
                default:
                    console.log(chalk_1.default.red(`未知操作: ${action}`));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red(`错误: ${error.message}`));
            if (error.code) {
                console.log(chalk_1.default.gray(`错误代码: ${error.code}`));
            }
        }
    });
}
async function handlePublish() {
    const readline = require('node:readline/promises').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    try {
        console.log(chalk_1.default.bold.cyan('\n📦 发布新 Macro\n'));
        const id = await readline.question(chalk_1.default.yellow('Macro ID: '));
        const version = await readline.question(chalk_1.default.yellow('Version: '));
        const description = await readline.question(chalk_1.default.yellow('Description: '));
        const author = await readline.question(chalk_1.default.yellow('Author: '));
        console.log(chalk_1.default.cyan('\n🔐 所需权限 (每行一个, 空行结束):'));
        const requires = [];
        while (true) {
            const cap = await readline.question('  ');
            if (!cap.trim())
                break;
            requires.push(cap.trim());
        }
        const tagsInput = await readline.question(chalk_1.default.yellow('Tags (用逗号分隔): '));
        const tags = tagsInput.split(',').map((t) => t.trim()).filter((t) => t);
        const api = getRegistryAPI();
        await api.initialize();
        const manifest = await api.publishMacro(id, version, description, requires, author, { autoApprove: false });
        console.log(chalk_1.default.bold.green('\n✅ Macro 发布成功!\n'));
        console.log(chalk_1.default.white(`ID: ${manifest.id}`));
        console.log(chalk_1.default.white(`Version: ${manifest.version}`));
        console.log(chalk_1.default.white(`State: ${manifest.state}`));
        console.log(chalk_1.default.white(`Checksum: ${manifest.checksum}`));
        if (manifest.state === 'draft') {
            console.log(chalk_1.default.yellow('\n⚠️  Macro 处于 draft 状态, 需要审批后才能使用'));
            console.log(chalk_1.default.gray(`运行: yuangs registry approve ${id} ${version}`));
        }
    }
    finally {
        readline.close();
    }
}
async function handleGet(api, id, version) {
    const manifest = await api.getMacro(id, version);
    if (!manifest) {
        console.log(chalk_1.default.red(`Macro ${id}${version ? `@${version}` : ''} 不存在`));
        return;
    }
    console.log(chalk_1.default.bold.cyan('\n📄 Macro 信息\n'));
    console.log(chalk_1.default.white(`ID: ${manifest.id}`));
    console.log(chalk_1.default.white(`Version: ${manifest.version}`));
    console.log(chalk_1.default.white(`State: ${formatState(manifest.state)}`));
    console.log(chalk_1.default.white(`Author: ${manifest.author}`));
    console.log(chalk_1.default.white(`Created: ${new Date(manifest.createdAt).toISOString()}`));
    console.log(chalk_1.default.white(`Description: ${manifest.description}`));
    console.log(chalk_1.default.cyan('\n🔐 所需权限:'));
    for (const cap of manifest.requires) {
        console.log(`  - ${chalk_1.default.white(cap)}`);
    }
    if (manifest.tags && manifest.tags.length > 0) {
        console.log(chalk_1.default.cyan('\n🏷️  Tags:'));
        console.log(`  ${manifest.tags.join(', ')}`);
    }
    console.log(chalk_1.default.gray(`\nChecksum: ${manifest.checksum}`));
}
async function handleList(api) {
    const manifests = await api.listMacros();
    if (manifests.length === 0) {
        console.log(chalk_1.default.yellow('没有找到任何 Macro'));
        return;
    }
    console.log(chalk_1.default.bold.cyan('\n📋 Macro 列表\n'));
    for (const manifest of manifests) {
        console.log(formatStateSymbol(manifest.state) + chalk_1.default.white(` ${manifest.id}@${manifest.version}`));
        console.log(chalk_1.default.gray(`  Author: ${manifest.author}`));
        console.log(chalk_1.default.gray(`  Created: ${new Date(manifest.createdAt).toLocaleDateString()}`));
        console.log(chalk_1.default.gray(`  ${manifest.description}\n`));
    }
    console.log(chalk_1.default.gray(`总计: ${manifests.length} 个 Macro\n`));
}
async function handleApprove(api, id, version) {
    const manifest = await api.approveMacro(id, version, process.env.USER || 'cli-user');
    console.log(chalk_1.default.bold.green('\n✅ Macro 审批通过!\n'));
    console.log(chalk_1.default.white(`ID: ${manifest.id}`));
    console.log(chalk_1.default.white(`Version: ${manifest.version}`));
    console.log(chalk_1.default.white(`State: ${manifest.state}`));
    console.log(chalk_1.default.gray(`Approved by: ${process.env.USER || 'cli-user'}`));
}
async function handleDeprecate(api, id, version) {
    const manifest = await api.deprecateMacro(id, version);
    console.log(chalk_1.default.bold.yellow('\n⚠️  Macro 已弃用\n'));
    console.log(chalk_1.default.white(`ID: ${manifest.id}`));
    console.log(chalk_1.default.white(`Version: ${manifest.version}`));
    console.log(chalk_1.default.white(`State: ${manifest.state}`));
}
async function handleRisk(api, id, version) {
    const assessment = await api.assessMacroRisk(id, version);
    if (!assessment) {
        console.log(chalk_1.default.red(`Macro ${id}${version ? `@${version}` : ''} 不存在`));
        return;
    }
    console.log(chalk_1.default.bold.cyan('\n⚠️  风险评估\n'));
    const riskColor = assessment.overallRisk === 'low' ? chalk_1.default.green :
        assessment.overallRisk === 'medium' ? chalk_1.default.yellow : chalk_1.default.red;
    console.log(riskColor(`总体风险: ${assessment.overallRisk.toUpperCase()}`));
    console.log(chalk_1.default.white(`风险评分: ${assessment.score}/10`));
    console.log(chalk_1.default.white(`需要审批: ${assessment.requiresApproval ? '是' : '否'}`));
    if (assessment.factors.length > 0) {
        console.log(chalk_1.default.cyan('\n风险因素:'));
        for (const factor of assessment.factors) {
            const factorColor = factor.severity === 'low' ? chalk_1.default.green :
                factor.severity === 'medium' ? chalk_1.default.yellow : chalk_1.default.red;
            console.log(`  [${factorColor(factor.severity.toUpperCase())}] ${factor.description}`);
            if (factor.suggestion) {
                console.log(chalk_1.default.gray(`    → ${factor.suggestion}`));
            }
        }
    }
    console.log(chalk_1.default.cyan('\n详细解释:'));
    console.log(assessment.explanation);
}
async function handleExplain(api, id) {
    try {
        const manifest = await api.getMacro(id);
        if (manifest) {
            const assessment = await api.assessMacroRisk(id);
            if (assessment) {
                console.log(assessment.explanation);
                return;
            }
        }
        const explanation = await api.explainCapability(id);
        console.log(explanation);
    }
    catch (error) {
        console.error(chalk_1.default.red(`错误: ${error.message}`));
    }
}
function formatState(state) {
    switch (state) {
        case 'draft':
            return chalk_1.default.yellow('draft');
        case 'approved':
            return chalk_1.default.green('approved');
        case 'deprecated':
            return chalk_1.default.red('deprecated');
        default:
            return state;
    }
}
function formatStateSymbol(state) {
    switch (state) {
        case 'draft':
            return chalk_1.default.yellow('📝');
        case 'approved':
            return chalk_1.default.green('✅');
        case 'deprecated':
            return chalk_1.default.red('⚠️ ');
        default:
            return '•';
    }
}
//# sourceMappingURL=registryCommands.js.map