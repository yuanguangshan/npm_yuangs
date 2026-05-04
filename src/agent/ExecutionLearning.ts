import { AgentThought } from './state';
import { createExecutionRecord } from '../core/executionRecord';
import { saveExecutionRecord, loadExecutionRecord } from '../core/executionStore';
import { learnSkillFromRecord } from './skills';
import { logger } from '../utils/Logger';

const log = logger.child('ExecutionLearning');

/**
 * Records execution history for skill learning.
 * Standalone — no dependencies on other classes.
 */
export class ExecutionLearning {
  learn(userInput: string, mode: string, thought: AgentThought): void {
    try {
      const record = createExecutionRecord(
        `agent-${mode}`,
        { required: [], preferred: [] } as any,
        { aiProxyUrl: { value: '', source: 'built-in' }, defaultModel: { value: '', source: 'built-in' }, accountType: { value: 'free', source: 'built-in' } } as any,
        { selected: null, candidates: [], fallbackOccurred: false },
        { success: true },
        undefined,
        userInput,
        mode
      );

      (record as any).llmResult = { plan: thought.parsedPlan };
      (record as any).input = { rawInput: userInput };

      const savedRecordId = saveExecutionRecord(record);
      const savedRecord = loadExecutionRecord(savedRecordId);

      if (savedRecord) {
        learnSkillFromRecord(savedRecord, true);
      }
    } catch (error) {
      log.warn('Skill learning failed', { error: String(error) });
    }
  }
}
