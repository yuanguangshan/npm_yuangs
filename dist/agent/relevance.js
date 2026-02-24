"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTENT_WEIGHTS = exports.RECENCY_CONFIG = exports.IMPORTANCE_CONFIG = void 0;
exports.detectQueryIntent = detectQueryIntent;
exports.calculateImportance = calculateImportance;
exports.rankByRelevance = rankByRelevance;
exports.calculateTotalTokens = calculateTotalTokens;
exports.filterContextByRelevance = filterContextByRelevance;
/**
 * 重要性评分配置常量
 * 用于 calculateImportance 函数
 */
exports.IMPORTANCE_CONFIG = {
    // 基础分数
    BASE_SCORE: 0.5,
    // 路径重要性权重
    CORE_PATH_BOOST: 0.2, // 核心目录加分
    SOURCE_PATH_BOOST: 0.1, // 源码目录加分
    TEST_FILE_PENALTY: 0.15, // 测试文件减分
    CONFIG_FILE_BOOST: 0.05, // 配置文件加分
    DOC_FILE_PENALTY: 0.1, // 文档文件减分
    // 内容质量权重
    MIN_CONTENT_LENGTH: 50, // 最小内容长度阈值
    SHORT_CONTENT_PENALTY: 0.2, // 短内容减分
    LONG_CONTENT_THRESHOLD: 1000, // 长内容阈值
    LONG_CONTENT_BOOST: 0.15, // 长内容加分
    MEDIUM_CONTENT_THRESHOLD: 500, // 中等内容阈值
    MEDIUM_CONTENT_BOOST: 0.1, // 中等内容加分
    // 访问频率权重
    HIGH_ACCESS_COUNT: 10, // 高访问次数阈值
    HIGH_ACCESS_BOOST: 0.15, // 高访问加分
    MEDIUM_ACCESS_COUNT: 5, // 中访问次数阈值
    MEDIUM_ACCESS_BOOST: 0.1, // 中访问加分
    LOW_ACCESS_COUNT: 2, // 低访问次数阈值
    LOW_ACCESS_BOOST: 0.05, // 低访问加分
    // 状态权重
    STALE_STATUS_PENALTY: 0.2, // 过期状态减分
    // 特殊标记
    PINNED_MIN_SCORE: 0.9, // 置顶项目最低分数
    IMPORTANT_TAG_BOOST: 0.15, // 重要标签加分
    // 重要标签列表
    IMPORTANT_TAGS: ['critical', 'core', 'essential', 'important'],
    // 核心目录列表
    CORE_PATHS: ['src/core', 'lib/core', 'kernel', 'engine', 'runtime'],
    // 源码目录列表
    SOURCE_PATHS: ['src/', 'lib/', 'handlers/', 'services/', 'utils/'],
    // 分数范围
    MIN_SCORE: 0,
    MAX_SCORE: 1,
};
/**
 * 时间衰减配置常量
 * 用于 calculateRecencyScore 函数
 */
exports.RECENCY_CONFIG = {
    // 默认半衰期（天）
    DEFAULT_HALF_LIFE_DAYS: 30,
    // 访问频率加成因子
    FREQUENCY_BOOST_FACTOR: 0.1,
    // 最大频率加成倍数
    MAX_FREQUENCY_BOOST_MULTIPLIER: 2,
    // 默认时间衰减分数（无时间戳时）
    DEFAULT_DECAY_SCORE: 0.5,
    // 置顶项目分数
    PINNED_SCORE: 1.0,
};
/**
 * 预定义的意图相关权重配置
 */
exports.INTENT_WEIGHTS = {
    // 调试时：关键词匹配最重要，路径次之
    debug: {
        keywordsWeight: 0.5,
        pathWeight: 0.2,
        extensionWeight: 0.15,
        recencyWeight: 0.15
    },
    // 重构时：路径结构最重要，关键词次之
    refactor: {
        keywordsWeight: 0.2,
        pathWeight: 0.5,
        extensionWeight: 0.2,
        recencyWeight: 0.1
    },
    // 新功能开发：均衡配置，略偏关键词
    feature: {
        keywordsWeight: 0.35,
        pathWeight: 0.35,
        extensionWeight: 0.2,
        recencyWeight: 0.1
    },
    // 文档查询：路径和扩展名更重要
    docs: {
        keywordsWeight: 0.25,
        pathWeight: 0.35,
        extensionWeight: 0.3,
        recencyWeight: 0.1
    },
    // 通用查询：默认权重
    general: {
        keywordsWeight: 0.4,
        pathWeight: 0.3,
        extensionWeight: 0.2,
        recencyWeight: 0.1
    }
};
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
/**
 * 意图检测配置
 *
 * 局限性说明：
 * 1. 基于简单关键词匹配，对于复杂或模糊的查询可能误判
 * 2. 不支持上下文感知，无法理解对话历史中的意图变化
 * 3. 否定词检测仅基于简单模式，可能无法处理复杂否定结构
 * 4. 对于未来改进方向，可以考虑使用 NLP 模型或机器学习分类器
 */
