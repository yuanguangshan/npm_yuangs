import { AIRequestMessage } from '../../core/validation';

export type SamplingStrategy = "head_tail" | "random" | "none";

export interface ContextEstimate {
    byteSize: number;
    lineCount?: number;
}

export interface ResolvedContext {
    content: string;
    byteSize: number;
}

export interface PendingContextItem {
    id: string; // 路径或标识符
    type: "file" | "dir" | "pipe" | "history";
    originalToken: string;
    samplingStrategy: SamplingStrategy;

    // 延迟加载：仅获取元数据用于估算（无 IO 读取内容）
    estimate?: () => Promise<ContextEstimate>;

    // 授权执行：真正读取内容
    resolve: () => Promise<ResolvedContext>;
}

export interface ModelSpec {
    name: string;
    contextWindow: number;
    costTier: "low" | "medium" | "high";
    longContextCapable: boolean;
}

// ========== 输入结构 ==========

export interface TokenPolicyInput {
    model: ModelSpec;
    contextItems: PendingContextItem[];
    mode: "command" | "pipe" | "agent";
    userIntent?: string;
}

// ========== 估算摘要 ==========

export interface EstimateSummary {
    totalBytes: number;
    estimatedTokens: number;
    warnings: Array<{ item: string; message: string }>;
    blockingError?: string; // 如果存在，必须 block
}

// ========== 输出结构 ==========

export interface TokenPolicyResult {
    status: "ok" | "warn" | "block";
    estimatedTokens: number;
    limit: number;
    ratio: number;
    message?: string;
    actions?: TokenAction[];
    warnings?: string[];
}

// ========== 决策操作 ==========

export type TokenAction =
    | { type: "confirm_continue"; label: string; desc: string }
    | { type: "auto_sample_pipe"; label: string; desc: string; strategy: "head_tail" }
    | { type: "suggest_model_switch"; label: string; desc: string; targetModel: string }
    | { type: "abort"; label: string; desc: string };

// ========== TokenPolicy 接口 ==========

export interface TokenPolicy {
    evaluate(input: TokenPolicyInput): Promise<TokenPolicyResult>;
}

// ========== 用户决策 ==========

export interface UserDecision {
    type: "continue" | "sample" | "switch_model" | "abort";
    targetModel?: string;
    strategy?: SamplingStrategy;
}
