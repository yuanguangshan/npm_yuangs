"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextAssembler = void 0;
const estimateTokens = (text) => Math.ceil(text.length / 4);
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
class ContextAssembler {
    maxTokens = 32000;
    assemble(store, userInput) {
        if (store.isEmpty())
            return userInput;
        const now = Date.now();
        const items = store.all();
        for (const item of items) {
            this.decay(item, now);
            this.computeImportance(item, userInput, now);
        }
        this.promoteToMemoryIfNeeded(items, now);
        const memory = items.filter(i => i.status === 'memory');
        const active = items
            .filter(i => i.importance > 0.6 && i.status !== 'memory' && i.source !== 'antipattern')
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 6);
        const reference = items.filter(i => !active.includes(i) && i.status !== 'memory' && i.source !== 'antipattern');
        const antiPatterns = items.filter(i => i.status === 'active' && i.source === 'antipattern').slice(-3);
        const render = (items) => items
            .map(i => {
            const title = i.alias
                ? `[Context] ${i.source}: ${i.alias} (${i.path})`
                : `[Context] ${i.source}: ${i.path}`;
            const body = i.summary ?? i.content ?? '';
            return `${title}\n---\n${body}\n---`;
        })
            .join('\n\n');
        const renderAntiPatterns = (items) => items
            .map(i => `⚠️ ${i.content}`)
            .join('\n\n');
        let antiPatternSection = '';
        if (antiPatterns.length > 0) {
            antiPatternSection = `
# Anti-Pattern Warnings
以下模式曾导致执行失败，请避免：
${renderAntiPatterns(antiPatterns)}

`;
        }
        return `
# System Memory
${render(memory)}

# Active Context
${render(active)}

# Reference Context
${render(reference)}
${antiPatternSection}
用户问题：
${userInput}
`;
    }
    sanitizeContent(content) {
        const findings = [];
        let result = content;
        for (const rule of REDACTION_RULES) {
            const matches = result.match(rule.pattern);
            if (matches) {
                result = result.replace(rule.pattern, rule.replacement);
                findings.push({
                    rule: rule.name,
                    count: matches.length
                });
            }
        }
        return { sanitized: result, findings };
    }
    optimizeForTokens(store, ratio) {
        if (ratio < 0.7)
            return;
        const items = store.all();
        const victims = items
            .filter(i => i.content && !i.pinned && i.status !== 'memory')
            .sort((a, b) => a.importance - b.importance);
        for (const item of victims) {
            item.summary = item.summary ?? item.content.slice(0, 500) + '...';
            item.content = undefined;
            item.tokens = estimateTokens(item.summary);
            if (store.totalTokens() / this.maxTokens < 0.6)
                break;
        }
    }
    computeImportance(item, query, now) {
        const recency = Math.exp(-(now - item.lastUsedAt) / (1000 * 60 * 30));
        const semantic = item.content && query
            ? item.content.toLowerCase().includes(query.toLowerCase())
                ? 1
                : 0
            : 0;
        const pinned = item.pinned ? 1 : 0;
        item.importance =
            0.5 * recency +
                0.3 * semantic +
                0.2 * pinned;
    }
    decay(item, now) {
        if (item.pinned)
            return;
        const last = item.lastUsedAt ?? now;
        const hours = (now - last) / 36e5;
        const rate = item.decayRate ?? 0.95;
        item.importance = (item.importance ?? 0.5) * Math.pow(rate, hours);
    }
    promoteToMemoryIfNeeded(items, now) {
        for (const item of items) {
            if (item.source === 'memory' || item.source === 'antipattern')
                continue;
            if (item.importance < 0.85)
                continue;
            if (now - item.lastUsedAt > 1000 * 60 * 10)
                continue;
            item.status = 'memory';
            item.pinned = true;
        }
    }
}
exports.ContextAssembler = ContextAssembler;
//# sourceMappingURL=ContextAssembler.js.map