const INTENT_KEYWORDS = {
    debug: [
        { keyword: 'debug', weight: 5 },
        { keyword: 'error', weight: 4 },
        { keyword: 'fix', weight: 3 },
        { keyword: 'bug', weight: 5 },
        { keyword: 'issue', weight: 4 },
        { keyword: 'crash', weight: 5 },
        { keyword: 'exception', weight: 4 },
        { keyword: 'fail', weight: 3 },
        { keyword: 'broken', weight: 4 },
        { keyword: '调试', weight: 5 },
        { keyword: '错误', weight: 4 },
        { keyword: '修复', weight: 3 },
        { keyword: '问题', weight: 3 },
        { keyword: '崩溃', weight: 5 },
    ],
    refactor: [
        { keyword: 'refactor', weight: 5 },
        { keyword: 'restructure', weight: 4 },
        { keyword: 'reorganize', weight: 4 },
        { keyword: 'clean', weight: 3 },
        { keyword: 'optimize', weight: 4 },
        { keyword: '重构', weight: 5 },
        { keyword: '重组', weight: 4 },
        { keyword: '优化', weight: 4 },
        { keyword: '清理', weight: 3 },
    ],
    feature: [
        { keyword: 'add', weight: 3 },
        { keyword: 'create', weight: 4 },
        { keyword: 'implement', weight: 5 },
        { keyword: 'build', weight: 4 },
        { keyword: 'new', weight: 3 },
        { keyword: 'feature', weight: 5 },
        { keyword: '添加', weight: 3 },
        { keyword: '创建', weight: 4 },
        { keyword: '实现', weight: 5 },
        { keyword: '构建', weight: 4 },
        { keyword: '开发', weight: 4 },
    ],
    docs: [
        { keyword: 'doc', weight: 4 },
        { keyword: 'readme', weight: 5 },
        { keyword: 'explain', weight: 4 },
        { keyword: 'understand', weight: 4 },
        { keyword: 'what', weight: 2 },
        { keyword: 'how', weight: 3 },
        { keyword: '文档', weight: 4 },
        { keyword: '说明', weight: 4 },
        { keyword: '解释', weight: 4 },
        { keyword: '理解', weight: 4 },
    ],
    general: []
};
/**
 * 否定词模式列表
 * 如果查询中包含这些模式与某个意图关键词的组合，则不识别为该意图
 */
const NEGATION_PATTERNS = [
    'don\'t debug',
    'dont debug',
    'no debug',
    'not debug',
    '不要调试',
    '别调试',
    'no refactor',
    'not refactor',
    'not adding',
];
/**
 * 检测查询意图
 * 基于查询中的关键词推断用户意图
 *
 * @param query 用户查询字符串
 * @returns 检测到的意图类型
 */
function detectQueryIntent(query) {
    const queryLower = query.toLowerCase();
    // 首先检查否定模式
    for (const pattern of NEGATION_PATTERNS) {
        if (queryLower.includes(pattern)) {
            // 如果包含否定模式，返回 general
            return 'general';
        }
    }
    let maxScore = 0;
    let detectedIntent = 'general';
    // 计算每个意图的加权分数
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
        if (keywords.length === 0)
            continue;
        let score = 0;
        for (const { keyword, weight } of keywords) {
            if (queryLower.includes(keyword)) {
                score += weight;
            }
        }
        if (score > maxScore) {
            maxScore = score;
            detectedIntent = intent;
        }
    }
    return detectedIntent;
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
/**
 * 计算上下文项的重要性分数
 * 基于路径重要性、内容质量、访问频率等因素
 * 返回值范围：0-1，1 表示最重要
 */
