/**
 * 会话级短期缓存。
 * 适用于 Git 检测、文件存在性检查等短期内不变的 I/O 结果。
 */
export class SessionCache<T> {
  private cache = new Map<string, { value: T; expiry: number }>();
  private ttl: number;

  constructor(ttlMs: number = 5 * 60 * 1000) {
    this.ttl = ttlMs;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.cache.set(key, { value, expiry: Date.now() + this.ttl });
  }

  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  get size(): number {
    return this.cache.size;
  }
}
