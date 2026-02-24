/**
 * 上下文项接口
 * 用于表示单个上下文项，包含路径、内容、元数据等信息
 */
export interface ContextItem {
    /** 文件路径或标识符 */
    path: string;
    /** 原始内容 */
    content?: string;
    /** 内容摘要 */
    summary?: string;
    /** 最后访问时间戳 */
    lastUsedAt?: number;
    /** 添加时间戳 */
    addedAt?: number;
    /** 访问次数计数 */
    accessCount?: number;
    /** 自定义衰减率（越大衰减越快） */
    decayRate?: number;
    /** 重要性分数 (0-1) */
    importance?: number;
    /** 唯一标识符 */
    id?: string;
    /** 上下文来源类型 */
    source?: 'file' | 'directory' | 'memory' | 'antipattern';
    /** 上下文状态 */
    status?: 'active' | 'reference' | 'memory' | 'stale' | 'expired';
    /** 是否置顶（置顶项目不会衰减） */
    pinned?: boolean;
    /** 标签列表 */
    tags?: string[];
}
/**
 * 重要性评分配置常量
 * 用于 calculateImportance 函数
 */
export declare const IMPORTANCE_CONFIG: {
    readonly BASE_SCORE: 0.5;
    readonly CORE_PATH_BOOST: 0.2;
    readonly SOURCE_PATH_BOOST: 0.1;
    readonly TEST_FILE_PENALTY: 0.15;
    readonly CONFIG_FILE_BOOST: 0.05;
    readonly DOC_FILE_PENALTY: 0.1;
    readonly MIN_CONTENT_LENGTH: 50;
    readonly SHORT_CONTENT_PENALTY: 0.2;
    readonly LONG_CONTENT_THRESHOLD: 1000;
    readonly LONG_CONTENT_BOOST: 0.15;
    readonly MEDIUM_CONTENT_THRESHOLD: 500;
    readonly MEDIUM_CONTENT_BOOST: 0.1;
    readonly HIGH_ACCESS_COUNT: 10;
    readonly HIGH_ACCESS_BOOST: 0.15;
    readonly MEDIUM_ACCESS_COUNT: 5;
    readonly MEDIUM_ACCESS_BOOST: 0.1;
    readonly LOW_ACCESS_COUNT: 2;
    readonly LOW_ACCESS_BOOST: 0.05;
    readonly STALE_STATUS_PENALTY: 0.2;
    readonly PINNED_MIN_SCORE: 0.9;
    readonly IMPORTANT_TAG_BOOST: 0.15;
    readonly IMPORTANT_TAGS: string[];
    readonly CORE_PATHS: readonly ["src/core", "lib/core", "kernel", "engine", "runtime"];
    readonly SOURCE_PATHS: readonly ["src/", "lib/", "handlers/", "services/", "utils/"];
    readonly MIN_SCORE: 0;
    readonly MAX_SCORE: 1;
};
/**
 * 时间衰减配置常量
 * 用于 calculateRecencyScore 函数
 */
export declare const RECENCY_CONFIG: {
    readonly DEFAULT_HALF_LIFE_DAYS: 30;
    readonly FREQUENCY_BOOST_FACTOR: 0.1;
    readonly MAX_FREQUENCY_BOOST_MULTIPLIER: 2;
    readonly DEFAULT_DECAY_SCORE: 0.5;
    readonly PINNED_SCORE: 1;
};
export interface RankedContextItem extends ContextItem {
    relevance: number;
    matchReasons: string[];
}
export interface RelevanceConfig {
    keywordsWeight: number;
    pathWeight: number;
    extensionWeight: number;
    recencyWeight: number;
}
/**
 * 查询意图类型
 * 不同意图会影响相关性计算的权重分配
 */
export type QueryIntent = 'debug' | 'refactor' | 'feature' | 'docs' | 'general';
/**
 * 预定义的意图相关权重配置
 */
export declare const INTENT_WEIGHTS: Record<QueryIntent, Partial<RelevanceConfig>>;
/**
 * 检测查询意图
 * 基于查询中的关键词推断用户意图
 *
 * @param query 用户查询字符串
 * @returns 检测到的意图类型
 */
export declare function detectQueryIntent(query: string): QueryIntent;
/**
 * 计算上下文项的重要性分数
 * 基于路径重要性、内容质量、访问频率等因素
 * 返回值范围：0-1，1 表示最重要
 */
export declare function calculateImportance(item: ContextItem): number;
export declare function rankByRelevance(items: ContextItem[], query: string, config?: Partial<RelevanceConfig>): RankedContextItem[];
export declare function calculateTotalTokens(items: ContextItem[]): number;
export declare function filterContextByRelevance(items: ContextItem[], query: string, minRelevance?: number, config?: Partial<RelevanceConfig>): RankedContextItem[];
