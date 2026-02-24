/**
 * 清理过期配置
 */
export interface CleanupOptions {
    /** 最大保留天数（默认 90 天） */
    maxAge?: number;
    /** 最低重要性阈值（默认 0.2） */
    minImportance?: number;
    /** 最大保留项目数（默认 1000） */
    maxItems?: number;
    /** 是否保留 pinned 项目（默认 true） */
    respectPinned?: boolean;
}
export declare function loadContext(): Promise<any[]>;
export declare function saveContext(items: any[]): Promise<void>;
export declare function clearContextStorage(): Promise<void>;
/**
 * 主动遗忘：清理过期和低价值的上下文项
 *
 * 清理策略：
 * 1. 高重要性（>0.7）的项目永久保留
 * 2. Pinned 项目永久保留（除非 respectPinned=false）
 * 3. 超过 maxAge 天数的低价值项目被移除
 * 4. 低于 minImportance 的项目被移除
 * 5. 最终按重要性排序，保留最多 maxItems 个项目
 *
 * @param options 清理配置选项
 * @returns 清理统计信息
 */
export declare function cleanupStaleContext(options?: CleanupOptions): Promise<{
    beforeCount: number;
    afterCount: number;
    removedCount: number;
    removedPaths: string[];
}>;
