import { GovernanceFSM } from './fsm';
import { 
  AgentState, 
  ExecutionTurn, 
  ProposedAction, 
  GovernanceDecision, 
  EvaluationOutcome,
  GovernanceLoopConfig,
  GovernanceContext
} from './state';
import { LLMAdapter } from './llmAdapter';
import { GovernanceService } from './governance';
import { ToolExecutor } from './executor';
import { ContextManager } from './contextManager';
import { randomUUID } from 'crypto';
import chalk from 'chalk';

export class GovernedAgentLoop {
  private fsm = new GovernanceFSM();
  private context: ContextManager;
  private turns: ExecutionTurn[] = [];
  private config: GovernanceLoopConfig;

  constructor(
    initialContext: GovernanceContext,
    config?: Partial<GovernanceLoopConfig>
  ) {
    this.context = new ContextManager(initialContext);
    this.config = {
      maxTurns: 20,
      autoApproveLowRisk: true,
      verbose: false,
      ...config
    };
  }

  async run(): Promise<ExecutionTurn[]> {
    this.fsm.transitionTo('THINKING');

    let turnCount = 0;
    
    while (turnCount < this.config.maxTurns && !this.fsm.isTerminal()) {
      const turn: ExecutionTurn = {
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

      } catch (error: any) {
        console.error(chalk.red(`[Loop Error] Turn ${turn.turnId} failed: ${error.message}`));
        this.fsm.transitionTo('TERMINAL');
        turn.endTime = Date.now();
        this.turns.push(turn);
        break;
      }
    }

    if (turnCount >= this.config.maxTurns) {
      console.log(chalk.yellow(`\n⚠️  Max turns (${this.config.maxTurns}) reached`));
    }

    return this.turns;
  }

  private async executeTurn(turn: ExecutionTurn): Promise<void> {
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

  private async handleThinking(turn: ExecutionTurn): Promise<void> {
    const allMessages = this.context.getMessages();
    const messages = allMessages
      .filter(msg => msg.role !== 'tool') as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    
    const messagesWithSystem: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: 'Current turn: ' + (turn.turnId)
      },
      ...messages
    ];

    const thought = await LLMAdapter.think(
      messagesWithSystem,
      'command'
    );

    turn.thought = thought;

    if (thought.isDone) {
      console.log(chalk.bold.green(`\n✅ ${thought.parsedPlan.final_answer || 'Task completed'}`));
      this.fsm.transitionTo('TERMINAL');
      this.context.addMessage('assistant', thought.raw);
    } else {
      this.fsm.transitionTo('PROPOSING');
    }
  }

  private async handleProposing(turn: ExecutionTurn): Promise<void> {
    const thought = turn.thought!;
    const riskLevel = GovernanceService.evaluateRisk({
      id: randomUUID(),
      type: thought.type!,
      payload: thought.payload || {},
      riskLevel: 'low',
      reasoning: thought.reasoning || ''
    });

    const action: ProposedAction = {
      id: randomUUID(),
      type: thought.type!,
      payload: thought.payload || {},
      riskLevel,
      reasoning: thought.reasoning || ''
    };

    turn.proposedAction = action;
    this.fsm.transitionTo('GOVERNING');
  }

  private async handleGoverning(turn: ExecutionTurn): Promise<void> {
    const action = turn.proposedAction!;
    
    const decision = await GovernanceService.adjudicate(action, {
      autoApproveLowRisk: this.config.autoApproveLowRisk
    });

    turn.governance = decision;

    if (decision.status === 'rejected') {
      console.log(chalk.yellow(`\n❌ Action rejected: ${decision.reason}`));
      this.context.addMessage('system', `Action rejected: ${decision.reason}`);
      this.fsm.transitionTo('THINKING');
    } else if (decision.status === 'approved') {
      this.fsm.transitionTo('EXECUTING', decision);
    } else if (decision.status === 'modified') {
      console.log(chalk.yellow(`\n✏️  Action modified by user`));
      turn.proposedAction = decision.modifiedAction;
      this.fsm.transitionTo('EXECUTING', decision);
    }
  }

  private async handleExecuting(turn: ExecutionTurn): Promise<void> {
    const governance = turn.governance!;
    const action = governance.status === 'modified' 
      ? governance.modifiedAction 
      : turn.proposedAction!;

    console.log(chalk.cyan(`\n⚙️  Executing: ${action.type}`));
    
    const result = await ToolExecutor.execute(action);
    turn.executionResult = result;

    if (result.success) {
      console.log(chalk.green(`✅ Execution successful`));
    } else {
      console.log(chalk.red(`❌ Execution failed: ${result.error}`));
    }

    this.fsm.transitionTo('OBSERVING');
  }

  private async handleObserving(turn: ExecutionTurn): Promise<void> {
    const executionResult = turn.executionResult!;

    const summary = executionResult.success 
      ? `Action completed successfully. Output: ${executionResult.output.substring(0, 500)}`
      : `Action failed. Error: ${executionResult.error}`;

    turn.observation = {
      summary,
      artifacts: executionResult.artifacts || []
    };

    this.context.addToolResult(
      turn.proposedAction!.type,
      executionResult.output || executionResult.error || ''
    );

    this.fsm.transitionTo('EVALUATING');
  }

  private async handleEvaluating(turn: ExecutionTurn): Promise<void> {
    const executionResult = turn.executionResult!;
    const thought = turn.thought!;

    let outcome: EvaluationOutcome;

    if (executionResult.success && thought.isDone) {
      outcome = { kind: 'terminate', reason: 'goal_satisfied' };
    } else if (!executionResult.success) {
      outcome = { kind: 'continue', reason: 'failure_retry' };
    } else {
      outcome = { kind: 'continue', reason: 'incomplete' };
    }

    turn.evaluation = outcome;

    if (outcome.kind === 'terminate') {
      this.fsm.transitionTo('TERMINAL', outcome);
    } else {
      this.fsm.transitionTo('THINKING', outcome);
    }
  }

  private logTurnSummary(turn: ExecutionTurn): void {
    console.log(chalk.gray(`\n--- Turn ${turn.turnId} Summary ---`));
    console.log(chalk.gray(`Duration: ${turn.endTime! - turn.startTime}ms`));
    if (turn.thought) {
      console.log(chalk.gray(`Thought: ${turn.thought.type} - ${turn.thought.reasoning?.substring(0, 50)}`));
    }
    if (turn.governance) {
      console.log(chalk.gray(`Governance: ${turn.governance.status} by ${turn.governance.by}`));
    }
    if (turn.executionResult) {
      console.log(chalk.gray(`Execution: ${turn.executionResult.success ? 'success' : 'failed'}`));
    }
    console.log(chalk.gray('---\n'));
  }

  getTurns(): ExecutionTurn[] {
    return [...this.turns];
  }

  getFSMState(): AgentState {
    return this.fsm.current;
  }

  getContext(): ContextManager {
    return this.context;
  }
}
