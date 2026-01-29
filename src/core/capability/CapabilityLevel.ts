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

export enum CapabilityLevel {
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
export function validateStrictDecreasing(chain: CapabilityLevel[]): boolean {
  if (chain.length === 0) return true;
  for (let i = 0; i < chain.length - 1; i++) {
    if (chain[i] <= chain[i + 1]) return false;
  }
  return chain[chain.length - 1] === CapabilityLevel.NONE;
}

/**
 * 能力等级的可读标签
 */
export const CapabilityLevelLabel: Record<CapabilityLevel, string> = {
  [CapabilityLevel.SEMANTIC]: 'semantic',
  [CapabilityLevel.STRUCTURAL]: 'structural',
  [CapabilityLevel.LINE]: 'line',
  [CapabilityLevel.TEXT]: 'text',
  [CapabilityLevel.NONE]: 'none'
};

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
export function parseCapabilityLevel(value?: string | number, fallback = CapabilityLevel.NONE): CapabilityLevel {
  if (value === undefined || value === null) return fallback;

  if (typeof value === 'number') {
    return CapabilityLevel[value] !== undefined ? value : fallback;
  }

  const normalized = value.toString().toLowerCase();

  // 1. 尝试按标签匹配
  for (const [level, label] of Object.entries(CapabilityLevelLabel)) {
    if (label === normalized) return Number(level) as CapabilityLevel;
  }

  // 2. 尝试解析数值字符串
  const numeric = parseInt(normalized);
  if (!isNaN(numeric)) {
    return CapabilityLevel[numeric] !== undefined ? numeric : fallback;
  }

  return fallback;
}

/**
 * 判断能力是否满足要求
 */
export function canExecute(current: CapabilityLevel, required: CapabilityLevel): boolean {
  return current >= required;
}

/**
 * 获取能力等级的友好显示名称
 */
export function describeCapabilityLevel(level: CapabilityLevel): string {
  switch (level) {
    case CapabilityLevel.SEMANTIC: return '极致语义 (Semantic)';
    case CapabilityLevel.STRUCTURAL: return '结构分析 (Structural)';
    case CapabilityLevel.LINE: return '行级分析 (Line)';
    case CapabilityLevel.TEXT: return '文本处理 (Text)';
    default: return '无智能要求 (None)';
  }
}

/**
 * 将CapabilityLevel转换为字符串
 */
export function capabilityLevelToString(level: CapabilityLevel): string {
  switch (level) {
    case CapabilityLevel.SEMANTIC: return 'SEMANTIC';
    case CapabilityLevel.STRUCTURAL: return 'STRUCTURAL';
    case CapabilityLevel.LINE: return 'LINE';
    case CapabilityLevel.TEXT: return 'TEXT';
    case CapabilityLevel.NONE: return 'NONE';
    default: throw new Error(`Unknown capability level: ${level}`);
  }
}

/**
 * 将字符串转换为CapabilityLevel
 */
export function stringToCapabilityLevel(str: string): CapabilityLevel | undefined {
  const upper = str.toUpperCase();
  switch (upper) {
    case 'SEMANTIC': return CapabilityLevel.SEMANTIC;
    case 'STRUCTURAL': return CapabilityLevel.STRUCTURAL;
    case 'LINE': return CapabilityLevel.LINE;
    case 'TEXT': return CapabilityLevel.TEXT;
    case 'NONE': return CapabilityLevel.NONE;
    default: return undefined;
  }
}

/**
 * 比较两个能力等级
 */
export function compareCapabilities(a: CapabilityLevel, b: CapabilityLevel): number {
  if (a === b) return 0;
  return a > b ? 1 : -1;
}

/**
 * 判断能力A是否高于能力B
 */
export function isCapabilityHigher(a: CapabilityLevel, b: CapabilityLevel): boolean {
  return a > b;
}

/**
 * 判断能力A是否低于能力B
 */
export function isCapabilityLower(a: CapabilityLevel, b: CapabilityLevel): boolean {
  return a < b;
}

/**
 * 校验能力链的单调性（严格递减）
 */
export function validateCapabilityMonotonicity(chain: CapabilityLevel[]): boolean {
  for (let i = 0; i < chain.length - 1; i++) {
    if (chain[i] <= chain[i + 1]) return false;
  }
  return true;
}

/**
 * 校验降级链配置
 */
export function validateFallbackChain(config: { minCapability: CapabilityLevel; fallbackChain: CapabilityLevel[] }): boolean {
  // 空链是有效的
  if (config.fallbackChain.length === 0) return true;
  
  // 链必须单调递减
  if (!validateCapabilityMonotonicity(config.fallbackChain)) return false;
  
  // 链必须以NONE结尾
  const last = config.fallbackChain[config.fallbackChain.length - 1];
  if (last !== CapabilityLevel.NONE) return false;
  
  return true;
}
