import { listExecutionRecords } from '../core/executionStore';
import { saveContext } from '../commands/contextStorage';
import { ContextItem } from '../commands/contextBuffer';

export class ReflectionAgent {
  static async run(limit: number = 20) {
    const records = listExecutionRecords(limit);
    if (records.length === 0) return;

    const failures = records.filter(r => !r.outcome.success);
    const successes = records.filter(r => r.outcome.success);

    const memories: ContextItem[] = [];

    if (failures.length > 0) {
      memories.push({
        type: 'memory',
        path: 'reflection:failures',
        summary: 'Recent high-risk failures',
        content: failures.slice(0, 5)
          .map(f => `❌ ${f.meta.commandName}`)
          .join('\n'),
        importance: 0.8,
        lastUsedAt: Date.now(),
        id: `reflection:failures:${Date.now()}`,
        tokens: 0
      });
    }

    if (successes.length > 0) {
      memories.push({
        type: 'memory',
        path: 'reflection:success',
        summary: 'Recent stable successes',
        content: successes.slice(0, 5)
          .map(s => `✅ ${s.meta.commandName}`)
          .join('\n'),
        importance: 0.5,
        lastUsedAt: Date.now(),
        id: `reflection:success:${Date.now()}`,
        tokens: 0
      });
    }

    if (memories.length > 0) {
      await saveContext(memories);
    }
  }
}
