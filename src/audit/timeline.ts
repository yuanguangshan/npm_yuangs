import type { ExecutionTurn } from '../agent/state';

export type AuditEventType =
  | 'macro_started'
  | 'macro_finished'
  | 'state_transition'
  | 'capability_requested'
  | 'capability_granted'
  | 'capability_denied'
  | 'human_approval_requested'
  | 'human_approved'
  | 'human_rejected'
  | 'tool_executed'
  | 'error_occurred';

export interface AuditEvent {
  id: string;
  timestamp: number;
  executionId: string;
  type: AuditEventType;
  data: {
    macroId?: string;
    macroVersion?: string;
    turnId?: number;
    fromState?: string;
    toState?: string;
    capability?: string;
    reason?: string;
    toolName?: string;
    toolParams?: any;
    success?: boolean;
    error?: string;
    approver?: string;
    duration?: number;
  };
  metadata?: Record<string, any>;
}

export interface ExecutionTimeline {
  executionId: string;
  startTime: number;
  endTime?: number;
  events: AuditEvent[];
  summary: ExecutionSummary;
}

export interface ExecutionSummary {
  totalDuration?: number;
  totalTurns: number;
  successfulTurns: number;
  failedTurns: number;
  capabilitiesRequested: Set<string>;
  capabilitiesGranted: Set<string>;
  capabilitiesDenied: Set<string>;
  toolsUsed: Map<string, number>;
  errors: Array<{ turn: number; message: string }>;
  humanApprovals: number;
  humanRejections: number;
}

export interface EffectsSummary {
  filesRead: string[];
  filesWritten: string[];
  filesModified: string[];
  commandsExecuted: Array<{ command: string; success: boolean }>;
  networkRequests: Array<{ url: string; method?: string }>;
  secretsAccessed: string[];
}

export class AuditTimeline {
  private events: AuditEvent[] = [];
  private executionId: string;
  private startTime: number;

  constructor(executionId: string) {
    this.executionId = executionId;
    this.startTime = Date.now();
  }

  record(event: Omit<AuditEvent, 'id' | 'timestamp' | 'executionId'>): void {
    this.events.push({
      id: this.generateEventId(),
      timestamp: Date.now(),
      executionId: this.executionId,
      ...event
    });
  }

  recordTurn(turn: ExecutionTurn): void {
    const startTime = Date.now();

    this.record({
      type: 'macro_started',
      data: {
        turnId: turn.turnId
      }
    });

    if (turn.proposedAction) {
      this.record({
        type: 'capability_requested',
        data: {
          capability: turn.proposedAction.type
        }
      });
    }

    if (turn.governance) {
      if (turn.governance.status === 'approved' && turn.governance.by === 'human') {
        this.record({
          type: 'human_approval_requested',
          data: {
            approver: turn.governance.by
          }
        });

        this.record({
          type: 'human_approved',
          data: {
            approver: turn.governance.by
          }
        });
      } else if (turn.governance.status === 'rejected') {
        this.record({
          type: 'human_approval_requested',
          data: {}
        });

        this.record({
          type: 'human_rejected',
          data: {
            reason: (turn.governance as any).reason
          }
        });
      }
    }

    if (turn.executionResult) {
      if (turn.proposedAction?.type === 'tool_call') {
        this.record({
          type: 'tool_executed',
          data: {
            toolName: turn.proposedAction.payload?.tool_name,
            toolParams: turn.proposedAction.payload?.parameters,
            success: turn.executionResult.success
          }
        });
      }

      if (!turn.executionResult.success) {
        this.record({
          type: 'error_occurred',
          data: {
            error: turn.executionResult.error
          }
        });
      }
    }

    const duration = Date.now() - startTime;
    this.record({
      type: 'macro_finished',
      data: {
        duration
      }
    });
  }

  generateTimeline(): ExecutionTimeline {
    const summary = this.generateSummary();

    return {
      executionId: this.executionId,
      startTime: this.startTime,
      endTime: this.events.length > 0 ? this.events[this.events.length - 1].timestamp : undefined,
      events: this.events,
      summary
    };
  }

