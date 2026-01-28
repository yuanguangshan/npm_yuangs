/**
 * CapabilityLevel
 * ----------------
 * 定义系统中「能力（Capability）」的智能等级。
 *
 * 该等级用于：
 * - AI Capability 匹配
 * - 模型路由规划
 * - 执行阶段降级决策
 * - todo.md 任务标注
 *
 * 级别说明：
 * - SEMANTIC: 极致语义，理解业务意图和全局架构
 * - STRUCTURAL: 结构分析，理解代码依赖和模块接口
 * - LINE: 行级操作，关注具体逻辑实现
 * - TEXT: 文本处理，简单的替换或格式化
 * - NONE: 无智能要求
 */
export declare enum CapabilityLevel {
    /** 极致语义：理解业务、架构和设计意图 */
    SEMANTIC = 4,
    /** 结构分析：理解模块依赖、接口和类结构 */
    STRUCTURAL = 3,
    /** 行级分析：理解具体的代码行逻辑 */
    LINE = 2,
    /** 文本分析：简单的字符串处理和文本替换 */
    TEXT = 1,
    /** 无需智能分析 */
    NONE = 0
}
/**
 * 校验 Capability 降级链是否严格单调递减，且最终降级到 NONE
 */
export declare function validateStrictDecreasing(chain: CapabilityLevel[]): boolean;
/**
 * 能力等级的可读标签
 */
export declare const CapabilityLevelLabel: Record<CapabilityLevel, string>;
/**
 * 最小能力要求配置接口
 */
export interface MinCapability {
    minCapability: CapabilityLevel;
    fallbackChain: CapabilityLevel[];
}
/**
 * 从字符串解析 CapabilityLevel (支持标签或数值字符串)
 */
export declare function parseCapabilityLevel(value?: string | number, fallback?: CapabilityLevel): CapabilityLevel;
/**
 * 判断能力是否满足要求
 */
export declare function canExecute(current: CapabilityLevel, required: CapabilityLevel): boolean;
/**
 * 获取能力等级的友好显示名称
 */
export declare function describeCapabilityLevel(level: CapabilityLevel): string;
