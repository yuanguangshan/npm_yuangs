/**
 * Git 能力等级枚举
 *
 * 定义了不同层级的代码理解和处理能力，用于：
 * - 评估任务的复杂度
 * - 决定降级策略
 * - 选择合适的 AI 模型和工具
 *
 * 等级说明：
 * - SEMANTIC (5): 语义理解，需要理解代码意图和设计模式
 * - STRUCTURAL (4): 结构分析，需要理解代码结构和依赖关系
 * - LINE (3): 行级分析，需要理解具体代码行逻辑
 * - TEXT (2): 文本分析，只需要处理文本内容
 * - NONE (1): 无需智能分析
 */
export declare enum CapabilityLevel {
    SEMANTIC = 5,
    STRUCTURAL = 4,
    LINE = 3,
    TEXT = 2,
    NONE = 1
}
/**
 * 将 CapabilityLevel 枚举转换为字符串
 * @param level 能力等级
 * @returns 字符串表示
 */
export declare function capabilityLevelToString(level: CapabilityLevel): string;
/**
 * 将字符串转换为 CapabilityLevel
 * 用于从配置或 LLM 输出解析能力等级
 *
 * @param str 能力等级字符串（不区分大小写）
 * @returns CapabilityLevel 枚举值，如果字符串无效则返回 undefined
 *
 * @example
 * ```typescript
 * const level = stringToCapabilityLevel('semantic');
 * console.log(level); // CapabilityLevel.SEMANTIC
 *
 * const invalid = stringToCapabilityLevel('INVALID');
 * console.log(invalid); // undefined
 * ```
 */
export declare function stringToCapabilityLevel(str: string): CapabilityLevel | undefined;
/**
 * 比较两个能力等级
 * @param a 第一个能力等级
 * @param b 第二个能力等级
 * @returns 正数表示 a > b，负数表示 a < b，0 表示相等
 */
export declare function compareCapabilities(a: CapabilityLevel, b: CapabilityLevel): number;
/**
 * 判断能力等级 a 是否高于 b
 * @param a 第一个能力等级
 * @param b 第二个能力等级
 * @returns 如果 a > b 返回 true
 */
export declare function isCapabilityHigher(a: CapabilityLevel, b: CapabilityLevel): boolean;
/**
 * 判断能力等级 a 是否低于 b
 * @param a 第一个能力等级
 * @param b 第二个能力等级
 * @returns 如果 a < b 返回 true
 */
export declare function isCapabilityLower(a: CapabilityLevel, b: CapabilityLevel): boolean;
/**
 * 验证能力等级序列的单调性（严格递减）
 * 用于检查 fallbackChain 是否符合从高到低的要求
 *
 * @param levels 能力等级数组
 * @returns 如果序列严格递减返回 true
 *
 * @example
 * ```typescript
 * validateCapabilityMonotonicity([
 *   CapabilityLevel.SEMANTIC,
 *   CapabilityLevel.STRUCTURAL,
 *   CapabilityLevel.NONE
 * ]); // true
 *
 * validateCapabilityMonotonicity([
 *   CapabilityLevel.TEXT,
 *   CapabilityLevel.SEMANTIC
 * ]); // false
 * ```
 */
export declare function validateCapabilityMonotonicity(levels: CapabilityLevel[]): boolean;
/**
 * 最小能力和降级链接口
 * 定义模块的能力需求和降级路径
 */
export interface MinCapability {
    minCapability: CapabilityLevel;
    fallbackChain: CapabilityLevel[];
}
/**
 * 验证降级链的有效性
 *
 * 规则：
 * 1. 降级链必须严格递减（从高到低）
 * 2. 降级链必须以 NONE 结束
 *
 * @param minCapability 包含最小能力和降级链的对象
 * @returns 如果降级链有效返回 true
 *
 * @example
 * ```typescript
 * validateFallbackChain({
 *   minCapability: CapabilityLevel.SEMANTIC,
 *   fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.TEXT, CapabilityLevel.NONE]
 * }); // true
 *
 * validateFallbackChain({
 *   minCapability: CapabilityLevel.SEMANTIC,
 *   fallbackChain: [CapabilityLevel.NONE]
 * }); // true
 *
 * validateFallbackChain({
 *   minCapability: CapabilityLevel.SEMANTIC,
 *   fallbackChain: [CapabilityLevel.TEXT] // 未以 NONE 结束
 * }); // false
 * ```
 */
export declare function validateFallbackChain(minCapability: MinCapability): boolean;
