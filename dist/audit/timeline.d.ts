import type { ExecutionTurn } from '../agent/state';
export type AuditEventType = 'macro_started' | 'macro_finished' | 'state_transition' | 'capability_requested' | 'capability_granted' | 'capability_denied' | 'human_approval_requested' | 'human_approved' | 'human_rejected' | 'tool_executed' | 'error_occurred';
export interface AuditEvent {
    id: string;
    timestamp: number;
    executionId: string;
    type: AuditEventType;
    data: {
        macroId?: string;
        macroVersion?: string;
        turnId?: number;
        fromState?: string;
        toState?: string;
        capability?: string;
        reason?: string;
        toolName?: string;
        toolParams?: any;
        success?: boolean;
        error?: string;
        approver?: string;
        duration?: number;
    };
    metadata?: Record<string, any>;
}
export interface ExecutionTimeline {
    executionId: string;
    startTime: number;
    endTime?: number;
    events: AuditEvent[];
    summary: ExecutionSummary;
}
export interface ExecutionSummary {
    totalDuration?: number;
    totalTurns: number;
    successfulTurns: number;
    failedTurns: number;
    capabilitiesRequested: Set<string>;
    capabilitiesGranted: Set<string>;
    capabilitiesDenied: Set<string>;
    toolsUsed: Map<string, number>;
    errors: Array<{
        turn: number;
        message: string;
    }>;
    humanApprovals: number;
    humanRejections: number;
}
export interface EffectsSummary {
    filesRead: string[];
    filesWritten: string[];
    filesModified: string[];
    commandsExecuted: Array<{
        command: string;
        success: boolean;
    }>;
    networkRequests: Array<{
        url: string;
        method?: string;
    }>;
    secretsAccessed: string[];
}
export declare class AuditTimeline {
    private events;
    private executionId;
    private startTime;
    constructor(executionId: string);
    record(event: Omit<AuditEvent, 'id' | 'timestamp' | 'executionId'>): void;
    recordTurn(turn: ExecutionTurn): void;
    generateTimeline(): ExecutionTimeline;
    generateEffectsSummary(turns: ExecutionTurn[]): EffectsSummary;
    toJSON(): string;
    toMarkdown(): string;
    private generateSummary;
    private generateEventId;
}
