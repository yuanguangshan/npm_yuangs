import { randomUUID } from 'crypto';

export type AgentState = 
  | 'IDLE' 
  | 'THINKING' 
  | 'PROPOSING' 
  | 'GOVERNING' 
  | 'EXECUTING' 
  | 'OBSERVING' 
  | 'EVALUATING' 
  | 'TERMINAL';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface ProposedAction {
  id: string;
  type: 'tool_call' | 'code_diff' | 'shell_cmd' | 'answer';
  payload: any;
  riskLevel: RiskLevel;
  reasoning: string;
}

export type GovernanceDecision = 
  | { status: 'approved'; by: 'policy' | 'human'; timestamp: number }
  | { status: 'rejected'; by: 'policy' | 'human'; reason: string; timestamp: number }
  | { 
      status: 'modified'; 
      by: 'human'; 
      originalActionId: string;
      modifiedAction: ProposedAction;
      modificationReason: string;
      timestamp: number;
    };

export type EvaluationOutcome = 
  | { kind: 'continue'; reason: 'incomplete' | 'failure_retry' }
  | { kind: 'terminate'; reason: 'goal_satisfied' | 'user_abort' | 'max_turns_exceeded' }
  | { kind: 'pause'; reason: 'await_human_input' };

export interface AgentThought {
  raw: string;
  parsedPlan: any;
  isDone: boolean;
  type?: 'tool_call' | 'code_diff' | 'shell_cmd' | 'answer';
  payload?: any;
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
    recentMessages: Array<{ role: string; content: string; timestamp: number }>;
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
}

export interface GovernanceContext {
  input: string;
  mode: 'chat' | 'command' | 'command+exec';
  history: AIRequestMessage[];
  files?: Array<{ path: string; content: string }>;
}

interface AIRequestMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
}
