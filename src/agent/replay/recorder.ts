import { RuntimeEvent, EventRecorder } from './events';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export class FileEventRecorder implements EventRecorder {
  private events: RuntimeEvent[] = [];
  private logFile: string;
  private flushInterval: number = 1000;

  constructor(logDir: string = '.yuangs_events') {
    this.logFile = path.join(logDir, `events_${Date.now()}.jsonl`);
  }

  async record(event: RuntimeEvent): Promise<void> {
    this.events.push(event);

    if (this.events.length >= this.flushInterval) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const logDir = path.dirname(this.logFile);
    await fs.mkdir(logDir, { recursive: true });

    const content = this.events
      .map(e => JSON.stringify(e))
      .join('\n') + '\n';

    await fs.appendFile(this.logFile, content, 'utf8');
    this.events = [];
  }

  getEvents(executionId?: string): RuntimeEvent[] {
    if (!executionId) {
      return [...this.events];
    }

    return this.events.filter(e => e.executionId === executionId);
  }
}

export const createEvent = (
  executionId: string,
  type: RuntimeEvent['type'],
  data: RuntimeEvent['data'],
  metadata?: RuntimeEvent['metadata']
): RuntimeEvent => ({
  id: randomUUID(),
  timestamp: Date.now(),
  executionId,
  type,
  data,
  metadata
});
