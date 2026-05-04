import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export interface BackupRef {
  filePath: string;
  method: 'stash' | 'snapshot';
  ref: string; // stash ref or backup file path
  timestamp: number;
}

const BACKUP_DIR = path.join(process.cwd(), '.yuangs-backup');
const MAX_BACKUP_AGE_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * 文件修改前备份管理器
 * 使用 git stash 或文件快照实现写入前备份，支持回滚
 */
export class BackupManager {
  /**
   * 在执行 write_file / append_file / code_diff 前调用
   * 自动保存文件当前状态，返回备份引用
   */
  static async beforeWrite(filePath: string): Promise<BackupRef | null> {
    try {
      const absPath = path.resolve(filePath);

      // 文件不存在，无需备份
      try {
        await fs.stat(absPath);
      } catch {
        return null;
      }

      // 尝试 git stash 方案
      if (await this.isGitRepo()) {
        return this.backupViaStash(absPath);
      }

      // 降级：文件快照
      return this.backupViaSnapshot(absPath);
    } catch (error: any) {
      console.warn(`[BackupManager] 备份失败 (${filePath}): ${error.message}`);
      return null;
    }
  }

  /**
   * 回滚到备份状态
   */
  static async rollback(backup: BackupRef): Promise<boolean> {
    try {
      switch (backup.method) {
        case 'stash':
          return this.rollbackViaStash(backup.ref);
        case 'snapshot':
          return this.rollbackViaSnapshot(backup.ref, backup.filePath);
        default:
          return false;
      }
    } catch (error: any) {
      console.warn(`[BackupManager] 回滚失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 清理过期的备份文件
   */
  static async cleanup(): Promise<void> {
    try {
      await fs.rm(BACKUP_DIR, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }

  // --- Private ---

  private static async isGitRepo(): Promise<boolean> {
    try {
      await execAsync('git rev-parse --git-dir', { maxBuffer: 1024 * 1024 });
      return true;
    } catch {
      return false;
    }
  }

  private static async backupViaStash(absPath: string): Promise<BackupRef | null> {
    try {
      // 检查文件是否有未暂存的修改
      const { stdout } = await execAsync(`git diff --name-only -- "${absPath}"`, { maxBuffer: 1024 * 1024 });
      if (!stdout.trim()) {
        // 文件已暂存或无修改，用 snapshot 降级
        return null;
      }

      const message = `yuangs-backup-${Date.now()}`;
      await execAsync(`git stash push -m "${message}" -- "${absPath}"`, { maxBuffer: 1024 * 1024 });

      // 获取最新的 stash ref
      const { stdout: stashRef } = await execAsync('git stash list --format="%H" -1', { maxBuffer: 1024 * 1024 });

      return {
        filePath: absPath,
        method: 'stash',
        ref: stashRef.trim(),
        timestamp: Date.now(),
      };
    } catch {
      // git stash 失败，降级到 snapshot
      return this.backupViaSnapshot(absPath);
    }
  }

  private static async rollbackViaStash(stashRef: string): Promise<boolean> {
    try {
      // 查找并恢复对应的 stash
      await execAsync(`git stash pop "${stashRef}"`, { maxBuffer: 1024 * 1024 });
      return true;
    } catch {
      // 尝试 drop
      try {
        await execAsync(`git stash drop "${stashRef}"`, { maxBuffer: 1024 * 1024 });
      } catch {
        // ignore
      }
      return false;
    }
  }

  private static async backupViaSnapshot(absPath: string): Promise<BackupRef> {
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    const safeName = absPath.replace(/[^a-zA-Z0-9]/g, '_');
    const backupFile = path.join(BACKUP_DIR, `${safeName}.${Date.now()}.bak`);

    await fs.copyFile(absPath, backupFile);

    return {
      filePath: absPath,
      method: 'snapshot',
      ref: backupFile,
      timestamp: Date.now(),
    };
  }

  private static async rollbackViaSnapshot(backupPath: string, originalPath?: string): Promise<boolean> {
    try {
      if (!originalPath) return false;
      const content = await fs.readFile(backupPath, 'utf-8');
      await fs.writeFile(originalPath, content, 'utf-8');
      await fs.rm(backupPath, { force: true });
      return true;
    } catch {
      return false;
    }
  }
}
