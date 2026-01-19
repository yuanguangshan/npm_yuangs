import type { CompletionItem } from './types';

export class CompletionCache {
  private static instance: CompletionCache;
  private cache: Map<string, CompletionItem[]>;
  private timestamp: number;
  private readonly ttl: number = 5000;

  private constructor() {
    this.cache = new Map();
    this.timestamp = Date.now();
  }

  static getInstance(): CompletionCache {
    if (!CompletionCache.instance) {
      CompletionCache.instance = new CompletionCache();
    }
    return CompletionCache.instance;
  }

  get(key: string): CompletionItem[] | null {
    const now = Date.now();
    if (now - this.timestamp > this.ttl) {
      this.cache.clear();
      this.timestamp = now;
      return null;
    }
    return this.cache.get(key) || null;
  }

  set(key: string, items: CompletionItem[]): void {
    this.cache.set(key, items);
  }

  invalidate(): void {
    this.cache.clear();
    this.timestamp = 0;
  }

  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}
