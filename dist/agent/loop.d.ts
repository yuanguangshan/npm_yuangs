import { AgentState, ExecutionTurn, GovernanceLoopConfig, GovernanceContext } from './state';
import { ContextManager } from './contextManager';
export declare class GovernedAgentLoop {
    private fsm;
    private context;
    private turns;
    private config;
    constructor(initialContext: GovernanceContext, config?: Partial<GovernanceLoopConfig>);
    run(): Promise<ExecutionTurn[]>;
    private executeTurn;
    private handleThinking;
    private handleProposing;
    private handleGoverning;
    private handleExecuting;
    private handleObserving;
    private handleEvaluating;
    private logTurnSummary;
    getTurns(): ExecutionTurn[];
    getFSMState(): AgentState;
    getContext(): ContextManager;
}
