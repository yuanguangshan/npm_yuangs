import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * 统一存储接口
 */
export interface Storage<T> {
  read(): T | null;
  write(data: T): void;
  delete(): void;
  exists(): boolean;
}

/**
 * 基于文件的存储实现，支持原子写入
 */
export class FileStorage<T> implements Storage<T> {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /** 便捷方法：在 ~/.yuangs/ 下创建存储 */
  static forYuangs<T>(relativePath: string): FileStorage<T> {
    const dir = path.join(os.homedir(), '.yuangs');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return new FileStorage<T>(path.join(dir, relativePath));
  }

  read(): T | null {
    try {
      if (!fs.existsSync(this.filePath)) return null;
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  write(data: T): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const tmpPath = `${this.filePath}.tmp`;
    const raw = JSON.stringify(data, null, 2);

    // 原子写入：先写 .tmp，再 rename
    fs.writeFileSync(tmpPath, raw, 'utf-8');
    fs.renameSync(tmpPath, this.filePath);
  }

  delete(): void {
    try {
      fs.rmSync(this.filePath, { force: true });
      fs.rmSync(`${this.filePath}.tmp`, { force: true });
    } catch {
      // ignore
    }
  }

  exists(): boolean {
    return fs.existsSync(this.filePath);
  }
}
