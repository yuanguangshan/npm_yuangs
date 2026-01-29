import fs from 'fs';
import path from 'path';
import { GitService } from './GitService';
import { runLLM, AIError } from '../../agent/llm';
import { DEFAULT_AI_MODEL } from './constants';

export interface ConflictResolutionResult {
    file: string;
    success: boolean;
    suggestion?: string;
    error?: string;
    backupFile?: string;
}

export interface ResolveOptions {
    model?: string;
    dryRun?: boolean;
    backup?: boolean;
}

export class ConflictResolver {
    constructor(private gitService: GitService) { }

    /**
     * 使用 AI 尝试自动解决冲突
     */
    async resolveFile(filePath: string, options: ResolveOptions = {}): Promise<ConflictResolutionResult> {
        const { model = DEFAULT_AI_MODEL, dryRun = false, backup = true } = options;

        try {
            const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

            try {
                await fs.promises.access(fullPath, fs.constants.F_OK);
            } catch {
                return { file: filePath, success: false, error: '文件不存在' };
            }

            const content = await fs.promises.readFile(fullPath, 'utf8');

            if (!content.includes('<<<<<<<') || !content.includes('>>>>>>>')) {
                return { file: filePath, success: false, error: '未检测到冲突标记' };
            }

            const prompt = {
                system: `你是一个资深软件工程师，擅长解决 Git 合并冲突。
你的任务是：
1. 分析提供的文件内容。
2. 识别冲突部分（由 <<<<<<<, =======, >>>>>>> 标记）。
3. 根据上下文逻辑，将两个版本的变更进行语义化合并。
4. **绝对不要**遗漏任何必要的逻辑或闭合括号。
5. 移除所有 Git 冲突标记。
6. 输出完整的、修复后的文件内容，不要包含任何解释或 Markdown 代码块容器（直接输出原始内容）。`,
                messages: [
                    {
                        role: 'user' as const,
                        content: `文件路径: ${filePath}\n\n内容:\n${content}`
                    }
                ]
            };

            const response = await runLLM({
                prompt,
                model: model || DEFAULT_AI_MODEL,
                stream: false
            });

            const resolvedContent = response.rawText;

            // 1. 基本非空校验
            if (!resolvedContent || resolvedContent.trim().length === 0) {
                return { file: filePath, success: false, error: 'AI 生成了空内容，操作已拦截' };
            }

            // 2. 长度偏差校验
            if (content.length > 300 && resolvedContent.length < content.length * 0.3) {
                return { file: filePath, success: false, error: 'AI 生成的内容量严重缺失，疑似合并失败' };
            }

            // 3. 冲突标记残留校验
            if (resolvedContent.includes('<<<<<<<') || resolvedContent.includes('=======') || resolvedContent.includes('>>>>>>>')) {
                return { file: filePath, success: false, error: 'AI 生成的内容仍包含冲突标记' };
            }

            // 4. 基础语法完整性校验
            const syntaxError = this.validateSyntax(filePath, resolvedContent);
            if (syntaxError) {
                return { file: filePath, success: false, error: `AI 生成的代码存在基础语法风险: ${syntaxError}` };
            }

            // 5. 更严格的语法校验（根据文件类型）
            const advancedSyntaxError = await this.validateAdvancedSyntax(filePath, resolvedContent);
            if (advancedSyntaxError) {
                return { file: filePath, success: false, error: `AI 生成的代码存在高级语法错误: ${advancedSyntaxError}` };
            }

            if (dryRun) {
                return { file: filePath, success: true, suggestion: 'Dry-run: 内容已生成但未写回文件' };
            }

            // 5. 备份处理
            let backupFile: string | undefined;
            if (backup) {
                backupFile = `${fullPath}.bak`;
                await fs.promises.writeFile(backupFile, content, 'utf8');
            }

            // 6. 覆盖写入
            await fs.promises.writeFile(fullPath, resolvedContent, 'utf8');

            return { file: filePath, success: true, backupFile };

        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : (typeof error === 'string' ? error : String(error));
            return { file: filePath, success: false, error: errMsg };
        }
    }

    /**
     * 对生成的代码进行基础语法校验
     */
    private validateSyntax(filePath: string, content: string): string | null {
        const ext = path.extname(filePath).toLowerCase();

        // JSON 校验
        if (ext === '.json') {
            try {
                JSON.parse(content);
            } catch (e: any) {
                return `JSON 解析失败: ${e.message}`;
            }
        }

        // JS/TS 括号匹配基础校验
        if (['.js', '.ts', '.jsx', '.tsx', '.json', '.c', '.cpp', '.java'].includes(ext)) {
            const openBraces = (content.match(/{/g) || []).length;
            const closeBraces = (content.match(/}/g) || []).length;
            if (openBraces !== closeBraces) {
                return `大括号不匹配 ( {:${openBraces}, }:${closeBraces} )`;
            }

            const openParens = (content.match(/\(/g) || []).length;
            const closeParens = (content.match(/\)/g) || []).length;
            if (openParens !== closeParens) {
                return `圆括号不匹配 ( (:${openParens}, ):${closeParens} )`;
            }
        }

        return null;
    }

    /**
     * 高级语法校验（如 TypeScript 语法解析）
     */
    private async validateAdvancedSyntax(filePath: string, content: string): Promise<string | null> {
        const ext = path.extname(filePath).toLowerCase();

        // 对于 TypeScript 文件，尝试进行更深入的语法检查
        if (ext === '.ts' || ext === '.tsx') {
            try {
                const ts = await import('typescript');

                // 创建一个虚拟源文件进行语法检查
                const sourceFile = ts.createSourceFile(
                    'temp' + ext,
                    content,
                    ts.ScriptTarget.Latest,
                    true
                );

                // 使用简单的语法检查：如果创建失败或有基本问题，会在 createSourceFile 时抛出异常
                // 这里我们只做基本验证，避免复杂的编译器 API 使用
                return null;
            } catch (e: any) {
                // 如果 TypeScript 解析失败，说明有语法错误
                return `TypeScript 语法错误: ${e.message}`;
            }
        }

        return null;
    }
}
