export type AgentState = 'IDLE' | 'THINKING' | 'PROPOSING' | 'GOVERNING' | 'EXECUTING' | 'OBSERVING' | 'EVALUATING' | 'TERMINAL';
export type RiskLevel = 'low' | 'medium' | 'high';
export interface ToolCallPayload {
    tool_name: string;
    parameters: Record<string, unknown>;
    risk_level?: RiskLevel;
}
export interface ShellCmdPayload {
    command: string;
    risk_level?: RiskLevel;
}
export interface AnswerPayload {
    content?: string;
    text?: string;
    risk_level?: RiskLevel;
}
/** 联合载荷类型，兼容所有访问模式 */
export type ProposedActionPayload = ToolCallPayload | ShellCmdPayload | AnswerPayload | Record<string, unknown>;
export interface ParsedPlan {
    acknowledged_observation?: string;
    goal?: string;
}
export interface LLMPlan {
    goal?: string;
    command?: string;
    parameters?: Record<string, unknown>;
    risk_level?: RiskLevel;
}
/** 类型守卫辅助 */
export declare function isToolCallPayload(payload: ProposedActionPayload): payload is ToolCallPayload;
export declare function isShellCmdPayload(payload: ProposedActionPayload): payload is ShellCmdPayload;
export declare function isAnswerPayload(payload: ProposedActionPayload): payload is AnswerPayload;
export interface ProposedAction {
    id: string;
    type: 'tool_call' | 'code_diff' | 'shell_cmd' | 'answer';
    payload: ProposedActionPayload;
    riskLevel: RiskLevel;
    reasoning: string;
}
export type GovernanceDecision = {
    status: 'approved';
    by: 'policy' | 'human';
    timestamp: number;
    riskScore?: number;
} | {
    status: 'rejected';
    by: 'policy' | 'human';
    reason: string;
    timestamp: number;
    riskScore?: number;
} | {
    status: 'modified';
    by: 'human';
    originalActionId: string;
    modifiedAction: ProposedAction;
    modificationReason: string;
    timestamp: number;
    riskScore?: number;
};
export type EvaluationOutcome = {
    kind: 'continue';
    reason: 'incomplete' | 'failure_retry';
} | {
    kind: 'terminate';
    reason: 'goal_satisfied' | 'user_abort' | 'max_turns_exceeded';
} | {
    kind: 'pause';
    reason: 'await_human_input';
};
export interface AgentThought {
    raw: string;
    parsedPlan?: ParsedPlan;
    isDone: boolean;
    type?: 'tool_call' | 'code_diff' | 'shell_cmd' | 'answer';
    payload?: ProposedActionPayload;
    reasoning?: string;
    modelName?: string;
    usedRouter?: boolean;
}
export interface ExecutionTurn {
    turnId: number;
    startTime: number;
    endTime?: number;
    contextSnapshot: {
        inputHash: string;
        systemPromptVersion: string;
        toolSetVersion: string;
        recentMessages: Array<{
            role: string;
            content: string;
            timestamp: number;
        }>;
    };
    thought?: AgentThought;
    proposedAction?: ProposedAction;
    governance?: GovernanceDecision;
    executionResult?: {
        success: boolean;
        output: string;
        error?: string;
        artifacts?: string[];
    };
    observation?: {
        summary: string;
        artifacts: string[];
        truncated?: boolean;
    };
    evaluation?: EvaluationOutcome;
}
export interface GovernanceLoopConfig {
    maxTurns: number;
    autoApproveLowRisk: boolean;
    verbose: boolean;
}
export interface ToolExecutionResult {
    success: boolean;
    output: string;
    error?: string;
    artifacts?: string[];
    needsContinue?: boolean;
    readPosition?: number;
}
export interface GovernanceContext {
    input: string;
    mode: 'chat' | 'command' | 'command+exec';
    history: AIRequestMessage[];
    files?: Array<{
        path: string;
        content: string;
    }>;
}
interface AIRequestMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
}
export {};
