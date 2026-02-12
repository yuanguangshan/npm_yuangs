import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { GitService } from './GitService';
import { ContextMeta, ContextMetaBuilder, toAuditLog } from '../context/ContextMeta';
import { EnhancedASTParser } from '../kernel/ASTParser';
import pLimit from 'p-limit';

/**
 * 收集到的项目上下文接口
 */
export interface GatheredContext {
    fileTree: string;
    packageJson?: any;
    relevantFiles: { path: string; content: string }[];
    summary: string;
    meta: ContextMeta;
}

/**
 * 项目上下文采集器
 * 负责为 LLM 提供项目现状的真实快照
 */
export class ContextGatherer {
    private MAX_FILE_CONTENT_LENGTH = 10000; // 单个文件读取上限
    private MAX_TOTAL_CONTEXT_LENGTH = 50000; // 总上限
    private SUMMARY_THRESHOLD = 200; // P2: 改为200行，避免过度摘要
    private astParser: EnhancedASTParser; // Reuse AST parser instance

    constructor(private gitService: GitService) {
        // Initialize AST parser for semantic summarization (created once to avoid performance issues)
        this.astParser = new EnhancedASTParser();
    }

    /**
     * 采集项目上下文
     * @param taskDescription 当前任务描述，用于启发式搜索相关文件
     */
    async gather(taskDescription: string): Promise<GatheredContext> {
        const repoRoot = await this.gitService.getRepoRoot();
        const fileTree = await this.getFileTree(repoRoot);

        const metaBuilder = new ContextMetaBuilder();
        metaBuilder.setProvenance('ContextGatherer', 'git:files');

        const isDocTask = /docs?\/|\.md$|\.html$|文章|章节|文档/.test(taskDescription.toLowerCase());

        const packageJson = isDocTask ? undefined : await this.getPackageJson(repoRoot);
        const relevantFiles = await this.getRelevantFiles(taskDescription, repoRoot, fileTree, isDocTask, packageJson);

        let confidence = 0.5;
        const confidenceReasons: string[] = [];

        if (packageJson) {
            confidence += 0.2;
            confidenceReasons.push('Has package.json');
        }

        if (relevantFiles.length > 0) {
            confidence += 0.2;
            confidenceReasons.push(`Found ${relevantFiles.length} relevant files`);
        }

        if (fileTree.length > 0 && !fileTree.includes('无法获取完整文件树')) {
            confidence += 0.1;
            confidenceReasons.push('Successfully retrieved file tree');
        }

        const droppedItems: string[] = [];
        const totalFiles = fileTree.split('\n').filter(Boolean).length;
        if (totalFiles > 150) {
            droppedItems.push(`${totalFiles - 150} files from file tree (truncated)`);
            confidence -= 0.05;
            confidenceReasons.push('File tree truncated');
        }

        if (droppedItems.length > 0) {
            metaBuilder.setClipped('Context size limit exceeded', droppedItems);
        }

        confidence = Math.max(0, Math.min(1, confidence));
        metaBuilder.setConfidence(confidence, confidenceReasons.join('; ') || 'Default confidence');

        const meta = metaBuilder.build();

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
            summary,
            meta,
        };
    }

    /**
     * 获取文件树 (git 管理的文件)
     */
    private async getFileTree(cwd: string): Promise<string> {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            
            // 明确指定执行目录
            const { stdout } = await execAsync('git ls-files', { cwd });
            let files = stdout.split('\n').filter(Boolean);

            // 全局黑名单过滤：屏蔽所有二进制和媒体类噪音文件
            const noiseExtension = /\.(png|jpe?g|gif|svg|ico|pdf|zip|tar|gz|exe|dll|so|bin|pyc|woff2?|ttf|eot)$/i;
            files = files.filter((f: string) => !noiseExtension.test(f));
            
            if (files.length > 150) {
                return files.slice(0, 150).join('\n') + `\n... (为了保护 Token 空间，已截断其余 ${files.length - 150} 个文件)`;
            }
            return files.join('\n');
        } catch (e: any) {
            console.error(`[ContextGatherer] 无法获取文件树: ${e.message}`);
            return '无法获取完整文件树';
        }
    }

    /**
     * 读取 package.json
     */
    private async getPackageJson(repoRoot: string): Promise<any> {
        const pPath = path.join(repoRoot, 'package.json');
        try {
            if (fsSync.existsSync(pPath)) {
                return JSON.parse(fsSync.readFileSync(pPath, 'utf8'));
            }
        } catch (e) {
            return undefined;
        }
    }

    /**
     * 根据任务描述寻找相关文件
     */
    private async getRelevantFiles(
        description: string,
        repoRoot: string,
        fileList: string,
        isDocTask: boolean,
        packageJson?: any
    ): Promise<{ path: string; content: string }[]> {
        const results: { path: string; content: string }[] = [];
        let allFiles = fileList.split('\n');

        if (isDocTask) {
            // 针对文档任务，优先筛选文档相关文件
            allFiles = allFiles.filter(f =>
                f.startsWith('docs/') ||
                f.endsWith('.md') ||
                f.endsWith('.yaml') ||
                f.endsWith('.txt') ||
                f.endsWith('.rst') ||
                f.endsWith('.adoc') ||
                f.endsWith('.html')
            );
        }

        const words = description.replace(/`/g, ' ').match(/[a-zA-Z0-9_.\-\/]+/g) || [];
        const potentialPaths = new Set<string>();

        // 1. 精准匹配：从描述中提取路径
        for (const word of words) {
            if (word.includes('.') || word.includes('/')) {
                // 尝试直接匹配或后缀匹配
                const match = allFiles.find(f => f === word || f.endsWith('/' + word) || f.endsWith(word));
                if (match) potentialPaths.add(match);
            }
        }

        // 2. 智能探测核心文件
        if (isDocTask) {
            // 尝试找 README.md 或 index.md (作为上下文基准)
            const globalDocs = ['README.md', 'docs/index.md'];
            globalDocs.forEach(f => { if (allFiles.includes(f)) potentialPaths.add(f); });

            // 如果发现了目标文件路径，也尝试加载它的 meta.yaml 或同级 index.md
            for (const p of Array.from(potentialPaths)) {
                const dir = path.dirname(p);
                const siblings = ['meta.yaml', 'index.md'].map(s => path.join(dir, s));
                siblings.forEach(s => { if (allFiles.includes(s)) potentialPaths.add(s); });
            }
        } else {
            // 从 package.json 中提取入口
            if (packageJson?.main) {
                const main = packageJson.main.replace(/^\.\//, '');
                if (allFiles.includes(main)) potentialPaths.add(main);
            }
            // 常规入口
            ['src/index.ts', 'src/main.ts', 'src/cli.ts'].forEach(f => {
                if (allFiles.includes(f)) potentialPaths.add(f);
            });
        }

        // P2: 3. 读取内容 (正确使用异步 I/O + 并发控制 + 原子长度计数)
        const limit = pLimit(5); // 限制并发数为 5
        const totalLength = { value: 0 }; // 使用对象实现原子计数器
        const readResults: (null | { path: string; content: string })[] = [];

        for (const filePath of potentialPaths) {
            // 如果已达到总长度限制，提前终止
            if (totalLength.value >= this.MAX_TOTAL_CONTEXT_LENGTH) {
                console.log(`[ContextGatherer] 达到总长度限制 (${this.MAX_TOTAL_CONTEXT_LENGTH})，停止读取更多文件`);
                break;
            }

            try {
                // 使用 limit 包裹任务，真正控制并发
                const result = await limit(async () => {
                    const fullPath = path.join(repoRoot, filePath);
                    
                    // 检查文件是否存在并获取信息
                    const stats = await fs.stat(fullPath);
                    if (!stats.isFile()) return null;

                    // 读取文件内容
                    let content = await fs.readFile(fullPath, 'utf8');

                    // 判断是否需要摘要
                    const isReferenceOnly = !description.includes(filePath);
                    const lineCount = content.split('\n').length;
                    const isTooLarge = lineCount > this.SUMMARY_THRESHOLD;
                    const isTSFile = filePath.endsWith('.ts') || filePath.endsWith('.tsx');

                    if (isReferenceOnly && isTooLarge && isTSFile) {
                        try {
                            content = this.astParser.generateSummary(filePath, content);
                            console.log(`[Economy] ✂️  Summarized ${filePath} (${lineCount} lines) to save tokens.`);
                        } catch (error) {
                            console.warn(`[ContextGatherer] 警告：摘要生成失败 "${filePath}": ${(error as Error).message}`);
                            content = content.substring(0, this.MAX_FILE_CONTENT_LENGTH) + '\n... (内容过长已截断，摘要生成失败)';
                        }
                    } else if (content.length > this.MAX_FILE_CONTENT_LENGTH) {
                        content = content.substring(0, this.MAX_FILE_CONTENT_LENGTH) + '\n... (内容过长已截断)';
                    }

                    // 原子地更新总长度
                    if (totalLength.value + content.length <= this.MAX_TOTAL_CONTEXT_LENGTH) {
                        totalLength.value += content.length;
                        return { path: filePath, content };
                    } else {
                        console.log(`[ContextGatherer] 跳过 ${filePath} (会超过总长度限制)`);
                        return null;
                    }
                });

                if (result) {
                    readResults.push(result);
                }
            } catch (e: any) {
                console.warn(`[ContextGatherer] 警告：无法读取相关上下文文件 "${filePath}": ${e.message}`);
            }
        }

        return readResults.filter((r): r is { path: string; content: string } => r !== null);
    }

    /**
     * 获取审计日志
     */
    getAuditLog(context: GatheredContext): string {
        return toAuditLog(context.meta);
    }
}