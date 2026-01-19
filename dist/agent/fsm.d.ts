import { AgentState } from './state';
export declare class GovernanceFSM {
    private _state;
    private _history;
    private _transitionLog;
    get current(): AgentState;
    get history(): AgentState[];
    get transitionLog(): Array<{
        from: AgentState;
        to: AgentState;
        timestamp: number;
        payload?: any;
    }>;
    transitionTo(target: AgentState, payload?: any): void;
    private canTransition;
    isTerminal(): boolean;
    reset(): void;
    getStateInfo(): {
        current: AgentState;
        history: AgentState[];
        transitionCount: number;
    };
}
