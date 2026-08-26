import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

export interface CacheKey {
    filePath: string;
    contentHash: string;
    level: string;
    timestamp: number;
}

export interface CacheEntry {
    key: CacheKey;
    result: any;
    createdAt: number;
    accessedAt: number;
    accessCount: number;
}

export interface ReviewCacheConfig {
    maxSize: number;
    ttl: number;
    cleanupInterval: number;
}

const DEFAULT_CONFIG: ReviewCacheConfig = {
    maxSize: 100 * 1024 * 1024, // 100MB
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
    cleanupInterval: 60 * 60 * 1000, // 1 hour
};

export class ReviewCache {
    private cacheDir: string;
    private config: ReviewCacheConfig;
    private memoryCache: Map<string, CacheEntry> = new Map();
    private cleanupTimer?: NodeJS.Timeout;
    private readyPromise: Promise<void>;
    private isCleaning: boolean = false; // P0: 防止 cleanup 并发执行
    private pathToKeyMap: Map<string, Set<string>> = new Map(); // P0: 建立 filePath -> keys 映射

    constructor(config: Partial<ReviewCacheConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.cacheDir = path.join(os.homedir(), '.yuangs', 'cache', 'review');
        this.readyPromise = this.init();
    }

    private async init(): Promise<void> {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
            await this.loadIndex();
            this.startCleanupTimer();
        } catch (error) {
            console.warn('Failed to initialize review cache:', error);
        }
    }

    // P0: 统一使用 SHA256 替代 MD5
    private hashContent(content: string): string {
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    private getCacheKey(filePath: string, content: string, level: string, version: string = 'v1.0'): string {
        const contentHash = this.hashContent(content);
        const relativePath = path.relative(process.cwd(), filePath);
        // P1: 加入版本号作为缓存键的一部分，避免模型升级后误用旧缓存
        const keyData = `${relativePath}:${contentHash}:${level}:${version}`;
        return crypto.createHash('sha256').update(keyData).digest('hex');
    }

    async get(filePath: string, content: string, level: string, version: string = 'v1.0'): Promise<any | null> {
        try {
            // P0: 确保初始化完成
            await this.readyPromise;
            
            const key = this.getCacheKey(filePath, content, level, version);
            
            // Check memory cache first
            const memoryEntry = this.memoryCache.get(key);
            if (memoryEntry) {
                if (this.isExpired(memoryEntry)) {
                    this.memoryCache.delete(key);
                } else {
                    this.updateAccessStats(memoryEntry);
                    return memoryEntry.result;
                }
            }

            // Check disk cache
            const diskEntry = await this.getFromDisk(key);
            if (diskEntry && !this.isExpired(diskEntry)) {
                // Load into memory cache
                this.memoryCache.set(key, diskEntry);
                this.updateAccessStats(diskEntry);
                return diskEntry.result;
            }

            return null;
        } catch (error) {
            console.warn('Cache get operation failed:', error);
            return null;
        }
    }

    async set(filePath: string, content: string, level: string, result: any, version: string = 'v1.0'): Promise<void> {
        try {
            // P0: 确保初始化完成
            await this.readyPromise;
            
            const key = this.getCacheKey(filePath, content, level, version);
            const now = Date.now();
            
            const entry: CacheEntry = {
                key: {
                    filePath,
                    contentHash: this.hashContent(content), // P0: 统一使用 SHA256
                    level,
                    timestamp: now,
                },
                result,
                createdAt: now,
                accessedAt: now,
                accessCount: 1,
            };

            // Save to memory cache
            this.memoryCache.set(key, entry);

            // P0: 更新 pathToKeyMap
            if (!this.pathToKeyMap.has(filePath)) {
                this.pathToKeyMap.set(filePath, new Set());
            }
            this.pathToKeyMap.get(filePath)!.add(key);

            // Save to disk cache
            await this.saveToDisk(key, entry);

            // Check cache size limit
            await this.enforceSizeLimit();
        } catch (error) {
            console.warn('Cache set operation failed:', error);
        }
    }

    async invalidate(filePath: string): Promise<void> {
        try {
            // P0: 确保初始化完成
            await this.readyPromise;
            
            // P0: 使用 pathToKeyMap 精确匹配，而不是模糊匹配
            const keysToDelete = this.pathToKeyMap.get(filePath) || new Set();
            
            // Remove from memory cache
            for (const key of keysToDelete) {
                this.memoryCache.delete(key);
                this.pathToKeyMap.delete(filePath);
            }

            // Remove from disk cache - 使用完整的 key 而不是 pattern
            const deletePromises = Array.from(keysToDelete).map(key => 
                fs.unlink(path.join(this.cacheDir, `${key}.json`)).catch(() => {})
            );
            
            await Promise.all(deletePromises);
            
            // P0: 清理映射
            this.pathToKeyMap.delete(filePath);
            
            await this.saveIndex();
        } catch (error) {
            console.warn('Cache invalidation failed:', error);
        }
    }

    async clear(): Promise<void> {
        try {
            // P0: 确保初始化完成
            await this.readyPromise;
            
            this.memoryCache.clear();
            this.pathToKeyMap.clear();
            const files = await fs.readdir(this.cacheDir);
            await Promise.all(
                files.map(file => fs.unlink(path.join(this.cacheDir, file)).catch(() => {}))
            );
            await this.saveIndex();
        } catch (error) {
            console.warn('Cache clear failed:', error);
        }
    }

    async getStats(): Promise<{ memorySize: number; diskSize: number; diskCount: number; hitRate: number }> {
        // P0: 改为异步方法以计算真实磁盘大小
        const memorySize = this.memoryCache.size;
        let totalAccesses = 0;
        let hits = 0;

        for (const entry of this.memoryCache.values()) {
            totalAccesses += entry.accessCount;
            if (entry.accessCount > 1) {
                hits += entry.accessCount - 1;
            }
        }

        const hitRate = totalAccesses > 0 ? (hits / totalAccesses) * 100 : 0;

        // P0: 计算真实的磁盘使用量
        let diskSize = 0;
        let diskCount = 0;
        try {
            const files = await fs.readdir(this.cacheDir);
            for (const file of files) {
                if (file.endsWith('.json') && file !== 'index.json') {
                    const filePath = path.join(this.cacheDir, file);
                    const stats = await fs.stat(filePath);
                    diskSize += stats.size;
                    diskCount++;
                }
            }
        } catch (error) {
            // 忽略磁盘统计错误
        }

        return {
            memorySize,
            diskSize,
            diskCount,
            hitRate: Math.round(hitRate * 100) / 100,
        };
    }

    private isExpired(entry: CacheEntry): boolean {
        return Date.now() - entry.createdAt > this.config.ttl;
    }

    private updateAccessStats(entry: CacheEntry): void {
        entry.accessedAt = Date.now();
        entry.accessCount++;
    }

    private async getFromDisk(key: string): Promise<CacheEntry | null> {
        try {
            const filePath = path.join(this.cacheDir, `${key}.json`);
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }

    private async saveToDisk(key: string, entry: CacheEntry): Promise<void> {
        try {
            const filePath = path.join(this.cacheDir, `${key}.json`);
            await fs.writeFile(filePath, JSON.stringify(entry), 'utf-8');
            await this.saveIndex();
        } catch (error) {
            console.warn('Failed to save cache entry to disk:', error);
        }
    }

    private async loadIndex(): Promise<void> {
        try {
            const indexPath = path.join(this.cacheDir, 'index.json');
            const data = await fs.readFile(indexPath, 'utf-8');
            const index = JSON.parse(data);
            
            // index.entries 形如 { "abc123.json": CacheEntry }，key 即文件名，去掉 .json 即真实缓存键
            const entries = Object.entries(index.entries) as [string, CacheEntry][];
            const sortedEntries = entries
                .filter(([, entry]) => !this.isExpired(entry))
                .sort((a, b) => b[1].accessedAt - a[1].accessedAt)
                .slice(0, 100);

            for (const [fileName, entry] of sortedEntries) {
                const key = fileName.replace(/\.json$/, '');
                this.memoryCache.set(key, entry);
                const filePath = entry.key.filePath;
                if (!this.pathToKeyMap.has(filePath)) {
                    this.pathToKeyMap.set(filePath, new Set());
                }
                this.pathToKeyMap.get(filePath)!.add(key);
            }
        } catch {
            // Index 不存在或已损坏，从零开始
        }
    }

    private async saveIndex(): Promise<void> {
        try {
            const indexPath = path.join(this.cacheDir, 'index.json');
            const entries: Record<string, CacheEntry> = {};

            const files = await fs.readdir(this.cacheDir);
            for (const file of files) {
                if (file.endsWith('.json') && file !== 'index.json') {
                    const filePath = path.join(this.cacheDir, file);
                    try {
                        const data = await fs.readFile(filePath, 'utf-8');
                        const entry = JSON.parse(data) as CacheEntry;
                        if (!this.isExpired(entry)) {
                            entries[file] = entry;
                        } else {
                            // Remove expired entry
                            await fs.unlink(filePath).catch(() => {});
                        }
                    } catch (error) {
                        // Corrupted entry, remove it
                        await fs.unlink(filePath).catch(() => {});
                    }
                }
            }

            await fs.writeFile(
                indexPath,
                JSON.stringify({ entries, lastUpdated: Date.now() }),
                'utf-8'
            );
        } catch (error) {
            console.warn('Failed to save cache index:', error);
        }
    }

    private async enforceSizeLimit(): Promise<void> {
        try {
            const files = await fs.readdir(this.cacheDir);
            let totalSize = 0;
            const fileStats: Array<{ path: string; size: number; mtime: number }> = [];

            for (const file of files) {
                if (file.endsWith('.json') && file !== 'index.json') {
                    const filePath = path.join(this.cacheDir, file);
                    try {
                        const stats = await fs.stat(filePath);
                        totalSize += stats.size;
                        fileStats.push({
                            path: filePath,
                            size: stats.size,
                            mtime: stats.mtime.getTime(),
                        });
                    } catch (error) {
                        // File might have been deleted
                    }
                }
            }

            // Remove oldest files if over size limit
            if (totalSize > this.config.maxSize) {
                fileStats.sort((a, b) => a.mtime - b.mtime);
                
                for (const file of fileStats) {
                    if (totalSize <= this.config.maxSize * 0.8) break; // Keep at 80% of limit
                    
                    try {
                        await fs.unlink(file.path);
                        totalSize -= file.size;
                    } catch (error) {
                        // File might have been deleted by another process
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to enforce size limit:', error);
        }
    }

    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.config.cleanupInterval);

        // Don't keep the process alive just for cleanup
        if (this.cleanupTimer.unref) {
            this.cleanupTimer.unref();
        }
    }

    private async cleanup(): Promise<void> {
        // P0: 防止并发执行
        if (this.isCleaning) {
            return;
        }
        
        this.isCleaning = true;
        
        try {
            // Clean memory cache
            const expiredKeys: string[] = [];
            for (const [key, entry] of this.memoryCache.entries()) {
                if (this.isExpired(entry)) {
                    expiredKeys.push(key);
                    this.memoryCache.delete(key);
                }
            }
            
            // P0: 清理 pathToKeyMap 中已删除的 key
            for (const key of expiredKeys) {
                for (const [filePath, keys] of this.pathToKeyMap.entries()) {
                    if (keys.has(key)) {
                        keys.delete(key);
                        if (keys.size === 0) {
                            this.pathToKeyMap.delete(filePath);
                        }
                    }
                }
            }

            // Clean disk cache
            await this.saveIndex();
        } catch (error) {
            console.warn('Cleanup failed:', error);
        } finally {
            this.isCleaning = false;
        }
    }

    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        this.memoryCache.clear();
    }
}

// Singleton instance
let defaultCache: ReviewCache | null = null;

export function getDefaultReviewCache(): ReviewCache {
    if (!defaultCache) {
        defaultCache = new ReviewCache();
    }
    return defaultCache;
}

export function destroyDefaultReviewCache(): void {
    if (defaultCache) {
        defaultCache.destroy();
        defaultCache = null;
    }
}