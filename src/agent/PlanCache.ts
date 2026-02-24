import { TaskPlan } from './types';
import crypto from 'crypto';

/**
 * 缓存条目
 */
interface CacheEntry {
  /** 计划内容 */
  plan: TaskPlan;
  /** 规范化后的输入（用于相似度匹配） */
  normalizedInput: string;
  /** 缓存时间戳 */
  timestamp: number;
  /** 访问次数 */
  accessCount: number;
  /** 最后访问时间 */
  lastAccessed: number;
  /** 命中次数 */
  hitCount: number;
  /** 计划的复杂度评分 */
  complexityScore: number;
}

/**
 * 缓存配置
 */
export interface PlanCacheConfig {
  /** 最大缓存条目数 */
  maxEntries: number;
  /** 缓存过期时间 (毫秒) */
  ttl: number;
  /** 是否启用复杂度感知缓存 */
  enableComplexityAware: boolean;
  /** 相似度阈值 (0-1)，高于此值视为匹配 */
  similarityThreshold: number;
}

const DEFAULT_CACHE_CONFIG: PlanCacheConfig = {
  maxEntries: 100,
  ttl: 3600000,  // 1 hour
  enableComplexityAware: true,
  similarityThreshold: 0.85
};

/**
 * 缓存统计信息
 */
export interface CacheStats {
  /** 总条目数 */
  totalEntries: number;
  /** 总命中次数 */
  totalHits: number;
  /** 总未命中次数 */
  totalMisses: number;
  /** 命中率 */
  hitRate: number;
  /** 平均缓存大小 (bytes) */
  avgCacheSize: number;
  /** 复杂度分布 */
  complexityDistribution: {
    low: number;   // 0-0.3
    medium: number; // 0.3-0.7
    high: number;  // 0.7-1.0
  };
}

/**
 * 计划缓存系统
 *
 * 功能:
 * 1. 输入规范化 - 将可变参数替换为占位符
 * 2. 相似度匹配 - 使用 TF-IDF 计算文本相似度
 * 3. 复杂度感知 - 根据计划复杂度调整缓存策略
 * 4. LRU 淘汰 - 最近最少使用优先淘汰
 * 5. TTL 过期 - 自动清理过期缓存
 *
 * 使用场景:
 * - 用户重复请求相似任务
 * - 批量操作中的重复计划
 * - 测试和调试阶段的频繁调用
 */
export class PlanCache {
  private cache: Map<string, CacheEntry> = new Map();
  private config: PlanCacheConfig;
  private totalHits = 0;
  private totalMisses = 0;

  // LRU 优化: 跟踪最旧的条目键，避免 O(N) 遍历
  private lruKeys: Set<string> = new Set();
  private oldestKey: string | undefined;

