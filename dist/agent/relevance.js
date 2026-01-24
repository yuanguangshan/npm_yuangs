"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rankByRelevance = rankByRelevance;
exports.calculateTotalTokens = calculateTotalTokens;
exports.filterContextByRelevance = filterContextByRelevance;
const DEFAULT_CONFIG = {
    keywordsWeight: 0.4,
    pathWeight: 0.3,
    extensionWeight: 0.2,
    recencyWeight: 0.1
};
function extractKeywords(query) {
    const cleaned = query
        .toLowerCase()
        .replace(/[^\w\s\u4e00-\u9fa5]/g, '')
        .trim();
    const words = cleaned.split(/\s+/).filter(w => w.length > 1);
    const keywords = new Set();
    for (const word of words) {
        if (word.length > 2) {
            keywords.add(word);
        }
        if (word.length > 4) {
            for (let i = 3; i < word.length; i++) {
                keywords.add(word.substring(0, i));
            }
        }
    }
    return Array.from(keywords);
}
function calculateKeywordMatchScore(content, summary, keywords) {
    const textToMatch = (summary || content).toLowerCase();
    let matches = 0;
    let totalMatches = 0;
    for (const keyword of keywords) {
        const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const keywordMatches = textToMatch.match(regex);
        if (keywordMatches) {
            matches += keywordMatches.length;
        }
        totalMatches++;
    }
    return totalMatches > 0 ? matches / (totalMatches * Math.max(keywords.length, 1)) : 0;
}
function calculatePathScore(path, keywords) {
    const pathLower = path.toLowerCase();
    let score = 0;
    for (const keyword of keywords) {
        if (pathLower.includes(keyword)) {
            score += 1;
            const parts = path.split(/[/\\]/);
            const fileName = parts[parts.length - 1].toLowerCase();
            if (fileName.includes(keyword)) {
                score += 1;
            }
        }
    }
    const maxScore = Math.max(keywords.length, 1);
    return Math.min(score / maxScore, 1);
}
function calculateExtensionScore(path, query) {
    const pathLower = path.toLowerCase();
    const queryLower = query.toLowerCase();
    const ext = pathLower.split('.').pop() || '';
    const queryExts = ['.ts', '.js', '.py', '.go', '.rs', '.java', '.json', '.md'];
    if (!ext)
        return 0;
    if (queryLower.includes(ext)) {
        return 1;
    }
    if (queryExts.some(e => queryLower.includes(e)) && queryExts.includes(`.${ext}`)) {
        return 0.8;
    }
    return 0;
}
function calculateRecencyScore(item) {
    return 0.5;
}
function rankByRelevance(items, query, config) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const keywords = extractKeywords(query);
    return items
        .map(item => {
        const keywordScore = calculateKeywordMatchScore(item.content || '', item.summary || '', keywords);
        const pathScore = calculatePathScore(item.path, keywords);
        const extensionScore = calculateExtensionScore(item.path, query);
        const recencyScore = calculateRecencyScore(item);
        const relevance = (keywordScore * finalConfig.keywordsWeight) +
            (pathScore * finalConfig.pathWeight) +
            (extensionScore * finalConfig.extensionWeight) +
            (recencyScore * finalConfig.recencyWeight);
        const matchReasons = [];
        if (keywordScore > 0.5)
            matchReasons.push('Keywords match');
        if (pathScore > 0.5)
            matchReasons.push('Path match');
        if (extensionScore > 0.5)
            matchReasons.push('Relevant extension');
        return {
            ...item,
            relevance: Math.min(relevance, 1),
            matchReasons
        };
    })
        .filter(item => item.relevance > 0.1)
        .sort((a, b) => b.relevance - a.relevance);
}
function calculateTotalTokens(items) {
    let total = 0;
    for (const item of items) {
        const text = item.content || item.summary || '';
        total += text.length;
    }
    return Math.ceil(total / 4);
}
function filterContextByRelevance(items, query, minRelevance = 0.3, config) {
    const ranked = rankByRelevance(items, query, config);
    return ranked.filter(item => item.relevance >= minRelevance);
}
//# sourceMappingURL=relevance.js.map