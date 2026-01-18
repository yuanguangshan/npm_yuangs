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
    id: string;
    type: "file" | "dir" | "pipe" | "history";
    originalToken: string;
    samplingStrategy: SamplingStrategy;
    estimate?: () => Promise<ContextEstimate>;
    resolve: () => Promise<ResolvedContext>;
}
export interface ModelSpec {
    name: string;
    contextWindow: number;
    costTier: "low" | "medium" | "high";
    longContextCapable: boolean;
}
export interface TokenPolicyInput {
    model: ModelSpec;
    contextItems: PendingContextItem[];
    mode: "command" | "pipe" | "agent";
    userIntent?: string;
}
export interface EstimateSummary {
    totalBytes: number;
    estimatedTokens: number;
    warnings: Array<{
        item: string;
        message: string;
    }>;
    blockingError?: string;
}
export interface TokenPolicyResult {
    status: "ok" | "warn" | "block";
    estimatedTokens: number;
    limit: number;
    ratio: number;
    message?: string;
    actions?: TokenAction[];
    warnings?: string[];
}
export type TokenAction = {
    type: "confirm_continue";
    label: string;
    desc: string;
} | {
    type: "auto_sample_pipe";
    label: string;
    desc: string;
    strategy: "head_tail";
} | {
    type: "suggest_model_switch";
    label: string;
    desc: string;
    targetModel: string;
} | {
    type: "abort";
    label: string;
    desc: string;
};
export interface TokenPolicy {
    evaluate(input: TokenPolicyInput): Promise<TokenPolicyResult>;
}
export interface UserDecision {
    type: "continue" | "sample" | "switch_model" | "abort";
    targetModel?: string;
    strategy?: SamplingStrategy;
}
