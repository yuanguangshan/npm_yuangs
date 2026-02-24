import { ProposedAction, ToolExecutionResult } from './state';
import { CapabilityLevel } from '../core/capability/CapabilityLevel';
/**
 * 增强的工具执行器
 * 支持丰富的原子工具操作
 * 集成能力感知的工具调用
 */
export declare class ToolExecutor {
    private static readonly MAX_OUTPUT_LENGTH;
    private static readonly READ_POSITIONS;
    private static currentCapabilityLevel;
    /**
     * 设置当前能力等级
     */
    static setCapabilityLevel(level: CapabilityLevel): void;
    /**
     * 获取当前能力等级
     */
    static getCapabilityLevel(): CapabilityLevel;
    /**
     * 检查工具是否可以被当前能力等级执行
     */
    static checkToolCapability(toolName: string): {
        allowed: boolean;
        required?: CapabilityLevel;
        current?: CapabilityLevel;
    };
    /**
     * 获取指定能力等级下可用的工具列表
     */
    static getAvailableTools(): string[];
    /**
     * 获取能力等级的可读名称
     */
    private static getCapabilityName;
    /**
     * 智能截断输出
     * 当输出过长时，返回特殊标记和继续读取的提示
     */
    private static maybeTruncate;
    static execute(action: ProposedAction): Promise<ToolExecutionResult>;
    private static executeAction;
    private static executeTool;
    private static toolReadFile;
    private static toolWriteFile;
    private static toolListFiles;
    private static getFiles;
    private static executeShell;
    private static executeDiff;
    /**
     * 读取文件的指定行范围
     */
    private static toolReadFileLines;
    /**
     * 向文件末尾追加内容
     */
    private static toolAppendFile;
    /**
     * 生成目录结构的树形展示
     */
    private static toolListDirectoryTree;
    private static buildDirectoryTree;
    /**
     * 在文件中搜索指定内容（类似 grep）
     */
    private static toolSearchInFiles;
    /**
     * 搜索代码符号（函数、类、变量等）
     * 使用 grep 进行简化搜索
     */
    private static toolSearchSymbol;
    /**
     * 分析文件的依赖关系（import/require）
     */
    private static toolAnalyzeDependencies;
    /**
     * Git 状态
     */
    private static toolGitStatus;
    /**
     * Git 差异
     */
    private static toolGitDiff;
    /**
     * Git 日志
     */
    private static toolGitLog;
    /**
     * 继续读取之前被截断的文件内容
     */
    private static toolContinueReading;
    /**
     * 获取文件元信息
     */
    private static toolFileInfo;
    /**
     * 格式化字节数
     */
    private static formatBytes;
}
