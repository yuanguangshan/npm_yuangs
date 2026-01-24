/**
 * Atomic Transaction Manager for X-Resolver
 *
 * 原子事务管理器 - 确保多文件修改的原子性
 *
 * 核心功能：
 * 1. 开启多文件组合事务
 * 2. 为事务中的文件创建快照
 * 3. 验证并提交事务
 * 4. 失败时全盘回退
 */
/**
 * 事务状态
 */
export declare enum TransactionState {
    /** 未开始 */
    IDLE = "idle",
    /** 进行中 */
    ACTIVE = "active",
    /** 已提交 */
    COMMITTED = "committed",
    /** 已回滚 */
    ROLLED_BACK = "rolled_back"
}
/**
 * 事务元数据
 */
export interface TransactionMetadata {
    /** 事务 ID */
    id: string;
    /** 事务名称 */
    name: string;
    /** 涉及的文件列表 */
    files: string[];
    /** 事务状态 */
    state: TransactionState;
    /** 创建时间 */
    createdAt: Date;
    /** 快照目录路径 */
    snapshotDir: string;
}
/**
 * 事务提交结果
 */
export interface CommitResult {
    /** 是否成功 */
    success: boolean;
    /** 提交的文件数量 */
    filesCommitted: number;
    /** 错误信息（如果失败） */
    error?: string;
}
/**
 * 原子事务管理器
 *
 * 管理多文件修改的原子性，确保要么全部成功，要么全部回滚
 */
export declare class AtomicTransactionManager {
    private transactions;
    private snapshotBaseDir;
    constructor(snapshotBaseDir?: string);
    /**
     * 生成唯一事务 ID
     */
    private generateTransactionId;
    /**
     * 开启多文件组合事务
     *
     * @param taskName - 任务名称
     * @param files - 涉及的文件列表
     * @returns 事务 ID
     */
    startBatch(taskName: string, files: string[]): Promise<string>;
    /**
     * 为单个文件创建快照
     */
    private createSnapshot;
    /**
     * 提交事务
     *
     * @param transactionId - 事务 ID
     * @returns 提交结果
     */
    commitBatch(transactionId: string): Promise<CommitResult>;
    /**
     * 回滚事务
     *
     * @param transactionId - 事务 ID
     */
    abortBatch(transactionId: string): Promise<void>;
    /**
     * 全盘回退到快照状态
     */
    private rollbackAll;
    /**
     * 清理快照目录
     */
    private clearSnapshots;
    /**
     * 列出快照目录中的所有文件
     */
    private listSnapshotFiles;
    /**
     * 获取事务状态
     */
    getTransactionState(transactionId: string): TransactionState | null;
    /**
     * 清理所有已完成的事务
     */
    cleanupCompletedTransactions(): Promise<void>;
    /**
     * 获取活跃事务列表
     */
    getActiveTransactions(): TransactionMetadata[];
    /**
     * 设置快照基础目录
     */
    setSnapshotBaseDir(dir: string): void;
}
