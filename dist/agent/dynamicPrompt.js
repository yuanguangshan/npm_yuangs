"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectGitContext = detectGitContext;
exports.detectTechStack = detectTechStack;
exports.generateTechStackGuidance = generateTechStackGuidance;
exports.generateErrorRecovery = generateErrorRecovery;
exports.detectOS = detectOS;
exports.buildDynamicContext = buildDynamicContext;
exports.injectDynamicContext = injectDynamicContext;
const fs = __importStar(require("fs/promises"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * 缓存检测结果，避免重复IO操作
 */
let cachedGitContext = null;
let cachedTechStack = null;
let lastCheckTimestamp = 0;
const CACHE_TTL = 5000; // 5秒缓存
/**
 * 检测Git上下文（增强版，支持子目录检测）
 */
async function detectGitContext() {
    // 使用git命令检测，支持在项目子目录中运行
    try {
        const { stdout } = await execAsync('git rev-parse --is-inside-work-tree', {
            cwd: process.cwd(),
            timeout: 2000
        });
        if (stdout.trim() === 'true') {
            return `
[GIT CONTEXT]
当前目录在一个Git仓库中。
- 优先使用 \`git ls-files\` 列出文件（遵守.gitignore）
- 使用 \`git diff\` 查看未提交的更改
- 使用 \`git log\` 查看最近历史
- 谨慎操作版本控制文件
`;
        }
    }
    catch {
        // git命令失败，回退到文件系统检测
        try {
            await fs.access('.git');
            return `
[GIT CONTEXT]
当前目录是一个Git仓库。
- 优先使用 \`git ls-files\` 列出文件（遵守.gitignore）
- 使用 \`git diff\` 查看未提交的更改
- 使用 \`git log\` 查看最近历史
- 谨慎操作版本控制文件
`;
        }
        catch {
            return null;
        }
    }
    return null;
}
/**
 * 检测技术栈（使用Promise.all并发检测，提升性能）
 */
async function detectTechStack() {
    const filesToCheck = [
        { file: 'package.json', stack: 'Node.js' },
        { file: 'Cargo.toml', stack: 'Rust' },
        { file: 'go.mod', stack: 'Go' },
        { file: 'requirements.txt', stack: 'Python' },
        { file: 'pom.xml', stack: 'Java/Maven' },
        { file: 'build.gradle', stack: 'Java/Gradle' },
        { file: 'Gemfile', stack: 'Ruby' },
        { file: 'composer.json', stack: 'PHP' },
        { file: 'Dockerfile', stack: 'Docker' },
    ];
    // 并发检测所有文件，提升性能
    const results = await Promise.all(filesToCheck.map(async ({ file, stack }) => {
        try {
            await fs.access(file);
            return stack;
        }
        catch {
            return null;
        }
    }));
    // 过滤掉null值并去重
    return results.filter((stack) => stack !== null);
}
/**
 * 生成技术栈指导
 */
function generateTechStackGuidance(stacks) {
    if (stacks.length === 0) {
        return '';
    }
    const guidance = [];
    if (stacks.includes('Node.js')) {
        guidance.push(`
[TECH STACK: Node.js]
- 使用 \`npm\` 或 \`yarn\` 进行包管理
- 检查 package.json 可用的脚本命令
- 生成代码时使用TypeScript严格模式
- 使用ESLint和Prettier进行代码格式化`);
    }
    if (stacks.includes('Python')) {
        guidance.push(`
[TECH STACK: Python]
- 使用 \`pip\` 或 \`poetry\` 进行包管理
- 检查 requirements.txt 或 pyproject.toml
- 遵循PEP 8代码风格指南
- 使用虚拟环境隔离依赖`);
    }
    if (stacks.includes('Go')) {
        guidance.push(`
[TECH STACK: Go]
- 使用 \`go mod\` 进行模块管理
- 检查 go.mod 文件了解依赖
- 遵循Go惯用模式和错误处理
- 使用 \`go test\` 运行测试`);
    }
    if (stacks.includes('Rust')) {
        guidance.push(`
[TECH STACK: Rust]
- 使用 \`cargo\` 进行包管理
- 检查 Cargo.toml 了解依赖
- 遵循Rust所有权和借用规则
- 使用 \`cargo clippy\` 进行代码检查`);
    }
    if (stacks.includes('Docker')) {
        guidance.push(`
[TECH STACK: Docker]
- 检查 Dockerfile 和 docker-compose.yml
- 容器化运行和测试命令
- 注意多阶段构建优化
- 管理容器网络和卷`);
    }
    return guidance.join('\n');
}
/**
 * 生成错误恢复指导
 */
function generateErrorRecovery(lastError) {
    return `
[ERROR RECOVERY]
上一步操作失败: ${lastError}
你必须尝试不同的方法或验证前置条件。

考虑以下选项:
- 检查命令语法是否正确
- 验证文件/路径是否存在
- 使用不同的标志或工具
- 检查依赖是否已安装
- 查看错误日志获取更多信息

如果仍然失败，切换到 "answer" 模式向用户说明问题`;
}
/**
 * 检测当前操作系统
 */
function detectOS() {
    const platform = process.platform;
    const release = os.release();
    if (platform === 'darwin') {
        return `
[SYSTEM OS] macOS (Darwin ${release}) - BSD 工具链
- 当前系统是 macOS，使用 BSD 风格的命令行工具
- GNU 工具的部分选项不可用（如 \`du -b\`、\`ls --color=auto\`、\`sed -i\` 不加扩展名等）
- 使用 \`du\` 时不要用 \`-b\` 参数（macOS 不支持），用 \`du -k\` 或 \`stat -f %z 文件名\` 获取文件大小
- 使用 \`stat -f "%z %N" 文件名\` 获取文件大小（不要用 GNU 的 \`stat -c\`）
- \`sed -i\` 需要跟空字符串参数：\`sed -i '' 's/old/new/g' 文件名\`
- 安装 GNU 工具可以用 \`brew install coreutils\`（前缀为 g，如 \`gdu\`、\`gsed\`）
- 网络工具：使用 \`curl\` 而非 \`wget\`（默认不安装 wget）
`;
    }
    else if (platform === 'linux') {
        return `
[SYSTEM OS] Linux - GNU 工具链
- 当前系统是 Linux，使用 GNU 风格的命令行工具
- 支持 GNU coreutils 的完整功能（如 \`du -b\`、\`stat -c\`、\`sed -i\` 等）
`;
    }
    else if (platform === 'win32') {
        return `
[SYSTEM OS] Windows
- 当前系统是 Windows
- 如果是 WSL，可以使用 Linux 命令
- 如果是 PowerShell，使用 Windows 风格的命令
`;
    }
    return '';
}
/**
 * 构建动态上下文
 */
async function buildDynamicContext(lastError, includeTechStack = true) {
    const context = {};
    // 检测操作系统（每次都必须注入）
    const osCtx = detectOS();
    if (osCtx) {
        context.osContext = osCtx;
    }
    // 检测Git上下文
    const gitContext = await detectGitContext();
    if (gitContext) {
        context.gitContext = gitContext;
    }
    // 检测技术栈
    if (includeTechStack) {
        const techStack = await detectTechStack();
        if (techStack.length > 0) {
            context.techStack = techStack;
        }
    }
    // 错误恢复
    if (lastError) {
        context.lastError = lastError;
        context.errorRecovery = generateErrorRecovery(lastError);
    }
    return context;
}
/**
 * 将动态上下文注入到Prompt
 */
function injectDynamicContext(basePrompt, context) {
    let prompt = basePrompt;
    // 注入操作系统信息（最重要，放在最前面）
    if (context.osContext) {
        prompt += `\n${context.osContext}`;
    }
    // 注入Git上下文
    if (context.gitContext) {
        prompt += `\n${context.gitContext}`;
    }
    // 注入技术栈指导
    if (context.techStack && context.techStack.length > 0) {
        const guidance = generateTechStackGuidance(context.techStack);
        prompt += `\n${guidance}`;
    }
    // 注入错误恢复
    if (context.errorRecovery) {
        prompt += `\n${context.errorRecovery}`;
    }
    return prompt;
}
//# sourceMappingURL=dynamicPrompt.js.map