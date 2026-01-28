import fs from 'fs';
import path from 'path';
import { GitService } from './GitService';

/**
 * 收集到的项目上下文接口
 */
export interface GatheredContext {
    fileTree: string;
    packageJson?: any;
    relevantFiles: { path: string; content: string }[];
    summary: string;
}

/**
 * 项目上下文采集器
 * 负责为 LLM 提供项目现状的真实快照
 */
export class ContextGatherer {
    private MAX_FILE_CONTENT_LENGTH = 10000; // 单个文件读取上限
    private MAX_TOTAL_CONTEXT_LENGTH = 50000; // 总上限

    constructor(private gitService: GitService) {}

    /**
     * 采集项目上下文
     * @param taskDescription 当前任务描述，用于启发式搜索相关文件
     */
    async gather(taskDescription: string): Promise<GatheredContext> {
        const [fileTree, repoRoot] = await Promise.all([
            this.getFileTree(),
            this.gitService.getRepoRoot()
        ]);

        const packageJson = await this.getPackageJson(repoRoot);
        const relevantFiles = await this.getRelevantFiles(taskDescription, repoRoot, fileTree);

        // 构建综合摘要
        let summary = `[项目文件树]\n${fileTree}\n\n`;
        
        if (packageJson) {
            const deps = packageJson.dependencies ? Object.keys(packageJson.dependencies).join(', ') : 'none';
            const devDeps = packageJson.devDependencies ? Object.keys(packageJson.devDependencies).join(', ') : 'none';
            summary += `[技术栈摘要]\n名称: ${packageJson.name}\n依赖: ${deps}\n测试/开发依赖: ${devDeps}\n\n`;
        }

        if (relevantFiles.length > 0) {
            summary += `[关键文件内容]\n`;
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
    private async getFileTree(): Promise<string> {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            
            // 获取所有被 git 跟踪的文件，限制深度减少噪音
            const { stdout } = await execAsync('git ls-files');
            const files = stdout.split('\n').filter(Boolean);
            
            if (files.length > 100) {
                // 如果文件太多，只展示目录结构或抽样
                return files.slice(0, 100).join('\n') + `\n... (总计 ${files.length} 个文件)`;
            }
            return files.join('\n');
        } catch {
            return '无法获取文件树';
        }
    }

    /**
     * 读取 package.json
     */
    private async getPackageJson(repoRoot: string): Promise<any> {
        const pPath = path.join(repoRoot, 'package.json');
        try {
            if (fs.existsSync(pPath)) {
                return JSON.parse(fs.readFileSync(pPath, 'utf8'));
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
        fileList: string
    ): Promise<{ path: string; content: string }[]> {
        const results: { path: string; content: string }[] = [];
        const allFiles = fileList.split('\n');
        
        // 1. 寻找显式提到的文件名
        const words = description.match(/[a-zA-Z0-9_.\-/]+/g) || [];
        const potentialPaths = new Set<string>();

        for (const word of words) {
            if (word.includes('.') || word.includes('/')) {
                // 如果单词看起来像路径，检查它是否在文件树中
                const match = allFiles.find(f => f.endsWith(word) || word.endsWith(f));
                if (match) potentialPaths.add(match);
            }
        }

        // 2. 默认添加一些极其重要的核心文件 (如果存在)
        const coreFiles = ['src/index.ts', 'src/main.ts', 'src/cli.ts', 'src/app.ts'];
        coreFiles.forEach(f => {
            if (allFiles.includes(f)) potentialPaths.add(f);
        });

        // 3. 读取内容 (带上限)
        let currentTotalLength = 0;
        for (const filePath of potentialPaths) {
            if (currentTotalLength > this.MAX_TOTAL_CONTEXT_LENGTH) break;

            const fullPath = path.join(repoRoot, filePath);
            try {
                if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                    let content = fs.readFileSync(fullPath, 'utf8');
                    if (content.length > this.MAX_FILE_CONTENT_LENGTH) {
                        content = content.substring(0, this.MAX_FILE_CONTENT_LENGTH) + '\n... (文件过长，已截断)';
                    }
                    results.push({ path: filePath, content });
                    currentTotalLength += content.length;
                }
            } catch {}
        }

        return results;
    }
}
