import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 缓存检测结果，避免重复IO操作
 */
let cachedGitContext: string | null = null;
let cachedTechStack: string[] | null = null;
let lastCheckTimestamp = 0;
const CACHE_TTL = 5000; // 5秒缓存

/**
 * 动态Prompt生成器
 * 根据运行时状态动态注入Prompt片段
 */

export interface DynamicContext {
  gitContext?: string;
  techStack?: string[];
  lastError?: string;
  errorRecovery?: string;
}

/**
 * 检测Git上下文（增强版，支持子目录检测）
 */
export async function detectGitContext(): Promise<string | null> {
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
  } catch {
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
    } catch {
      return null;
    }
  }
  
  return null;
}

/**
 * 检测技术栈（使用Promise.all并发检测，提升性能）
 */
export async function detectTechStack(): Promise<string[]> {
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
  const results = await Promise.all(
    filesToCheck.map(async ({ file, stack }) => {
      try {
        await fs.access(file);
        return stack;
      } catch {
        return null;
      }
    })
  );

  // 过滤掉null值并去重
  return results.filter((stack): stack is string => stack !== null);
}

/**
 * 生成技术栈指导
 */
export function generateTechStackGuidance(stacks: string[]): string {
  if (stacks.length === 0) {
    return '';
  }

  const guidance: string[] = [];

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
export function generateErrorRecovery(lastError: string): string {
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
 * 构建动态上下文
 */
export async function buildDynamicContext(
  lastError?: string,
  includeTechStack: boolean = true
): Promise<DynamicContext> {
  const context: DynamicContext = {};

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
export function injectDynamicContext(
  basePrompt: string,
  context: DynamicContext
): string {
  let prompt = basePrompt;

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
