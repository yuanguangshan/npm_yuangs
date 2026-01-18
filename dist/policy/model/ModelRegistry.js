"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelRegistry = void 0;
const capabilities_1 = require("../../core/capabilities");
/**
 * ModelRegistry - 模型规格注册表
 *
 * 将现有的 ModelCapabilities 扩展为 ModelSpec，
 * 提供统一的模型信息查询接口。
 */
class ModelRegistry {
    models = new Map();
    constructor(baseCapabilities) {
        baseCapabilities.forEach(cap => this.register(cap));
    }
    /**
     * 注册模型规格
     */
    register(cap) {
        const spec = {
            name: cap.name,
            contextWindow: cap.contextWindow ?? 32768,
            costTier: cap.costProfile ?? 'medium',
            longContextCapable: cap.atomicCapabilities.includes(capabilities_1.AtomicCapability.LONG_CONTEXT)
        };
        this.models.set(cap.name, spec);
    }
    /**
     * 根据名称获取模型规格
     */
    get(name) {
        return this.models.get(name);
    }
    /**
     * 获取默认模型
     */
    getDefault() {
        const defaultModel = this.get('gemini-2.5-flash-lite');
        if (!defaultModel) {
            throw new Error('Default model not found in registry');
        }
        return defaultModel;
    }
    /**
     * 查找所有支持长文本的模型
     * 按上下文窗口大小降序排列
     */
    findLongContextCapable() {
        return Array.from(this.models.values())
            .filter(m => m.longContextCapable)
            .sort((a, b) => b.contextWindow - a.contextWindow);
    }
    /**
     * 查找最佳长文本模型
     * 返回上下文窗口最大的模型
     */
    findBestLongContextModel() {
        const longContextModels = this.findLongContextCapable();
        return longContextModels.length > 0 ? longContextModels[0] : undefined;
    }
    /**
     * 列出所有已注册的模型
     */
    listModels() {
        return Array.from(this.models.values());
    }
}
exports.ModelRegistry = ModelRegistry;
//# sourceMappingURL=ModelRegistry.js.map