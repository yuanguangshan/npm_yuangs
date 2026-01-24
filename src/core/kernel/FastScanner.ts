/**
 * Fast Scanner for X-Resolver
 *
 * 快速扫描器，使用 ripgrep 进行极速文件搜索
 * 如果 ripgrep 不可用，则回退到原生 Node.js 文件系统遍历
 *
 * 主要功能：
 * - 查找引用指定文件/模块的其他文件
 * - 支持多种导入语法（相对路径、绝对路径、别名）
 * - 智能排除 node_modules 和其他无关目录
 */

import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import ora, { Ora } from 'ora';

/**
 * 扫描结果
 */
export interface ScanResult {
  /** 发现的消费者文件路径列表 */
  consumerFiles: string[];
  /** 是否使用了 ripgrep */
  usedRipgrep: boolean;
  /** 扫描耗时（毫秒） */
  duration: number;
}

/**
 * 默认忽略的目录
 */
const DEFAULT_IGNORE_DIRS = [
  'node_modules',
  '.git',
  '.yuangs',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  'target',
  'bin',
  'obj'
];

/**
 * 快速扫描器
 *
 * 使用 ripgrep 进行极速搜索，不可用时自动回退到原生遍历
 */
 export class FastScanner {
  private ignoreDirs: Set<string>;
  private ripgrepAvailable: boolean | null = null;
  private scanStats: {
    filesScanned: number;
    directoriesProcessed: number;
    currentDirectory: string;
    startTime: number;
  } | null = null;

  constructor(ignoreDirs: string[] = DEFAULT_IGNORE_DIRS) {
    this.ignoreDirs = new Set(ignoreDirs);
  }

  /**
   * 检查 ripgrep 是否可用
   */
  private async checkRipgrepAvailable(): Promise<boolean> {
    if (this.ripgrepAvailable !== null) {
      return this.ripgrepAvailable;
    }

    try {
      execSync('rg --version', { encoding: 'utf-8', stdio: 'pipe' });
      this.ripgrepAvailable = true;
      return true;
    } catch (error) {
      this.ripgrepAvailable = false;
      return false;
    }
  }

  /**
   * 查找引用指定模块的文件
   *
   * @param baseName - 模块名称（不含扩展名）
   * @param searchDir - 搜索目录（默认为当前目录）
   * @returns 扫描结果
   */
  async findConsumerFiles(baseName: string, searchDir: string = '.'): Promise<ScanResult> {
    const startTime = Date.now();

    const hasRipgrep = await this.checkRipgrepAvailable();
    let consumerFiles: string[] = [];

    if (hasRipgrep) {
      consumerFiles = await this.scanWithRipgrep(baseName, searchDir);
    } else {
      consumerFiles = await this.fallbackScan(baseName, searchDir);
    }

    const duration = Date.now() - startTime;

    return {
      consumerFiles,
      usedRipgrep: hasRipgrep,
      duration
    };
  }

  /**
   * 使用 ripgrep 进行快速扫描
   */
  private async scanWithRipgrep(baseName: string, searchDir: string): Promise<string[]> {
    try {
      const ignoreArgs = Array.from(this.ignoreDirs).map(dir => `--glob '!${dir}'`).join(' ');

      const cmd = `rg -l "from ['\\"].*${this.escapeRegex(baseName)}['\\"]" ${ignoreArgs} --type ts --type js --type tsx --type jsx`;
      const output = execSync(cmd, {
        encoding: 'utf-8',
        cwd: searchDir,
        stdio: 'pipe'
      });

      return output.split('\n').filter(Boolean);
    } catch (error: any) {
      if (error.status === 1) {
        return [];
      }
      throw error;
    }
  }

  /**
   * 回退到原生文件系统遍历
   */
  private async fallbackScan(baseName: string, dir: string = '.'): Promise<string[]> {
    const results: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (this.ignoreDirs.has(entry.name)) {
            continue;
          }

          const subResults = await this.fallbackScan(baseName, fullPath);
          results.push(...subResults);
        } else if (this.isSourceFile(entry.name)) {
          const content = await fs.readFile(fullPath, 'utf-8');

          if (this.containsModuleImport(content, baseName)) {
            results.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`[FastScanner] Failed to scan directory ${dir}: ${error}`);
    }

    return results;
  }

  /**
   * 判断文件是否为源文件
   */
  private isSourceFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return ['.ts', '.js', '.tsx', '.jsx'].includes(ext);
  }

  /**
   * 检查代码是否包含对指定模块的导入
   */
  private containsModuleImport(content: string, baseName: string): boolean {
    const importPatterns = [
      `from './${baseName}`,
      `from "./${baseName}`,
      `from '../${baseName}`,
      `from "../${baseName}`,
      `from './${baseName}.ts`,
      `from "./${baseName}.ts`,
      `from './${baseName}.js`,
      `from "./${baseName}.js`,
      `import '${baseName}'`,
      `import "${baseName}"`,
      `require('./${baseName}`,
      `require("./${baseName}`,
    ];

    return importPatterns.some(pattern => content.includes(pattern));
  }

  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 设置忽略目录
   */
  setIgnoreDirs(dirs: string[]): void {
    this.ignoreDirs = new Set(dirs);
  }

  /**
   * 添加忽略目录
   */
  addIgnoreDir(dir: string): void {
    this.ignoreDirs.add(dir);
  }

  /**
   * 移除忽略目录
   */
  removeIgnoreDir(dir: string): void {
    this.ignoreDirs.delete(dir);
  }
}
