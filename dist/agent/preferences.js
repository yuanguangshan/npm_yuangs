"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferencesManager = void 0;
exports.buildPersonalizedPrompt = buildPersonalizedPrompt;
exports.applyOutputFormat = applyOutputFormat;
exports.buildContextStrategyPrompt = buildContextStrategyPrompt;
const DEFAULT_PREFERENCES = {
    verbosity: 'normal',
    language: 'auto',
    codeStyle: 'any',
    explanation: 'adaptive',
    outputFormat: 'markdown',
    autoConfirm: false,
    contextStrategy: 'smart'
};
class PreferencesManager {
    static preferences = DEFAULT_PREFERENCES;
    static getPreferences() {
        return { ...this.preferences };
    }
    static setPreferences(updates) {
        this.preferences = { ...this.preferences, ...updates };
        this.savePreferences();
    }
    static getPreference(key) {
        return this.preferences[key];
    }
    static savePreferences() {
        try {
            const fs = require('fs');
            const path = require('path');
            const os = require('os');
            const configPath = path.join(os.homedir(), '.yuangs_preferences.json');
            fs.writeFileSync(configPath, JSON.stringify(this.preferences, null, 2), 'utf8');
        }
        catch (error) {
            console.warn('Failed to save preferences:', error);
        }
    }
    static loadPreferences() {
        try {
            const fs = require('fs');
            const path = require('path');
            const os = require('os');
            const configPath = path.join(os.homedir(), '.yuangs_preferences.json');
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf8');
                this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(content) };
            }
        }
        catch (error) {
            console.warn('Failed to load preferences, using defaults:', error);
        }
    }
    static resetPreferences() {
        this.preferences = { ...DEFAULT_PREFERENCES };
        this.savePreferences();
    }
}
exports.PreferencesManager = PreferencesManager;
function buildPersonalizedPrompt(basePrompt, preferences) {
    const prefs = { ...DEFAULT_PREFERENCES, ...preferences };
    let personalized = basePrompt;
    if (prefs.verbosity === 'concise') {
        personalized += '\n\n【简洁模式】\n- 只提供直接答案\n- 省略详细解释\n- 除非明确要求';
    }
    else if (prefs.verbosity === 'detailed') {
        personalized += '\n\n【详细模式】\n- 提供全面的解释\n- 包含示例和背景\n- 说明技术细节';
    }
    if (prefs.language !== 'auto') {
        personalized += `\n\n【语言设置】\n请使用 ${prefs.language} 回答`;
    }
    if (prefs.explanation === 'beginner') {
        personalized += '\n\n【新手友好】\n- 避免专业术语\n- 逐步解释概念\n- 提供更多示例';
    }
    else if (prefs.explanation === 'technical') {
        personalized += '\n\n【技术模式】\n- 使用标准术语\n- 直接切入技术细节\n- 省略基础概念解释';
    }
    if (prefs.codeStyle === 'functional') {
        personalized += '\n\n【函数式代码风格】\n- 优先使用纯函数\n- 避免副作用\n- 强调不可变性';
    }
    else if (prefs.codeStyle === 'imperative') {
        personalized += '\n\n【命令式代码风格】\n- 优先使用循环和条件\n- 明确的状态变更\n- 过程化思维';
    }
    return personalized;
}
function applyOutputFormat(content, format) {
    switch (format) {
        case 'plain':
            return content
                .replace(/#{1,6}\s/g, '')
                .replace(/\*\*/g, '')
                .replace(/`[^`]+`/g, '$1')
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                .trim();
        case 'structured':
            const sections = content.split(/\n#{2,6}\s+/).filter(s => s.trim());
            if (sections.length > 1) {
                return JSON.stringify({
                    sections: sections.map(s => ({
                        content: s.trim(),
                        length: s.length
                    }))
                }, null, 2);
            }
            return content;
        case 'markdown':
        default:
            return content;
    }
}
function buildContextStrategyPrompt(strategy) {
    switch (strategy) {
        case 'minimal':
            return `
【上下文策略：最小化】
- 只使用明确引用的文件和目录
- 不进行隐式文件系统扫描
- 最小化Token使用`;
        case 'full':
            return `
【上下文策略：完全包含】
- 使用所有可用的上下文
- 不进行Token限制
- 包含所有相关信息`;
        case 'smart':
        default:
            return `
【上下文策略：智能筛选】
- 优先使用明确引用的文件 (@, #语法)
- 其次使用高度相关的文件
- 根据Token预算动态调整`;
    }
}
PreferencesManager.loadPreferences();
//# sourceMappingURL=preferences.js.map