  generateEffectsSummary(turns: ExecutionTurn[]): EffectsSummary {
    const effects: EffectsSummary = {
      filesRead: [],
      filesWritten: [],
      filesModified: [],
      commandsExecuted: [],
      networkRequests: [],
      secretsAccessed: []
    };

    for (const turn of turns) {
      if (turn.proposedAction?.type === 'tool_call') {
        const toolName = turn.proposedAction.payload?.tool_name;
        const params = turn.proposedAction.payload?.parameters;

        switch (toolName) {
          case 'read_file':
            if (params?.path && turn.executionResult?.success) {
              effects.filesRead.push(params.path);
            }
            break;

          case 'write_file':
            if (params?.path && turn.executionResult?.success) {
              effects.filesWritten.push(params.path);
            }
            break;

          case 'list_files':
            if (params?.path && turn.executionResult?.success) {
              effects.filesModified.push(params.path);
            }
            break;
        }
      }

      if (turn.proposedAction?.type === 'shell_cmd' && turn.executionResult) {
        effects.commandsExecuted.push({
          command: turn.proposedAction.payload?.command,
          success: turn.executionResult.success
        });
      }
    }

    return effects;
  }

  toJSON(): string {
    return JSON.stringify(this.generateTimeline(), null, 2);
  }

  toMarkdown(): string {
    const timeline = this.generateTimeline();
    let markdown = `# Execution Timeline\n\n`;
    markdown += `**Execution ID:** ${timeline.executionId}\n`;
    markdown += `**Start Time:** ${new Date(timeline.startTime).toISOString()}\n`;
    if (timeline.endTime) {
      markdown += `**End Time:** ${new Date(timeline.endTime).toISOString()}\n`;
      markdown += `**Duration:** ${((timeline.endTime - timeline.startTime) / 1000).toFixed(2)}s\n`;
    }
    markdown += `\n`;

    markdown += `## Summary\n\n`;
    markdown += `- Total Turns: ${timeline.summary.totalTurns}\n`;
    markdown += `- Successful: ${timeline.summary.successfulTurns}\n`;
    markdown += `- Failed: ${timeline.summary.failedTurns}\n`;
    markdown += `- Human Approvals: ${timeline.summary.humanApprovals}\n`;
    markdown += `- Human Rejections: ${timeline.summary.humanRejections}\n`;
    markdown += `\n`;

    markdown += `## Events\n\n`;
    for (const event of timeline.events) {
      markdown += `### ${event.type}\n`;
      markdown += `- **Time:** ${new Date(event.timestamp).toISOString()}\n`;
      if (event.data.capability) {
        markdown += `- **Capability:** ${event.data.capability}\n`;
      }
      if (event.data.toolName) {
        markdown += `- **Tool:** ${event.data.toolName}\n`;
      }
      if (event.data.reason) {
        markdown += `- **Reason:** ${event.data.reason}\n`;
      }
      if (event.data.error) {
        markdown += `- **Error:** ${event.data.error}\n`;
      }
      markdown += `\n`;
    }

    return markdown;
  }

  private generateSummary(): ExecutionSummary {
    const capabilitiesRequested = new Set<string>();
    const capabilitiesGranted = new Set<string>();
    const capabilitiesDenied = new Set<string>();
    const toolsUsed = new Map<string, number>();
    const errors: Array<{ turn: number; message: string }> = [];
    let humanApprovals = 0;
    let humanRejections = 0;
    let successfulTurns = 0;
    let failedTurns = 0;

    for (const event of this.events) {
      switch (event.type) {
        case 'capability_requested':
          if (event.data.capability) {
            capabilitiesRequested.add(event.data.capability);
          }
          break;

        case 'capability_granted':
          if (event.data.capability) {
            capabilitiesGranted.add(event.data.capability);
          }
          break;

        case 'capability_denied':
          if (event.data.capability) {
            capabilitiesDenied.add(event.data.capability);
          }
          break;

        case 'tool_executed':
          if (event.data.toolName) {
            const count = toolsUsed.get(event.data.toolName) || 0;
            toolsUsed.set(event.data.toolName, count + 1);
          }
          break;

        case 'human_approved':
          humanApprovals++;
          successfulTurns++;
          break;

        case 'human_rejected':
          humanRejections++;
          failedTurns++;
          break;

        case 'error_occurred':
          if (event.data.error) {
            errors.push({
              turn: event.data.turnId || 0,
              message: event.data.error
            });
            failedTurns++;
          }
          break;
      }
    }

    const endTime = this.events.length > 0 ? this.events[this.events.length - 1].timestamp : Date.now();

    return {
      totalDuration: endTime - this.startTime,
      totalTurns: successfulTurns + failedTurns,
      successfulTurns,
      failedTurns,
      capabilitiesRequested,
      capabilitiesGranted,
      capabilitiesDenied,
      toolsUsed,
      errors,
      humanApprovals,
      humanRejections
    };
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
