"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextGatherer = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * 项目上下文采集器
 * 负责为 LLM 提供项目现状的真实快照
 */
class ContextGatherer {
    gitService;
    MAX_FILE_CONTENT_LENGTH = 10000; // 单个文件读取上限
    MAX_TOTAL_CONTEXT_LENGTH = 50000; // 总上限
    constructor(gitService) {
        this.gitService = gitService;
    }
    /**
     * 采集项目上下文
     * @param taskDescription 当前任务描述，用于启发式搜索相关文件
     */
    async gather(taskDescription) {
        const repoRoot = await this.gitService.getRepoRoot();
        const fileTree = await this.getFileTree(repoRoot);
        // 领域探测：结合任务描述和文件后缀进行判定
        const isDocTask = /docs?\/|\.md$|\.html$|文章|章节|文档/.test(taskDescription.toLowerCase());
        const packageJson = isDocTask ? undefined : await this.getPackageJson(repoRoot);
        const relevantFiles = await this.getRelevantFiles(taskDescription, repoRoot, fileTree, isDocTask, packageJson);
        // 构建综合摘要
        let summary = `[项目文件树 (主要结构)]\n${fileTree}\n\n`;
        if (!isDocTask && packageJson) {
            const deps = packageJson.dependencies ? Object.keys(packageJson.dependencies).join(', ') : 'none';
            const devDeps = packageJson.devDependencies ? Object.keys(packageJson.devDependencies).join(', ') : 'none';
            summary += `[技术栈摘要]\n名称: ${packageJson.name}\n依赖: ${deps}\n测试/开发依赖: ${devDeps}\n\n`;
        }
        if (relevantFiles.length > 0) {
            summary += `[关键上下文文件内容]\n`;
            relevantFiles.forEach(file => {
                summary += `--- 文件: ${file.path} ---\n${file.content}\n\n`;
            });
        }
        return {
            fileTree,
            packageJson,
            relevantFiles,
            summary
        };
    }
    /**
     * 获取文件树 (git 管理的文件)
     */
    async getFileTree(cwd) {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            // 明确指定执行目录
            const { stdout } = await execAsync('git ls-files', { cwd });
            let files = stdout.split('\n').filter(Boolean);
            // 全局黑名单过滤：屏蔽所有二进制和媒体类噪音文件
            const noiseExtension = /\.(png|jpe?g|gif|svg|ico|pdf|zip|tar|gz|exe|dll|so|bin|pyc|woff2?|ttf|eot)$/i;
            files = files.filter((f) => !noiseExtension.test(f));
            if (files.length > 150) {
                return files.slice(0, 150).join('\n') + `\n... (为了保护 Token 空间，已截断其余 ${files.length - 150} 个文件)`;
            }
            return files.join('\n');
        }
        catch (e) {
            console.error(`[ContextGatherer] 无法获取文件树: ${e.message}`);
            return '无法获取完整文件树';
        }
    }
    /**
     * 读取 package.json
     */
    async getPackageJson(repoRoot) {
        const pPath = path_1.default.join(repoRoot, 'package.json');
        try {
            if (fs_1.default.existsSync(pPath)) {
                return JSON.parse(fs_1.default.readFileSync(pPath, 'utf8'));
            }
        }
        catch (e) {
            return undefined;
        }
    }
    /**
     * 根据任务描述寻找相关文件
     */
    async getRelevantFiles(description, repoRoot, fileList, isDocTask, packageJson) {
        const results = [];
        let allFiles = fileList.split('\n');
        if (isDocTask) {
            // 针对文档任务，优先筛选文档相关文件
            allFiles = allFiles.filter(f => f.startsWith('docs/') ||
                f.endsWith('.md') ||
                f.endsWith('.yaml') ||
                f.endsWith('.txt') ||
                f.endsWith('.rst') ||
                f.endsWith('.adoc') ||
                f.endsWith('.html'));
        }
        const words = description.replace(/`/g, ' ').match(/[a-zA-Z0-9_.\-\/]+/g) || [];
        const potentialPaths = new Set();
        // 1. 精准匹配：从描述中提取路径
        for (const word of words) {
            if (word.includes('.') || word.includes('/')) {
                // 尝试直接匹配或后缀匹配
                const match = allFiles.find(f => f === word || f.endsWith('/' + word) || f.endsWith(word));
                if (match)
                    potentialPaths.add(match);
            }
        }
        // 2. 智能探测核心文件
        if (isDocTask) {
            // 尝试找 README.md 或 index.md (作为上下文基准)
            const globalDocs = ['README.md', 'docs/index.md'];
            globalDocs.forEach(f => { if (allFiles.includes(f))
                potentialPaths.add(f); });
            // 如果发现了目标文件路径，也尝试加载它的 meta.yaml 或同级 index.md
            for (const p of Array.from(potentialPaths)) {
                const dir = path_1.default.dirname(p);
                const siblings = ['meta.yaml', 'index.md'].map(s => path_1.default.join(dir, s));
                siblings.forEach(s => { if (allFiles.includes(s))
                    potentialPaths.add(s); });
            }
        }
        else {
            // 从 package.json 中提取入口
            if (packageJson?.main) {
                const main = packageJson.main.replace(/^\.\//, '');
                if (allFiles.includes(main))
                    potentialPaths.add(main);
            }
            // 常规入口
            ['src/index.ts', 'src/main.ts', 'src/cli.ts'].forEach(f => {
                if (allFiles.includes(f))
                    potentialPaths.add(f);
            });
        }
        // 3. 读取内容 (带上限)
        let currentTotalLength = 0;
        for (const filePath of potentialPaths) {
            if (currentTotalLength > this.MAX_TOTAL_CONTEXT_LENGTH)
                break;
            const fullPath = path_1.default.join(repoRoot, filePath);
            try {
                if (fs_1.default.existsSync(fullPath) && fs_1.default.statSync(fullPath).isFile()) {
                    let content = fs_1.default.readFileSync(fullPath, 'utf8');
                    if (content.length > this.MAX_FILE_CONTENT_LENGTH) {
                        content = content.substring(0, this.MAX_FILE_CONTENT_LENGTH) + '\n... (内容过长已截断)';
                    }
                    results.push({ path: filePath, content });
                    currentTotalLength += content.length;
                }
            }
            catch (e) {
                console.warn(`[ContextGatherer] 警告：无法读取相关上下文文件 "${filePath}": ${e.message}`);
            }
        }
        return results;
    }
}
exports.ContextGatherer = ContextGatherer;
//# sourceMappingURL=ContextGatherer.js.map