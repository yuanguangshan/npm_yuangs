import chalk from "chalk";
import { ProposedAction, ToolCallPayload } from "./state";
import { ErrorTracker } from "./errorTracker";
import { SmartContextManager } from "./smartContextManager";
import { evaluateProposal } from "./governance/core";
import { GovernanceService } from "./governance";
import { logger } from "../utils/Logger";

const log = logger.child('PreFlightChecker');

interface WriteModeState {
  filePath: string;
  content: string;
}

interface ToolCallRecord {
  tool: string;
  params: any;
  count: number;
  lastOutput?: string;
  outputHistory: string[];
  blockCount: number;
}

/**
 * Pre-flight checks before executing an action.
 * Handles duplicate detection, write-mode caching, governance, and causal ACK verification.
 */
export class PreFlightChecker {
  constructor(private context: SmartContextManager) {}

  /**
   * Verify causal ACK matches the last observation.
   * Returns false if ACK mismatches and the loop should skip.
   */
  verifyAckCausality(thought: any): boolean {
    const lastObs = this.context.getLastAckableObservation();
    const ackText = thought.parsedPlan?.acknowledged_observation;

    if (lastObs && ackText && ackText !== 'NONE') {
      if (lastObs.content.trim() !== ackText.trim()) {
      log.error('ACK mismatch', {
        expected: lastObs.content.trim().substring(0, 100),
        received: ackText.trim().substring(0, 100),
      });
        this.context.addMessage(
          "system",
          `CAUSAL BREAK: ACK does not match physical Observation. Cannot proceed without acknowledging reality.`
        );
        return false;
      }
        log.debug('ACK verified');
    }
    return true;
  }

  /**
   * Run governance checks. Returns false if the action is denied.
   */
  async passGovernance(action: ProposedAction): Promise<boolean> {
    const preCheck = evaluateProposal(action, GovernanceService.getRules(), GovernanceService.getLedgerSnapshot());
    if (preCheck.effect === "deny") {
      log.warn('Policy blocked', { reason: preCheck.reason });
      this.context.addMessage("system", `POLICY DENIED: ${preCheck.reason}. Find a different way.`);
      return false;
    }

    const decision = await GovernanceService.adjudicate(action);
    if (decision.status === "rejected") {
      log.warn('Governance rejected', { reason: decision.reason });
      this.context.addMessage("system", `Rejected by Governance: ${decision.reason}`);
      return false;
    }
    return true;
  }

  /**
   * Record knowledge graph edge between observation and action.
   */
  async recordKnowledgeGraphEdge(thought: any, action: ProposedAction): Promise<void> {
    const lastObs = this.context.getLastAckableObservation();
    const ackText = thought.parsedPlan?.acknowledged_observation;

    if (lastObs && lastObs.metadata?.obsId && ackText && ackText !== 'NONE') {
      try {
        const { recordEdge } = await import('../engine/agent/knowledgeGraph');
        recordEdge({
          from: lastObs.metadata.obsId,
          to: action.id,
          type: 'ACKNOWLEDGED_BY' as any,
          metadata: { verified: true, timestamp: Date.now() }
        });
        log.debug('Causal edge recorded');
      } catch (error: any) {
        log.warn('Failed to record causal edge', { error: error.message });
      }
    }
  }

  /**
   * Check if execution should be blocked.
   * Returns:
   *  - 'blocked': skip this turn
   *  - 'force_break': break the loop entirely
   *  - cached result object: use cached output instead of executing
   *  - null: proceed with execution
   */
  check(
    action: ProposedAction,
    writeModeState: WriteModeState | null,
    lastToolCall: ToolCallRecord | null
  ): 'blocked' | 'force_break' | { success: true; output: string; artifacts: string[] } | null {
    if (action.type !== 'tool_call') return null;

    const toolParams = action.payload as unknown as ToolCallPayload;
    const toolName = toolParams.tool_name;
    const params = toolName === 'shell_cmd'
      ? { command: (toolParams.tool_name === 'shell_cmd' ? '' : (toolParams.parameters as Record<string, unknown>)?.command || '') }
      : (toolParams.parameters || {});

    // Duplicate detection
    if (lastToolCall) {
      const isExactDuplicate = lastToolCall.tool === toolName &&
        JSON.stringify(lastToolCall.params) === JSON.stringify(params);
      if (isExactDuplicate) {
        lastToolCall.blockCount = (lastToolCall.blockCount || 0) + 1;
        if (lastToolCall.blockCount >= 2) {
          log.warn('Force break: duplicate tool call', { tool: toolName, blockCount: lastToolCall.blockCount });
          return 'force_break';
        }
        log.debug('Duplicate pre-block', { tool: toolName });
        this.context.addMessage('system', `你已经刚刚调用过 ${toolName}，结果没有变化。你已经有足够的数据，请使用 'answer' 类型返回结果给用户，不要再调用 ${toolName}。`);
        return 'blocked';
      }
    }

    // Write-mode cache
    if (writeModeState && toolName === 'read_file') {
      const filePath = (toolParams.parameters as Record<string, unknown>)?.path as string;
      if (filePath === writeModeState.filePath && writeModeState.content) {
        log.debug('File content cached', { filePath });
        return { success: true, output: writeModeState.content, artifacts: [filePath] };
      }
    }

    // Error tracker block
    const blockCheck = ErrorTracker.shouldBlockExecution(toolName, toolParams.parameters);
    if (blockCheck.blocked) {
      log.warn('Execution blocked by error tracker', { tool: toolName, reason: blockCheck.reason });
      this.context.addMessage("system", `BLOCKED: ${blockCheck.reason}. 建议尝试不同的方法。`);
      return 'blocked';
    }

    return null;
  }
}
