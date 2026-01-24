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

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 事务状态
 */
export enum TransactionState {
  /** 未开始 */
  IDLE = 'idle',
  /** 进行中 */
  ACTIVE = 'active',
  /** 已提交 */
  COMMITTED = 'committed',
  /** 已回滚 */
  ROLLED_BACK = 'rolled_back'
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
export class AtomicTransactionManager {
  private transactions: Map<string, TransactionMetadata> = new Map();
  private snapshotBaseDir: string;

  constructor(snapshotBaseDir: string = '.yuangs/snapshots') {
    this.snapshotBaseDir = snapshotBaseDir;
  }

  /**
   * 生成唯一事务 ID
   */
  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 开启多文件组合事务
   *
   * @param taskName - 任务名称
   * @param files - 涉及的文件列表
   * @returns 事务 ID
   */
  async startBatch(taskName: string, files: string[]): Promise<string> {
    const transactionId = this.generateTransactionId();
    const snapshotDir = path.join(this.snapshotBaseDir, transactionId);

    console.log(`\n[Atomic] 🔒 Starting transaction "${taskName}" (${files.length} files)`);
    console.log(`[Atomic] Transaction ID: ${transactionId}`);

    await fs.mkdir(snapshotDir, { recursive: true });

    for (const file of files) {
      await this.createSnapshot(file, snapshotDir);
    }

    const metadata: TransactionMetadata = {
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
  private async createSnapshot(filePath: string, snapshotDir: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(process.cwd(), filePath);
      const snapshotPath = path.join(snapshotDir, relativePath);

      await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
      await fs.writeFile(snapshotPath, content, 'utf-8');
    } catch (error) {
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
  async commitBatch(transactionId: string): Promise<CommitResult> {
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
    } catch (error) {
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
  async abortBatch(transactionId: string): Promise<void> {
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
  private async rollbackAll(snapshotDir: string): Promise<void> {
    const snapshotFiles = await this.listSnapshotFiles(snapshotDir);

    for (const snapshotPath of snapshotFiles) {
      try {
        const content = await fs.readFile(snapshotPath, 'utf-8');
        const relativePath = path.relative(snapshotDir, snapshotPath);
        const originalPath = path.join(process.cwd(), relativePath);

        await fs.mkdir(path.dirname(originalPath), { recursive: true });
        await fs.writeFile(originalPath, content, 'utf-8');
      } catch (error) {
        console.warn(`[Atomic] Failed to restore ${snapshotPath}: ${error}`);
      }
    }

    await this.clearSnapshots(snapshotDir);
  }

  /**
   * 清理快照目录
   */
  private async clearSnapshots(snapshotDir: string): Promise<void> {
    try {
      await fs.rm(snapshotDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[Atomic] Failed to clear snapshots ${snapshotDir}: ${error}`);
    }
  }

  /**
   * 列出快照目录中的所有文件
   */
  private async listSnapshotFiles(snapshotDir: string): Promise<string[]> {
    const files: string[] = [];

    async function walk(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    }

    try {
      await walk(snapshotDir);
    } catch (error) {
      console.warn(`[Atomic] Failed to list snapshot files: ${error}`);
    }

    return files;
  }

  /**
   * 获取事务状态
   */
  getTransactionState(transactionId: string): TransactionState | null {
    const transaction = this.transactions.get(transactionId);
    return transaction ? transaction.state : null;
  }

  /**
   * 清理所有已完成的事务
   */
  async cleanupCompletedTransactions(): Promise<void> {
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
  getActiveTransactions(): TransactionMetadata[] {
    return Array.from(this.transactions.values())
      .filter(t => t.state === TransactionState.ACTIVE);
  }

  /**
   * 设置快照基础目录
   */
  setSnapshotBaseDir(dir: string): void {
    this.snapshotBaseDir = dir;
  }
}
