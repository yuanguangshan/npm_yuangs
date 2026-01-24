import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ContextItem, ContextStatus, DriftReport } from './ContextTypes';

export class ContextStore {
    private items = new Map<string, ContextItem>();
    private maxTokens = 32000;

    add(item: ContextItem) {
        this.items.set(item.id, item);
    }

    update(id: string, patch: Partial<ContextItem>) {
        const item = this.items.get(id);
        if (!item) return;
        Object.assign(item, patch);
    }

    remove(id: string) {
        this.items.delete(id);
    }

    get(id: string): ContextItem | undefined {
        return this.items.get(id);
    }

    list(status?: ContextStatus) {
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

    all(): ContextItem[] {
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
            if (item.pinned || !item.ttlMs) continue;

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

    detectDrift(): DriftReport[] {
        const reports: DriftReport[] = [];

        for (const item of this.items.values()) {
            if (item.source !== 'file') continue;
            if (!fs.existsSync(item.path)) continue;

            try {
                const currentContent = fs.readFileSync(item.path, 'utf-8');
                const currentHash = sha256(currentContent);

                if (currentHash !== item.hash) {
                    reports.push({
                        id: item.id,
                        path: item.path,
                        reason: 'hash_changed'
                    });
                }
            } catch (e) {
                continue;
            }
        }

        return reports;
    }

    markAsDrifted(id: string) {
        const item = this.items.get(id);
        if (item) {
            item.status = 'stale';
            item.drifted = true;
        }
    }

    refreshItem(id: string) {
        const item = this.items.get(id);
        if (!item || item.source !== 'file') return;

        if (!fs.existsSync(item.path)) return;

        const raw = fs.readFileSync(item.path, 'utf-8');
        const content = redact(raw).redacted;
        const hash = sha256(content);

        item.content = content;
        item.hash = hash;
        item.status = 'active';
        item.drifted = false;
        item.lastUsedAt = Date.now();
    }

    export() {
        return this.all();
    }

    import(items: any[]) {
        this.items.clear();
        for (const item of items) {
            const itemId = item.id || `${item.source || item.type}:${item.path}`;
            const normalized: ContextItem = {
                id: itemId,
                source: (item.source || item.type) as ContextItem['source'],
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

function sha256(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
}

const REDACTION_RULES: Array<{
    name: string;
    pattern: RegExp;
    replacement: string;
}> = [
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

function redact(text: string): { redacted: string; applied: string[] } {
    let result = text;
    const applied: string[] = [];

    for (const rule of REDACTION_RULES) {
        if (rule.pattern.test(result)) {
            result = result.replace(rule.pattern, rule.replacement);
            applied.push(rule.name);
        }
    }

    return { redacted: result, applied };
}
