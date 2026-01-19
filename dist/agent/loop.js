"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernedAgentLoop = void 0;
const fsm_1 = require("./fsm");
const llmAdapter_1 = require("./llmAdapter");
const governance_1 = require("./governance");
const executor_1 = require("./executor");
const contextManager_1 = require("./contextManager");
const crypto_1 = require("crypto");
const chalk_1 = __importDefault(require("chalk"));
class GovernedAgentLoop {
    fsm = new fsm_1.GovernanceFSM();
    context;
    turns = [];
    config;
    constructor(initialContext, config) {
        this.context = new contextManager_1.ContextManager(initialContext);
        this.config = {
            maxTurns: 20,
            autoApproveLowRisk: true,
            verbose: false,
            ...config
        };
    }
    async run() {
        this.fsm.transitionTo('THINKING');
        let turnCount = 0;
        while (turnCount < this.config.maxTurns && !this.fsm.isTerminal()) {
            const turn = {
                turnId: turnCount + 1,
                startTime: Date.now(),
                contextSnapshot: this.context.getSnapshot()
            };
            try {
                await this.executeTurn(turn);
                turn.endTime = Date.now();
                this.turns.push(turn);
                turnCount++;
                if (this.config.verbose) {
                    this.logTurnSummary(turn);
                }
            }
            catch (error) {
                console.error(chalk_1.default.red(`[Loop Error] Turn ${turn.turnId} failed: ${error.message}`));
                this.fsm.transitionTo('TERMINAL');
                turn.endTime = Date.now();
                this.turns.push(turn);
                break;
            }
        }
        if (turnCount >= this.config.maxTurns) {
            console.log(chalk_1.default.yellow(`\n⚠️  Max turns (${this.config.maxTurns}) reached`));
        }
        return this.turns;
    }
    async executeTurn(turn) {
        if (this.fsm.current === 'THINKING') {
            await this.handleThinking(turn);
        }
        if (this.fsm.current === 'PROPOSING') {
            await this.handleProposing(turn);
        }
        if (this.fsm.current === 'GOVERNING') {
            await this.handleGoverning(turn);
        }
        if (this.fsm.current === 'EXECUTING') {
            await this.handleExecuting(turn);
        }
        if (this.fsm.current === 'OBSERVING') {
            await this.handleObserving(turn);
        }
        if (this.fsm.current === 'EVALUATING') {
            await this.handleEvaluating(turn);
        }
    }
    async handleThinking(turn) {
        const allMessages = this.context.getMessages();
        const messages = allMessages
            .filter(msg => msg.role !== 'tool');
        const messagesWithSystem = [
            {
                role: 'system',
                content: 'Current turn: ' + (turn.turnId)
            },
            ...messages
        ];
        const thought = await llmAdapter_1.LLMAdapter.think(messagesWithSystem, 'command');
        turn.thought = thought;
        if (thought.isDone) {
            console.log(chalk_1.default.bold.green(`\n✅ ${thought.parsedPlan.final_answer || 'Task completed'}`));
            this.fsm.transitionTo('TERMINAL');
            this.context.addMessage('assistant', thought.raw);
        }
        else {
            this.fsm.transitionTo('PROPOSING');
        }
    }
    async handleProposing(turn) {
        const thought = turn.thought;
        const riskLevel = governance_1.GovernanceService.evaluateRisk({
            id: (0, crypto_1.randomUUID)(),
            type: thought.type,
            payload: thought.payload || {},
            riskLevel: 'low',
            reasoning: thought.reasoning || ''
        });
        const action = {
            id: (0, crypto_1.randomUUID)(),
            type: thought.type,
            payload: thought.payload || {},
            riskLevel,
            reasoning: thought.reasoning || ''
        };
        turn.proposedAction = action;
        this.fsm.transitionTo('GOVERNING');
    }
    async handleGoverning(turn) {
        const action = turn.proposedAction;
        const decision = await governance_1.GovernanceService.adjudicate(action, {
            autoApproveLowRisk: this.config.autoApproveLowRisk
        });
        turn.governance = decision;
        if (decision.status === 'rejected') {
            console.log(chalk_1.default.yellow(`\n❌ Action rejected: ${decision.reason}`));
            this.context.addMessage('system', `Action rejected: ${decision.reason}`);
            this.fsm.transitionTo('THINKING');
        }
        else if (decision.status === 'approved') {
            this.fsm.transitionTo('EXECUTING', decision);
        }
        else if (decision.status === 'modified') {
            console.log(chalk_1.default.yellow(`\n✏️  Action modified by user`));
            turn.proposedAction = decision.modifiedAction;
            this.fsm.transitionTo('EXECUTING', decision);
        }
    }
    async handleExecuting(turn) {
        const governance = turn.governance;
        const action = governance.status === 'modified'
            ? governance.modifiedAction
            : turn.proposedAction;
        console.log(chalk_1.default.cyan(`\n⚙️  Executing: ${action.type}`));
        const result = await executor_1.ToolExecutor.execute(action);
        turn.executionResult = result;
        if (result.success) {
            console.log(chalk_1.default.green(`✅ Execution successful`));
        }
        else {
            console.log(chalk_1.default.red(`❌ Execution failed: ${result.error}`));
        }
        this.fsm.transitionTo('OBSERVING');
    }
    async handleObserving(turn) {
        const executionResult = turn.executionResult;
        const summary = executionResult.success
            ? `Action completed successfully. Output: ${executionResult.output.substring(0, 500)}`
            : `Action failed. Error: ${executionResult.error}`;
        turn.observation = {
            summary,
            artifacts: executionResult.artifacts || []
        };
        this.context.addToolResult(turn.proposedAction.type, executionResult.output || executionResult.error || '');
        this.fsm.transitionTo('EVALUATING');
    }
    async handleEvaluating(turn) {
        const executionResult = turn.executionResult;
        const thought = turn.thought;
        let outcome;
        if (executionResult.success && thought.isDone) {
            outcome = { kind: 'terminate', reason: 'goal_satisfied' };
        }
        else if (!executionResult.success) {
            outcome = { kind: 'continue', reason: 'failure_retry' };
        }
        else {
            outcome = { kind: 'continue', reason: 'incomplete' };
        }
        turn.evaluation = outcome;
        if (outcome.kind === 'terminate') {
            this.fsm.transitionTo('TERMINAL', outcome);
        }
        else {
            this.fsm.transitionTo('THINKING', outcome);
        }
    }
    logTurnSummary(turn) {
        console.log(chalk_1.default.gray(`\n--- Turn ${turn.turnId} Summary ---`));
        console.log(chalk_1.default.gray(`Duration: ${turn.endTime - turn.startTime}ms`));
        if (turn.thought) {
            console.log(chalk_1.default.gray(`Thought: ${turn.thought.type} - ${turn.thought.reasoning?.substring(0, 50)}`));
        }
        if (turn.governance) {
            console.log(chalk_1.default.gray(`Governance: ${turn.governance.status} by ${turn.governance.by}`));
        }
        if (turn.executionResult) {
            console.log(chalk_1.default.gray(`Execution: ${turn.executionResult.success ? 'success' : 'failed'}`));
        }
        console.log(chalk_1.default.gray('---\n'));
    }
    getTurns() {
        return [...this.turns];
    }
    getFSMState() {
        return this.fsm.current;
    }
    getContext() {
        return this.context;
    }
}
exports.GovernedAgentLoop = GovernedAgentLoop;
//# sourceMappingURL=loop.js.map