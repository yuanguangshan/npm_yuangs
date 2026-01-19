"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletionCache = void 0;
class CompletionCache {
    static instance;
    cache;
    timestamp;
    ttl = 5000;
    constructor() {
        this.cache = new Map();
        this.timestamp = Date.now();
    }
    static getInstance() {
        if (!CompletionCache.instance) {
            CompletionCache.instance = new CompletionCache();
        }
        return CompletionCache.instance;
    }
    get(key) {
        const now = Date.now();
        if (now - this.timestamp > this.ttl) {
            this.cache.clear();
            this.timestamp = now;
            return null;
        }
        return this.cache.get(key) || null;
    }
    set(key, items) {
        this.cache.set(key, items);
    }
    invalidate() {
        this.cache.clear();
        this.timestamp = 0;
    }
    invalidatePattern(pattern) {
        for (const key of this.cache.keys()) {
            if (pattern.test(key)) {
                this.cache.delete(key);
            }
        }
    }
}
exports.CompletionCache = CompletionCache;
//# sourceMappingURL=cache.js.map