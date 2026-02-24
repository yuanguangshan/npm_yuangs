"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadContext = loadContext;
exports.saveContext = saveContext;
exports.clearContextStorage = clearContextStorage;
exports.cleanupStaleContext = cleanupStaleContext;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const CONTEXT_DIR = path_1.default.resolve(process.cwd(), '.ai');
const CONTEXT_FILE = path_1.default.join(CONTEXT_DIR, 'context.json');
async function loadContext() {
    try {
        const raw = await promises_1.default.readFile(CONTEXT_FILE, 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        return [];
    }
}
async function saveContext(items) {
    await promises_1.default.mkdir(CONTEXT_DIR, { recursive: true });
    await promises_1.default.writeFile(CONTEXT_FILE, JSON.stringify(items, null, 2));
}
async function clearContextStorage() {
    await promises_1.default.rm(CONTEXT_FILE, { force: true });
}
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
async function cleanupStaleContext(options = {}) {
    const { maxAge = 90, // 默认 90 天
    minImportance = 0.2, // 默认最低重要性 0.2
    maxItems = 1000, // 默认最多 1000 个项目
    respectPinned = true // 默认保留 pinned 项目
     } = options;
    const items = await loadContext();
    const now = Date.now();
    const beforeCount = items.length;
    const removedPaths = [];
    const filtered = items.filter((item) => {
        // 高重要性永久保留
        if (item.importance && item.importance > 0.7)
            return true;
        // Pinned 项目永久保留（除非配置不尊重 pinned）
        if (respectPinned && item.pinned)
            return true;
        // 计算年龄
        const createdAt = item.addedAt || item.lastUsedAt;
        if (!createdAt) {
            // 没有时间戳的项目，如果是低重要性则移除
            if (item.importance !== undefined && item.importance < minImportance) {
                removedPaths.push(item.path);
                return false;
            }
            return true;
        }
        const ageDays = (now - createdAt) / (1000 * 60 * 60 * 24);
        // 超过最大年龄，移除
        if (ageDays > maxAge) {
            removedPaths.push(item.path);
            return false;
        }
        // 低于最低重要性，移除
        if (item.importance !== undefined && item.importance < minImportance) {
            removedPaths.push(item.path);
            return false;
        }
        return true;
    });
    // 如果仍超限，按重要性排序后截断
    let final = filtered;
    if (filtered.length > maxItems) {
        const sorted = filtered.sort((a, b) => {
            // 优先保留 pinned
            if (respectPinned) {
                if (a.pinned && !b.pinned)
                    return -1;
                if (!a.pinned && b.pinned)
                    return 1;
            }
            // 按重要性降序
            return (b.importance || 0.5) - (a.importance || 0.5);
        });
        const removed = sorted.slice(maxItems);
        removedPaths.push(...removed.map((item) => item.path));
        final = sorted.slice(0, maxItems);
    }
    // 保存清理后的数据
    await saveContext(final);
    return {
        beforeCount,
        afterCount: final.length,
        removedCount: beforeCount - final.length,
        removedPaths
    };
}
//# sourceMappingURL=contextStorage.js.map