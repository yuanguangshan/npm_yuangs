"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextStore = void 0;
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
class ContextStore {
    items = new Map();
    maxTokens = 100000;
    add(item) {
        this.items.set(item.id, item);
    }
    update(id, patch) {
        const item = this.items.get(id);
        if (!item)
            return;
        Object.assign(item, patch);
    }
    remove(id) {
        this.items.delete(id);
    }
    get(id) {
        return this.items.get(id);
    }
    list(status) {
        return [...this.items.values()]
            .filter(i => !status || i.status === status)
            .map((item, i) => ({
            index: i + 1,
            source: item.source,
            path: item.path,
            alias: item.alias,
            tokens: item.tokens,
            importance: item.importance.toFixed(2),
            pinned: item.pinned ? '📌' : '',
            ageMin: Math.floor((Date.now() - item.lastUsedAt) / 60000),
            summary: item.summary,
            status: item.status
        }));
    }
    all() {
        return [...this.items.values()];
    }
    clear() {
        this.items.clear();
    }
    isEmpty() {
        return this.items.size === 0;
    }
    totalTokens() {
        return [...this.items.values()].reduce((s, i) => s + i.tokens, 0);
    }
    enforceTTL(now = Date.now()) {
        for (const item of this.items.values()) {
            if (item.pinned || !item.ttlMs)
                continue;
            if (now - item.lastUsedAt > item.ttlMs) {
                item.status = 'expired';
            }
        }
    }
    gc() {
        for (const [id, item] of this.items) {
            if (item.status === 'expired') {
                this.items.delete(id);
            }
        }
    }
    /** @deprecated 优先使用 detectDriftAsync，避免同步阻塞 */
    detectDrift() {
        const reports = [];
        let checked = 0;
        const MAX_SYNC_CHECK = 20; // 同步模式最多检查20个文件，避免阻塞
        for (const item of this.items.values()) {
            if (checked >= MAX_SYNC_CHECK)
                break;
            if (item.source !== 'file')
                continue;
            if (!fs_1.default.existsSync(item.path))
                continue;
            try {
                const stats = fs_1.default.statSync(item.path);
                if (stats.size > 1024 * 1024)
                    continue; // 跳过 >1MB 文件
                const currentContent = fs_1.default.readFileSync(item.path, 'utf-8');
                const currentHash = sha256(currentContent);
                if (currentHash !== item.hash) {
                    reports.push({ id: item.id, path: item.path, reason: 'hash_changed' });
                }
                checked++;
            }
            catch {
                continue;
            }
        }
        return reports;
    }
    async detectDriftAsync() {
        const reports = [];
        const fsPromises = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const limit = (await Promise.resolve().then(() => __importStar(require('p-limit')))).default(5);
        const tasks = [...this.items.values()]
            .filter(i => i.source === 'file')
            .map(item => limit(async () => {
            try {
                const stats = await fsPromises.stat(item.path);
                if (stats.size > 1024 * 1024)
                    return null;
                const currentContent = await fsPromises.readFile(item.path, 'utf-8');
                const currentHash = sha256(currentContent);
                if (currentHash !== item.hash) {
                    return { id: item.id, path: item.path, reason: 'hash_changed' };
                }
            }
            catch { /* ignore */ }
            return null;
        }));
        const results = await Promise.all(tasks);
        for (const r of results)
            if (r)
                reports.push(r);
        return reports;
    }
    markAsDrifted(id) {
        const item = this.items.get(id);
        if (item) {
            item.status = 'stale';
            item.drifted = true;
        }
    }
    refreshItem(id) {
        const item = this.items.get(id);
        if (!item || item.source !== 'file')
            return;
        if (!fs_1.default.existsSync(item.path))
            return;
        try {
            const stats = fs_1.default.statSync(item.path);
            if (stats.size > 1024 * 1024)
                return;
            const raw = fs_1.default.readFileSync(item.path, 'utf-8');
            const content = redact(raw).redacted;
            const hash = sha256(content);
            item.content = content;
            item.hash = hash;
            item.status = 'active';
            item.drifted = false;
            item.lastUsedAt = Date.now();
        }
        catch { /* ignore */ }
    }
    async refreshItemAsync(id) {
        const item = this.items.get(id);
        if (!item || item.source !== 'file')
            return;
        try {
            const fsPromises = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const stats = await fsPromises.stat(item.path);
            if (stats.size > 1024 * 1024)
                return;
            const raw = await fsPromises.readFile(item.path, 'utf-8');
            const content = redact(raw).redacted;
            const hash = sha256(content);
            item.content = content;
            item.hash = hash;
            item.status = 'active';
            item.drifted = false;
            item.lastUsedAt = Date.now();
        }
        catch { /* ignore */ }
    }
    export() {
        return this.all();
    }
    import(items) {
        this.items.clear();
        for (const item of items) {
            const itemId = item.id || `${item.source || item.type}:${item.path}`;
            const normalized = {
                id: itemId,
                source: (item.source || item.type),
                path: item.path,
                alias: item.alias,
                content: item.content,
                summary: item.summary,
                tokens: item.tokens,
                importance: item.importance ?? 0.5,
                lastUsedAt: item.lastUsedAt ?? Date.now(),
                addedAt: item.addedAt ?? Date.now(),
                status: item.status ?? 'active',
                pinned: item.pinned,
                tags: item.tags,
                decayRate: item.decayRate,
                hash: item.hash,
                ttlMs: item.ttlMs,
                drifted: item.drifted
            };
            this.items.set(itemId, normalized);
        }
    }
}
exports.ContextStore = ContextStore;
function sha256(input) {
    return crypto_1.default.createHash('sha256').update(input).digest('hex');
}
const REDACTION_RULES = [
    {
        name: 'OpenAI Key',
        pattern: /sk-[a-zA-Z0-9]{20,}/g,
        replacement: '[REDACTED_API_KEY]'
    },
    {
        name: 'Password',
        pattern: /(password|passwd|secret)\s*[:=]\s*.+/gi,
        replacement: '$1=[REDACTED]'
    },
    {
        name: 'Private Key Block',
        pattern: /-----BEGIN [\s\S]*?PRIVATE KEY-----[\s\S]*?-----END [\s\S]*?PRIVATE KEY-----/g,
        replacement: '[REDACTED_PRIVATE_KEY]'
    }
];
function redact(text) {
    let result = text;
    const applied = [];
    for (const rule of REDACTION_RULES) {
        if (rule.pattern.test(result)) {
            result = result.replace(rule.pattern, rule.replacement);
            applied.push(rule.name);
        }
    }
    return { redacted: result, applied };
}
//# sourceMappingURL=ContextStore.js.map