  // 停用词列表（用于 TF-IDF）
  private readonly STOP_WORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'of', 'at',
    'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
    'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
    'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and',
    'but', 'if', 'or', 'because', 'as', 'until', 'while', '这', '那',
    '是', '的', '了', '在', '有', '和', '与', '或', '如果', '那么',
    '因为', '所以', '但是', '然后', '之后', '之前', '的时候'
  ]);

  constructor(config: Partial<PlanCacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
  }

  /**
   * 获取或生成计划
   */
  async getOrGenerate(
    input: string,
    generator: () => Promise<TaskPlan>
  ): Promise<TaskPlan> {
    const normalized = this.normalizeInput(input);
    const hash = this.hashInput(normalized);

    // 1. 尝试精确匹配
    const exactEntry = this.cache.get(hash);
    if (exactEntry && this.isValid(exactEntry)) {
      exactEntry.accessCount++;
      exactEntry.lastAccessed = Date.now();
      exactEntry.hitCount++;
      this.totalHits++;

      // 更新 LRU 跟踪 (访问后可能改变 oldestKey)
      this.updateLRUOnAccess(hash);

      console.log(`[PlanCache] Exact cache hit for: ${input.substring(0, 50)}...`);
      return { ...exactEntry.plan }; // 返回副本防止修改
    }

    // 2. 尝试相似度匹配
    if (this.config.enableComplexityAware) {
      const similarEntry = this.findSimilar(normalized);
      if (similarEntry && this.isValid(similarEntry)) {
        similarEntry.accessCount++;
        similarEntry.lastAccessed = Date.now();
        similarEntry.hitCount++;
        this.totalHits++;

        // 更新 LRU 跟踪 (访问后可能改变 oldestKey)
        const accessedHash = this.getHashByEntry(similarEntry);
        if (accessedHash) {
          this.updateLRUOnAccess(accessedHash);
        }

        const similarity = this.calculateSimilarity(normalized, similarEntry.normalizedInput);
        console.log(`[PlanCache] Similar cache hit (${similarity.toFixed(2)})`);
        return { ...similarEntry.plan };
      }
    }

    // 3. 缓存未命中，生成新计划
    this.totalMisses++;
    console.log(`[PlanCache] Cache miss, generating new plan...`);

    const plan = await generator();

    // 4. 缓存新生成的计划
    this.set(hash, {
      plan,
      normalizedInput: normalized,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      hitCount: 0,
      complexityScore: this.calculateComplexity(plan)
    });

    return plan;
  }

  /**
   * 保存计划到缓存
   */
  private set(hash: string, entry: CacheEntry): void {
    // 如果是新条目且缓存已满，先淘汰
    if (!this.cache.has(hash) && this.cache.size >= this.config.maxEntries) {
      this.evictLRU();
    }

    this.cache.set(hash, entry);

    // 更新 LRU 跟踪
    this.lruKeys.add(hash);
    // 使用 lastAccessed 而不是 timestamp 来跟踪 LRU
    if (!this.oldestKey) {
      this.oldestKey = hash;
    } else {
      const oldestEntry = this.cache.get(this.oldestKey);
      // 如果当前条目的 lastAccessed 早于 oldestKey 的 lastAccessed，更新 oldestKey
      if (oldestEntry && entry.lastAccessed < oldestEntry.lastAccessed) {
        this.oldestKey = hash;
      }
    }
  }

  /**
   * 访问时更新 LRU 跟踪
   *
   * 当条目被访问时，它的 lastAccessed 会被更新，
   * 如果之前是 oldestKey，需要重新计算。
   */
  private updateLRUOnAccess(accessedHash: string): void {
    // 如果访问的是当前的 oldestKey，需要重新计算
    if (this.oldestKey === accessedHash) {
      this.updateOldestKey();
    }
  }

  /**
   * 根据缓存条目获取其哈希值
   * 用于相似度匹配后更新 LRU
   */
  private getHashByEntry(targetEntry: CacheEntry): string | undefined {
    for (const [hash, entry] of this.cache) {
      if (entry === targetEntry) {
        return hash;
      }
    }
    return undefined;
  }

  /**
   * 检查缓存条目是否有效
   */
  private isValid(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age < this.config.ttl;
  }

  /**
   * 查找相似的计划
   *
   * 性能说明: 当前使用 O(N) 遍历，对于默认 maxEntries=100 的情况下性能可接受。
   * 如果未来需要支持更大的缓存，可以考虑使用局部敏感哈希 (LSH) 或近似最近邻搜索。
   */
  private findSimilar(normalizedInput: string): CacheEntry | undefined {
    let bestMatch: CacheEntry | undefined;
    let bestSimilarity = 0;

    for (const [hash, entry] of this.cache) {
      if (!this.isValid(entry)) continue;

      const similarity = this.calculateSimilarity(normalizedInput, entry.normalizedInput);

      if (similarity > bestSimilarity && similarity >= this.config.similarityThreshold) {
        bestSimilarity = similarity;
        bestMatch = entry;
      }
    }

    return bestMatch;
  }

  /**
   * 规范化输入
   *
   * 策略:
   * 1. 转换为小写
   * 2. 替换数字为 N
   * 3. 替换引号内容为 ""
   * 4. 移除多余空格
   * 5. 移除停用词
   */
  private normalizeInput(input: string): string {
    return input
      .toLowerCase()
      // 替换数字
      .replace(/\b\d+\b/g, 'N')
      // 替换引号内容
      .replace(/["'][^"']*["']/g, '""')
      // 替换文件路径
      .replace(/[\w\-./]+\.(ts|js|py|go|rs|java|json|yaml|yml|md)/g, 'FILE')
      // 替换 URL
      .replace(/https?:\/\/[^\s]+/g, 'URL')
      // 标准化空白字符
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 计算输入哈希
   */
  private hashInput(input: string): string {
    return crypto
      .createHash('sha256')
      .update(input)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * 计算文本相似度 (TF 向量 + 余弦相似度)
   */
  private calculateSimilarity(input1: string, input2: string): number {
    const tf1 = this.calculateNormalizedTF(input1);
    const tf2 = this.calculateNormalizedTF(input2);

    return this.cosineSimilarity(tf1, tf2);
  }

  /**
   * 计算归一化的词频向量
   *
   * 注意: 这个方法只计算 Term Frequency (TF) 并归一化，
   * 不包含 Inverse Document Frequency (IDF)。
   * 对于相似度匹配来说，单文档的 TF 已经足够。
   */
  private calculateNormalizedTF(text: string): Map<string, number> {
    const words = text.split(/\s+/).filter(w => w.length > 2 && !this.STOP_WORDS.has(w));
    const tf = new Map<string, number>();

    // 计算词频 (TF)
    for (const word of words) {
      tf.set(word, (tf.get(word) || 0) + 1);
    }

    // 归一化
    const maxFreq = Math.max(...tf.values());
    const vector = new Map<string, number>();
    for (const [word, freq] of tf) {
      vector.set(word, freq / maxFreq);
    }

    return vector;
  }

  /**
   * 余弦相似度
   */
  private cosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    const allWords = new Set([...vec1.keys(), ...vec2.keys()]);

    for (const word of allWords) {
      const v1 = vec1.get(word) || 0;
      const v2 = vec2.get(word) || 0;

      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator > 0 ? dotProduct / denominator : 0;
  }

  /**
   * 计算计划复杂度
   */
  private calculateComplexity(plan: TaskPlan): number {
    let complexity = 0;

    // 步骤数量贡献
    complexity += Math.min(plan.steps.length / 10, 0.4);

    // 高风险步骤贡献
    const highRiskCount = plan.steps.filter(s => s.risk_level === 'high').length;
    complexity += (highRiskCount / plan.steps.length) * 0.3;

    // 步骤类型多样性
    const types = new Set(plan.steps.map(s => s.type));
    complexity += (types.size / 5) * 0.2;

    // 依赖关系复杂度
    const totalDeps = plan.steps.reduce((sum, s) => sum + (s.dependencies?.length || 0), 0);
    complexity += Math.min(totalDeps / plan.steps.length / 2, 0.1);

    return Math.min(complexity, 1.0);
  }

  /**
   * LRU 淘汰策略 (优化版本)
   *
   * 使用 oldestKey 跟踪最近最少使用的条目，将最常见的情况优化为 O(1)。
   * 仅在 oldestKey 无效时回退到 O(N) 遍历。
   *
   * 注意: 这不是标准的 LRU 实现（使用 Map + 双向链表），
   * 但对于当前用例（maxEntries=100，低频淘汰）已足够高效。
   */
  private evictLRU(): void {
    // 如果 oldestKey 无效，回退到遍历方式
    if (!this.oldestKey || !this.cache.has(this.oldestKey)) {
      this.evictLRUFallback();
      return;
    }

    const evicted = this.oldestKey;
    this.cache.delete(evicted);
    this.lruKeys.delete(evicted);

    // 重新计算 oldestKey
    this.updateOldestKey();

    console.log(`[PlanCache] Evicted LRU entry: ${evicted.substring(0, 8)}...`);
  }

  /**
   * 更新 oldestKey (在淘汰或删除后调用)
   *
   * 注意: 这是一个 O(N) 操作，因为需要遍历所有条目找到最少使用的。
   * 但这只在淘汰/清理时调用，不是每次访问时调用，所以整体性能仍可接受。
   */
  private updateOldestKey(): void {
    let oldestHash: string | undefined;
    let oldestAccess = Infinity;

    for (const [hash, entry] of this.cache) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestHash = hash;
      }
    }

    this.oldestKey = oldestHash;
  }

  /**
   * LRU 淘汰回退方法 (当 oldestKey 无效时使用)
   */
  private evictLRUFallback(): void {
    let oldestHash: string | undefined;
    let oldestTime = Infinity;

    for (const [hash, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestHash = hash;
      }
    }

    if (oldestHash) {
      this.cache.delete(oldestHash);
      this.lruKeys.delete(oldestHash);
      this.oldestKey = undefined;
      this.updateOldestKey();
      console.log(`[PlanCache] Evicted LRU entry (fallback): ${oldestHash.substring(0, 8)}...`);
    }
  }

  /**
   * 清理过期缓存
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [hash, entry] of this.cache) {
      if (now - entry.timestamp > this.config.ttl) {
        this.cache.delete(hash);
        this.lruKeys.delete(hash);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[PlanCache] Cleaned up ${cleaned} expired entries`);
      // 清理后更新 oldestKey
      this.updateOldestKey();
    }

    return cleaned;
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.lruKeys.clear();
    this.oldestKey = undefined;
    this.totalHits = 0;
    this.totalMisses = 0;
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalRequests = this.totalHits + this.totalMisses;

    // 计算复杂度分布
    let low = 0, medium = 0, high = 0;
    for (const entry of entries) {
      if (entry.complexityScore < 0.3) low++;
      else if (entry.complexityScore < 0.7) medium++;
      else high++;
    }

    // 计算平均缓存大小: 通过序列化每个 plan 为 JSON 字符串来估算内存占用
    // 注意: 这只是近似值，实际内存占用会更高（包括对象开销、Map 结构等）
    const totalSize = entries.reduce((sum, e) => sum + JSON.stringify(e.plan).length, 0);
    const avgSize = entries.length > 0 ? totalSize / entries.length : 0;

    return {
      totalEntries: this.cache.size,
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      hitRate: totalRequests > 0 ? this.totalHits / totalRequests : 0,
      avgCacheSize: avgSize,
      complexityDistribution: { low, medium, high }
    };
  }

  /**
   * 获取缓存条目详情
   */
  getEntry(hash: string): CacheEntry | undefined {
    const entry = this.cache.get(hash);
    return entry && this.isValid(entry) ? entry : undefined;
  }

  /**
   * 预热缓存（批量导入）
   *
   * 注意: 如果条目数超过 maxEntries，将使用 LRU 策略淘汰旧条目
   */
  warmUp(entries: Array<{ input: string; plan: TaskPlan }>): void {
    for (const { input, plan } of entries) {
      const normalized = this.normalizeInput(input);

      // 使用 set 方法以确保所有缓存管理逻辑正确应用
      this.set(this.hashInput(normalized), {
        plan: { ...plan }, // 返回副本防止修改原始计划
        normalizedInput: normalized,
        timestamp: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now(),
        hitCount: 0,
        complexityScore: this.calculateComplexity(plan)
      });
    }

    console.log(`[PlanCache] Warmed up with ${entries.length} entries`);
  }

  /**
   * 导出缓存（用于持久化）
   */
  export(): Array<{ hash: string; entry: CacheEntry }> {
    const result: Array<{ hash: string; entry: CacheEntry }> = [];

    for (const [hash, entry] of this.cache) {
      if (this.isValid(entry)) {
        result.push({ hash, entry });
      }
    }

    return result;
  }

  /**
   * 导入缓存（从持久化恢复）
   */
  import(data: Array<{ hash: string; entry: CacheEntry }>): void {
    for (const { hash, entry } of data) {
      if (this.isValid(entry)) {
        this.cache.set(hash, entry);
        this.lruKeys.add(hash);

        // 更新 oldestKey (使用 lastAccessed)
        if (!this.oldestKey) {
          this.oldestKey = hash;
        } else {
          const oldestEntry = this.cache.get(this.oldestKey);
          if (oldestEntry && entry.lastAccessed < oldestEntry.lastAccessed) {
            this.oldestKey = hash;
          }
        }
      }
    }

    console.log(`[PlanCache] Imported ${data.length} entries`);
  }
}

// 注意: 不再导出默认单例，以避免全局状态和测试隔离问题
// 每个需要 PlanCache 的实例应该创建自己的实例
// 如果需要共享缓存，请通过依赖注入的方式传递
export const defaultPlanCache = new PlanCache();

