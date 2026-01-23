import crypto from 'crypto';
import { GovernanceContext } from './state';

export interface MessageMetadata {
  kind?: string;
  obsId?: string;
}

export class ContextManager {
  private messages: Array<{ role: string; content: string; timestamp: number; metadata?: MessageMetadata }> = [];
  private maxHistorySize = 50;

  constructor(initialContext?: GovernanceContext) {
    if (initialContext?.history) {
      this.messages = initialContext.history.map(msg => ({
        ...msg,
        timestamp: Date.now()
      }));
    }

    if (initialContext?.input) {
      this.addMessage('user', initialContext.input);
    }
  }

  addMessage(role: string, content: string): void {
    this.messages.push({
      role,
      content,
      timestamp: Date.now()
    });

    if (this.messages.length > this.maxHistorySize) {
      this.messages = this.messages.slice(-this.maxHistorySize);
    }
  }

  addToolResult(toolName: string, result: string): void {
    const content = `Tool ${toolName} returned:\n${result}`;
    this.addMessage('tool', content);
  }

  addObservation(
    observation: string,
    kind: 'tool_result' | 'system_note' | 'manual_input' = 'system_note',
    originatingActionId?: string
  ): string {
    const obsId = `obs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    this.addMessage('system', observation);
    this.messages[this.messages.length - 1].metadata = { kind, obsId };
    return obsId;
  }

  getLastAckableObservation(): { content: string; metadata?: MessageMetadata } | null {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const msg = this.messages[i];
      if (msg.role === 'system' && msg.metadata?.obsId) {
        return {
          content: msg.content,
          metadata: msg.metadata
        };
      }
    }
    return null;
  }

  getMessages(): Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string }> {
    return this.messages.map(({ role, content }) => ({
      role: role as 'system' | 'user' | 'assistant' | 'tool',
      content
    }));
  }

  getRecentMessages(count: number): Array<{ role: string; content: string; timestamp: number }> {
    return this.messages.slice(-count);
  }

  getHash(): string {
    const content = JSON.stringify(this.messages);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  getSnapshot() {
    return {
      inputHash: this.getHash(),
      systemPromptVersion: 'v1.0.0',
      toolSetVersion: 'v1.0.0',
      recentMessages: this.getRecentMessages(10)
    };
  }

  clear(): void {
    this.messages = [];
  }
}