function calculateImportance(item) {
    const cfg = exports.IMPORTANCE_CONFIG;
    let score = cfg.BASE_SCORE;
    const path = item.path.toLowerCase();
    // ===== 路径重要性分析 =====
    // 核心目录加分 - 使用更精确的路径匹配
    // 通过检查路径开头或包含 /边界/ 来避免误匹配
    for (const corePath of cfg.CORE_PATHS) {
        // 精确匹配：路径以核心目录开头，或包含 /核心目录/ 的模式
        if (path.startsWith(corePath + '/') || path.includes('/' + corePath + '/')) {
            score += cfg.CORE_PATH_BOOST;
            break;
        }
    }
    // 重要源码目录加分 - 使用精确匹配
    for (const sourcePath of cfg.SOURCE_PATHS) {
        if (path.startsWith(sourcePath) || path.includes('/' + sourcePath)) {
            score += cfg.SOURCE_PATH_BOOST;
            break;
        }
    }
    // 测试文件减分 - 使用路径边界检查避免误匹配
    // 正则解释：/(\/|^__) → 以 / 或 __ 开头，(tests?|spec) → test/tests/spec，(\/|$) → 以 / 或 结尾
    // 匹配：/test/, /spec/, __tests__, src/test/, api_spec.ts 等
    // 不匹配：my-test-utils/, testing/, spectator/ 等
    if (/(\/|^__)(tests?|spec)(\/|$)/.test(path)) {
        score -= cfg.TEST_FILE_PENALTY;
    }
    // 配置文件加分 - 使用更精确的路径匹配
    // /\/config\// → 匹配 /config/ 目录（如 /config/database.ts）
    // /\/configs?\// → 匹配 /config/ 或 /configs/ 目录
    // /\.?config\.[a-z]+$/ → 匹配 .config.js 或 config.ts 等文件
    // 匹配：/config/app.ts, tsconfig.json, vite.config.js 等
    // 不匹配：my-config/, reconfigure.ts, deconfigurate/ 等
    if (/\/config\//.test(path) || /\/configs?\//.test(path) ||
        path.endsWith('.config.js') || path.endsWith('.config.json') ||
        path.endsWith('.config.ts') || /\/\.?config\.[a-z]+$/.test(path)) {
        score += cfg.CONFIG_FILE_BOOST;
    }
    else if (path.endsWith('.json') || path.endsWith('.yaml') || path.endsWith('.yml')) {
        // JSON/YAML 文件也加分（但权重较低，因为不一定是配置文件）
        score += cfg.CONFIG_FILE_BOOST * 0.5;
    }
    // 文档文件减分
    // 匹配：README.md, /docs/api.md, docs/guide.md 等
    if (path.endsWith('.md') || path.includes('/docs/') || path.startsWith('docs/')) {
        score -= cfg.DOC_FILE_PENALTY;
    }
    // ===== 内容质量分析 =====
    const contentLength = (item.content || item.summary || '').length;
    // 内容太短可能是低价值
    if (contentLength < cfg.MIN_CONTENT_LENGTH) {
        score -= cfg.SHORT_CONTENT_PENALTY;
    }
    else if (contentLength > cfg.LONG_CONTENT_THRESHOLD) {
        // 内容丰富加分
        score += cfg.LONG_CONTENT_BOOST;
    }
    else if (contentLength > cfg.MEDIUM_CONTENT_THRESHOLD) {
        score += cfg.MEDIUM_CONTENT_BOOST;
    }
    // ===== 访问频率分析 =====
    const accessCount = item.accessCount || 1;
    // 高频访问加分
    if (accessCount > cfg.HIGH_ACCESS_COUNT) {
        score += cfg.HIGH_ACCESS_BOOST;
    }
    else if (accessCount > cfg.MEDIUM_ACCESS_COUNT) {
        score += cfg.MEDIUM_ACCESS_BOOST;
    }
    else if (accessCount > cfg.LOW_ACCESS_COUNT) {
        score += cfg.LOW_ACCESS_BOOST;
    }
    // ===== 状态分析 =====
    // stale 状态减分
    if (item.status === 'stale' || item.status === 'expired') {
        score -= cfg.STALE_STATUS_PENALTY;
    }
    // ===== 特殊标记 =====
    // pinned 的项目高重要性
    if (item.pinned) {
        score = Math.max(score, cfg.PINNED_MIN_SCORE);
    }
    // 重要标签加分
    if (item.tags) {
        if (item.tags.some(tag => cfg.IMPORTANT_TAGS.includes(tag))) {
            score += cfg.IMPORTANT_TAG_BOOST;
        }
    }
    // 确保分数在 0-1 范围内
    return Math.max(cfg.MIN_SCORE, Math.min(cfg.MAX_SCORE, score));
}
/**
 * 计算时间衰减分数
 * 基于最后访问时间、添加时间和访问频率
 * 使用指数衰减模型：score = e^(-days/halfLife)
 */
function calculateRecencyScore(item) {
    const cfg = exports.RECENCY_CONFIG;
    const now = Date.now();
    // 如果没有时间戳，返回中等分数
    if (!item.lastUsedAt && !item.addedAt) {
        return cfg.DEFAULT_DECAY_SCORE;
    }
    // 使用 lastUsedAt 作为主要时间戳，如果没有则使用 addedAt
    const lastAccess = item.lastUsedAt || item.addedAt || now;
    const daysSinceAccess = (now - lastAccess) / (1000 * 60 * 60 * 24);
    // 获取自定义半衰期
    // decayRate 越大，衰减越快（半衰期越短）
    // 添加输入验证：decayRate 必须为正数，否则使用默认值
    let halfLifeDays = cfg.DEFAULT_HALF_LIFE_DAYS;
    if (item.decayRate && item.decayRate > 0) {
        halfLifeDays = cfg.DEFAULT_HALF_LIFE_DAYS / item.decayRate;
    }
    // 如果 decayRate 为 0、负数或无效，使用默认半衰期
    // 指数衰减：越久远权重越低
    const decayFactor = Math.exp(-daysSinceAccess / halfLifeDays);
    // 访问频率加成：常访问的衰减慢
    // 每次访问增加配置的加成因子，最多达到最大倍数
    const accessCount = item.accessCount || 1;
    const frequencyBoost = Math.min(1 + (accessCount - 1) * cfg.FREQUENCY_BOOST_FACTOR, cfg.MAX_FREQUENCY_BOOST_MULTIPLIER);
    // pinned 的项目不衰减
    if (item.pinned) {
        return cfg.PINNED_SCORE;
    }
    return Math.min(decayFactor * frequencyBoost, 1);
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