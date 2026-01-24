"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtomicTransactionManager = exports.TransactionState = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * 事务状态
 */
var TransactionState;
(function (TransactionState) {
    /** 未开始 */
    TransactionState["IDLE"] = "idle";
    /** 进行中 */
    TransactionState["ACTIVE"] = "active";
    /** 已提交 */
    TransactionState["COMMITTED"] = "committed";
    /** 已回滚 */
    TransactionState["ROLLED_BACK"] = "rolled_back";
})(TransactionState || (exports.TransactionState = TransactionState = {}));
/**
 * 原子事务管理器
 *
 * 管理多文件修改的原子性，确保要么全部成功，要么全部回滚
 */
class AtomicTransactionManager {
    transactions = new Map();
    snapshotBaseDir;
    constructor(snapshotBaseDir = '.yuangs/snapshots') {
        this.snapshotBaseDir = snapshotBaseDir;
    }
    /**
     * 生成唯一事务 ID
     */
    generateTransactionId() {
        return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 开启多文件组合事务
     *
     * @param taskName - 任务名称
     * @param files - 涉及的文件列表
     * @returns 事务 ID
     */
    async startBatch(taskName, files) {
        const transactionId = this.generateTransactionId();
        const snapshotDir = path.join(this.snapshotBaseDir, transactionId);
        console.log(`\n[Atomic] 🔒 Starting transaction "${taskName}" (${files.length} files)`);
        console.log(`[Atomic] Transaction ID: ${transactionId}`);
        await fs.mkdir(snapshotDir, { recursive: true });
        for (const file of files) {
            await this.createSnapshot(file, snapshotDir);
        }
        const metadata = {
            id: transactionId,
            name: taskName,
            files,
            state: TransactionState.ACTIVE,
            createdAt: new Date(),
            snapshotDir
        };
        this.transactions.set(transactionId, metadata);
        console.log(`[Atomic] ✅ Snapshots created for ${files.length} files\n`);
        return transactionId;
    }
    /**
     * 为单个文件创建快照
     */
    async createSnapshot(filePath, snapshotDir) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const relativePath = path.relative(process.cwd(), filePath);
            const snapshotPath = path.join(snapshotDir, relativePath);
            await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
            await fs.writeFile(snapshotPath, content, 'utf-8');
        }
        catch (error) {
            console.warn(`[Atomic] Failed to create snapshot for ${filePath}: ${error}`);
            throw error;
        }
    }
    /**
     * 提交事务
     *
     * @param transactionId - 事务 ID
     * @returns 提交结果
     */
    async commitBatch(transactionId) {
        const transaction = this.transactions.get(transactionId);
        if (!transaction) {
            return {
                success: false,
                filesCommitted: 0,
                error: `Transaction ${transactionId} not found`
            };
        }
        if (transaction.state !== TransactionState.ACTIVE) {
            return {
                success: false,
                filesCommitted: 0,
                error: `Transaction ${transactionId} is not in active state`
            };
        }
        try {
            await this.clearSnapshots(transaction.snapshotDir);
            transaction.state = TransactionState.COMMITTED;
            console.log(`[Atomic] ✅ Transaction "${transaction.name}" committed successfully\n`);
            return {
                success: true,
                filesCommitted: transaction.files.length
            };
        }
        catch (error) {
            return {
                success: false,
                filesCommitted: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * 回滚事务
     *
     * @param transactionId - 事务 ID
     */
    async abortBatch(transactionId) {
        const transaction = this.transactions.get(transactionId);
        if (!transaction) {
            console.warn(`[Atomic] Transaction ${transactionId} not found`);
            return;
        }
        console.warn(`\n[Atomic] ⚠️ Aborting transaction "${transaction.name}"...`);
        await this.rollbackAll(transaction.snapshotDir);
        transaction.state = TransactionState.ROLLED_BACK;
        console.log(`[Atomic] ✅ Transaction rolled back successfully\n`);
    }
    /**
     * 全盘回退到快照状态
     */
    async rollbackAll(snapshotDir) {
        const snapshotFiles = await this.listSnapshotFiles(snapshotDir);
        for (const snapshotPath of snapshotFiles) {
            try {
                const content = await fs.readFile(snapshotPath, 'utf-8');
                const relativePath = path.relative(snapshotDir, snapshotPath);
                const originalPath = path.join(process.cwd(), relativePath);
                await fs.mkdir(path.dirname(originalPath), { recursive: true });
                await fs.writeFile(originalPath, content, 'utf-8');
            }
            catch (error) {
                console.warn(`[Atomic] Failed to restore ${snapshotPath}: ${error}`);
            }
        }
        await this.clearSnapshots(snapshotDir);
    }
    /**
     * 清理快照目录
     */
    async clearSnapshots(snapshotDir) {
        try {
            await fs.rm(snapshotDir, { recursive: true, force: true });
        }
        catch (error) {
            console.warn(`[Atomic] Failed to clear snapshots ${snapshotDir}: ${error}`);
        }
    }
    /**
     * 列出快照目录中的所有文件
     */
    async listSnapshotFiles(snapshotDir) {
        const files = [];
        async function walk(dir) {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await walk(fullPath);
                }
                else if (entry.isFile()) {
                    files.push(fullPath);
                }
            }
        }
        try {
            await walk(snapshotDir);
        }
        catch (error) {
            console.warn(`[Atomic] Failed to list snapshot files: ${error}`);
        }
        return files;
    }
    /**
     * 获取事务状态
     */
    getTransactionState(transactionId) {
        const transaction = this.transactions.get(transactionId);
        return transaction ? transaction.state : null;
    }
    /**
     * 清理所有已完成的事务
     */
    async cleanupCompletedTransactions() {
        const completedTransactions = Array.from(this.transactions.values())
            .filter(t => t.state === TransactionState.COMMITTED || t.state === TransactionState.ROLLED_BACK);
        for (const transaction of completedTransactions) {
            this.transactions.delete(transaction.id);
        }
        console.log(`[Atomic] 🧹 Cleaned up ${completedTransactions.length} completed transactions`);
    }
    /**
     * 获取活跃事务列表
     */
    getActiveTransactions() {
        return Array.from(this.transactions.values())
            .filter(t => t.state === TransactionState.ACTIVE);
    }
    /**
     * 设置快照基础目录
     */
    setSnapshotBaseDir(dir) {
        this.snapshotBaseDir = dir;
    }
}
exports.AtomicTransactionManager = AtomicTransactionManager;
//# sourceMappingURL=AtomicTransactionManager.js.map