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
 * 快速扫描器
 *
 * 使用 ripgrep 进行极速搜索，不可用时自动回退到原生遍历
 */
export declare class FastScanner {
    private ignoreDirs;
    private ripgrepAvailable;
    private scanStats;
    constructor(ignoreDirs?: string[]);
    /**
     * 检查 ripgrep 是否可用
     */
    private checkRipgrepAvailable;
    /**
     * 查找引用指定模块的文件
     *
     * @param baseName - 模块名称（不含扩展名）
     * @param searchDir - 搜索目录（默认为当前目录）
     * @returns 扫描结果
     */
    findConsumerFiles(baseName: string, searchDir?: string): Promise<ScanResult>;
    /**
     * 使用 ripgrep 进行快速扫描
     */
    private scanWithRipgrep;
    /**
     * 回退到原生文件系统遍历
     */
    private fallbackScan;
    /**
     * 判断文件是否为源文件
     */
    private isSourceFile;
    /**
     * 检查代码是否包含对指定模块的导入
     */
    private containsModuleImport;
    /**
     * 转义正则表达式特殊字符
     */
    private escapeRegex;
    /**
     * 设置忽略目录
     */
    setIgnoreDirs(dirs: string[]): void;
    /**
     * 添加忽略目录
     */
    addIgnoreDir(dir: string): void;
    /**
     * 移除忽略目录
     */
    removeIgnoreDir(dir: string): void;
}
