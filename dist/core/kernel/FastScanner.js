"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FastScanner = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
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
class FastScanner {
    ignoreDirs;
    ripgrepAvailable = null;
    scanStats = null;
    constructor(ignoreDirs = DEFAULT_IGNORE_DIRS) {
        this.ignoreDirs = new Set(ignoreDirs);
    }
    /**
     * 检查 ripgrep 是否可用
     */
    async checkRipgrepAvailable() {
        if (this.ripgrepAvailable !== null) {
            return this.ripgrepAvailable;
        }
        try {
            (0, child_process_1.execSync)('rg --version', { encoding: 'utf-8', stdio: 'pipe' });
            this.ripgrepAvailable = true;
            return true;
        }
        catch (error) {
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
    async findConsumerFiles(baseName, searchDir = '.') {
        const startTime = Date.now();
        const hasRipgrep = await this.checkRipgrepAvailable();
        let consumerFiles = [];
        if (hasRipgrep) {
            consumerFiles = await this.scanWithRipgrep(baseName, searchDir);
        }
        else {
            // Add spinner for fallback scan
            const spinner = (0, ora_1.default)(chalk_1.default.cyan('Fallback scanning (ripgrep unavailable)...')).start();
            consumerFiles = await this.fallbackScan(baseName, searchDir, spinner);
            if (this.scanStats) {
                const elapsed = ((Date.now() - this.scanStats.startTime) / 1000).toFixed(2);
                spinner.succeed(chalk_1.default.green(`Scan complete: ${this.scanStats.filesScanned} files, ${this.scanStats.directoriesProcessed} dirs in ${elapsed}s`));
            }
            else {
                spinner.succeed('Scan complete');
            }
            this.scanStats = null;
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
    async scanWithRipgrep(baseName, searchDir) {
        try {
            const ignoreArgs = Array.from(this.ignoreDirs).map(dir => `--glob '!${dir}'`).join(' ');
            // 修复：确保搜索目录正确，并添加更完整的导入模式
            const patterns = [
                `from ['\\"].*${this.escapeRegex(baseName)}['\\"]`,
                `import ['\\"].*${this.escapeRegex(baseName)}['\\"]`,
                `require\\(['\\"].*${this.escapeRegex(baseName)}['\\"]\\)`,
            ];
            const pattern = patterns.join('|');
            const cmd = `rg -l "${pattern}" ${ignoreArgs} --type ts --type js .`;
            const output = (0, child_process_1.execSync)(cmd, {
                encoding: 'utf-8',
                cwd: searchDir,
                stdio: 'pipe'
            });
            // 将相对路径转换为绝对路径
            const relativePaths = output.split('\n').filter(Boolean);
            return relativePaths.map(relPath => path.resolve(searchDir, relPath));
        }
        catch (error) {
            if (error.status === 1) {
                // ripgrep 找不到匹配项，返回空数组
                return [];
            }
            // 其他错误，尝试使用 fallback
            console.warn(`[FastScanner] ripgrep scan failed, using fallback: ${error.message}`);
            return [];
        }
    }
    /**
     * 回退到原生文件系统遍历
     */
    async fallbackScan(baseName, dir = '.', spinner = null, depth = 0) {
        const results = [];
        // Initialize stats on first call
        if (depth === 0) {
            this.scanStats = {
                filesScanned: 0,
                directoriesProcessed: 0,
                currentDirectory: dir,
                startTime: Date.now()
            };
        }
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (this.ignoreDirs.has(entry.name)) {
                        continue;
                    }
                    // Update stats before recursion
                    if (this.scanStats) {
                        this.scanStats.directoriesProcessed++;
                        this.scanStats.currentDirectory = fullPath;
                        // Update spinner periodically (every 5 directories)
                        if (spinner && this.scanStats.directoriesProcessed % 5 === 0) {
                            const elapsed = ((Date.now() - this.scanStats.startTime) / 1000).toFixed(1);
                            spinner.text = `Scanning: ${this.scanStats.filesScanned} files, ${this.scanStats.directoriesProcessed} dirs\n` +
                                `Current: ${path.basename(fullPath)} (${elapsed}s)`;
                        }
                    }
                    const subResults = await this.fallbackScan(baseName, fullPath, spinner, depth + 1);
                    results.push(...subResults);
                }
                else if (this.isSourceFile(entry.name)) {
                    // Update file count
                    if (this.scanStats) {
                        this.scanStats.filesScanned++;
                        // Update spinner periodically (every 20 files)
                        if (spinner && this.scanStats.filesScanned % 20 === 0) {
                            const elapsed = ((Date.now() - this.scanStats.startTime) / 1000).toFixed(1);
                            spinner.text = `Scanning: ${this.scanStats.filesScanned} files, ${this.scanStats.directoriesProcessed} dirs\n` +
                                `Current: ${path.basename(dir)} (${elapsed}s)`;
                        }
                    }
                    const content = await fs.readFile(fullPath, 'utf-8');
                    if (this.containsModuleImport(content, baseName)) {
                        results.push(fullPath);
                    }
                }
            }
        }
        catch (error) {
            console.warn(`[FastScanner] Failed to scan directory ${dir}: ${error}`);
        }
        // Final update when recursion unwinds to root
        if (depth === 0 && spinner && this.scanStats) {
            const elapsed = ((Date.now() - this.scanStats.startTime) / 1000).toFixed(2);
            spinner.text = `Complete: ${this.scanStats.filesScanned} files, ${this.scanStats.directoriesProcessed} dirs (${elapsed}s)`;
        }
        return results;
    }
    /**
     * 判断文件是否为源文件
     */
    isSourceFile(filename) {
        const ext = path.extname(filename).toLowerCase();
        return ['.ts', '.js', '.tsx', '.jsx'].includes(ext);
    }
    /**
     * 检查代码是否包含对指定模块的导入
     */
    containsModuleImport(content, baseName) {
        const importPatterns = [
            // import 语句的各种形式
            `from './${baseName}`,
            `from "./${baseName}`,
            `from '../${baseName}`,
            `from "../${baseName}`,
            `from './${baseName}.ts`,
            `from "./${baseName}.ts`,
            `from './${baseName}.js`,
            `from "./${baseName}.js`,
            `from './${baseName}'`,
            `from "./${baseName}"`,
            `import './${baseName}`,
            `import "./${baseName}`,
            `import '../${baseName}`,
            `import "../${baseName}`,
            `import './${baseName}.ts`,
            `import "./${baseName}.ts`,
            `import './${baseName}.js`,
            `import "./${baseName}.js`,
            `import './${baseName}'`,
            `import "./${baseName}"`,
            // require 语句
            `require('./${baseName}`,
            `require("./${baseName}`,
            `require('../${baseName}`,
            `require("../${baseName}`,
            `require('./${baseName}.ts`,
            `require("./${baseName}.ts`,
            `require('./${baseName}.js`,
            `require("./${baseName}.js`,
            `require('./${baseName}')`,
            `require("./${baseName}")`,
        ];
        return importPatterns.some(pattern => content.includes(pattern));
    }
    /**
     * 转义正则表达式特殊字符
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    /**
     * 设置忽略目录
     */
    setIgnoreDirs(dirs) {
        this.ignoreDirs = new Set(dirs);
    }
    /**
     * 添加忽略目录
     */
    addIgnoreDir(dir) {
        this.ignoreDirs.add(dir);
    }
    /**
     * 移除忽略目录
     */
    removeIgnoreDir(dir) {
        this.ignoreDirs.delete(dir);
    }
}
exports.FastScanner = FastScanner;
//# sourceMappingURL=FastScanner.js.map