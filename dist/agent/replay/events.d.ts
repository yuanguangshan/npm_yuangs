export type EventType = 'state_transition' | 'llm_call' | 'tool_execution' | 'governance_decision' | 'observation_recorded' | 'evaluation_result' | 'error_occurred';
export interface RuntimeEvent {
    id: string;
    timestamp: number;
    executionId: string;
    type: EventType;
    data: {
        from?: string;
        to?: string;
        action?: any;
        decision?: any;
        result?: any;
        error?: string;
    };
    metadata?: Record<string, any>;
}
export interface EventRecorder {
    record(event: RuntimeEvent): void;
    flush(): Promise<void>;
    getEvents(executionId?: string): RuntimeEvent[];
}
