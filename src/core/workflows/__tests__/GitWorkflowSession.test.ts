import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GitWorkflowSession, WorkflowPhase } from '../GitWorkflowSession';
import {
  PlanOutput,
  AutoOutput,
  ReviewOutput,
  WorkflowConfig,
  WorkflowError,
  workflowSuccess
} from '../types';
import { CapabilityLevel } from '../../capability/CapabilityLevel';

describe('GitWorkflowSession', () => {
  let session: GitWorkflowSession;
  let mockConfig: WorkflowConfig;

  beforeEach(() => {
    mockConfig = {
      sessionId: 'test-session',
      model: 'test-model',
      capability: CapabilityLevel.SEMANTIC
    };
    session = new GitWorkflowSession(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create unique session ID', () => {
      const sessionId = session.getSessionId();
      expect(sessionId).toBeDefined();
      expect(sessionId).toHaveLength(11 + 9);
    });

    it('should start in initialized phase', () => {
      expect(session.getPhase()).toBe('initialized');
    });

    it('should store config', () => {
      const config = session.getConfig();
      expect(config).toEqual(mockConfig);
    });
  });

  describe('workflow state transitions', () => {
    it('should transition from initialized to planning on runPlan', async () => {
      const mockPlanFn = vi.fn().mockResolvedValue(
        workflowSuccess(
          {
            todoMarkdown: 'test todo',
            capability: {
              minCapability: CapabilityLevel.SEMANTIC,
              fallbackChain: [CapabilityLevel.SEMANTIC]
            },
            estimatedTime: 1000,
            estimatedTokens: 100,
            scope: 'small'
          },
          'Plan generated'
        )
      );

      await session.runPlan(mockPlanFn, {
        userPrompt: 'test',
        maxRounds: 2
      });

      expect(session.getPhase()).toBe('planned');
    });

    it('should store plan output after successful plan', async () => {
      const expectedOutput: PlanOutput = {
        todoMarkdown: 'test todo',
        capability: {
          minCapability: CapabilityLevel.SEMANTIC,
          fallbackChain: [CapabilityLevel.SEMANTIC]
        },
        estimatedTime: 1000,
        estimatedTokens: 100,
        scope: 'small'
      };

      const mockPlanFn = vi.fn().mockResolvedValue(
        workflowSuccess(expectedOutput, 'Plan generated')
      );

      await session.runPlan(mockPlanFn, {
        userPrompt: 'test',
        maxRounds: 2
      });

      expect(session.getState().planOutput).toEqual(expectedOutput);
    });

    it('should transition to failed on plan error', async () => {
      const mockPlanFn = vi.fn().mockResolvedValue({
        success: false,
        summary: 'Plan failed',
        errors: [WorkflowError.internalBug('Test error')]
      });

      await session.runPlan(mockPlanFn, {
        userPrompt: 'test',
        maxRounds: 2
      });

      expect(session.getPhase()).toBe('failed');
      expect(session.getState().errors).toHaveLength(1);
    });

    it('should prevent auto before plan is completed', async () => {
      const mockAutoFn = vi.fn();
      const result = await session.runAuto(mockAutoFn);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].kind).toBe('Precondition');
      expect(result.summary).toContain('plan phase not completed');
    });

    it('should not run auto when session is failed', async () => {
      const error: WorkflowError = WorkflowError.internalBug('Test error');
      session.getState().errors.push(error);

      const mockAutoFn = vi.fn();
      const result = await session.runAuto(mockAutoFn);

      expect(result.success).toBe(false);
      expect(result.summary).toContain('terminal state');
    });
  });

  describe('capability validation', () => {
    it('should allow proceeding when capability meets requirements', () => {
      const result = session.canProceed(CapabilityLevel.SEMANTIC);
      expect(result).toBe(true);
    });

    it('should deny proceeding when capability insufficient', () => {
      const lowCapabilityConfig: WorkflowConfig = {
        ...mockConfig,
        capability: CapabilityLevel.TEXT
      };

      const lowSession = new GitWorkflowSession(lowCapabilityConfig);
      const result = lowSession.canProceed(CapabilityLevel.SEMANTIC);

      expect(result).toBe(false);
    });

    it('should prevent proceeding in terminal phases', () => {
      session['state'].phase = 'completed';

      const result = session.canProceed();
      expect(result).toBe(false);
    });
  });

  describe('session logging', () => {
    it('should log phase transitions', async () => {
      const mockPlanFn = vi.fn().mockResolvedValue(
        workflowSuccess(
          {
            todoMarkdown: 'test',
            capability: {
              minCapability: CapabilityLevel.TEXT,
              fallbackChain: []
            },
            estimatedTime: 100,
            estimatedTokens: 10,
            scope: 'small'
          },
          'Done'
        )
      );

      await session.runPlan(mockPlanFn, {
        userPrompt: 'test',
        maxRounds: 1
      });

      const logs = session.getLogs();
      expect(logs.length).toBeGreaterThan(1);
      expect(logs.some(log => log.event === 'Phase transition')).toBe(true);
    });

    it('should aggregate errors', async () => {
      const mockPlanFn = vi.fn().mockResolvedValue({
        success: false,
        summary: 'Failed',
        errors: [WorkflowError.externalService('Test error')]
      });

      await session.runPlan(mockPlanFn, {
        userPrompt: 'test',
        maxRounds: 1
      });

      expect(session.getState().errors).toHaveLength(1);
    });
  });

  describe('session summary', () => {
    it('should generate summary with plan output', async () => {
      const mockPlanFn = vi.fn().mockResolvedValue(
        workflowSuccess(
          {
            todoMarkdown: 'test todo',
            capability: {
              minCapability: CapabilityLevel.SEMANTIC,
              fallbackChain: [CapabilityLevel.SEMANTIC]
            },
            estimatedTime: 1000,
            estimatedTokens: 100,
            scope: 'medium'
          },
          'Done'
        )
      );

      await session.runPlan(mockPlanFn, {
        userPrompt: 'test',
        maxRounds: 1
      });

      const summary = session.getSummary();
      expect(summary).toContain('Session:');
      expect(summary).toContain('Phase: planned');
      expect(summary).toContain('Scope: medium');
    });

    it('should include elapsed time in summary', () => {
      const summary = session.getSummary();
      expect(summary).toContain('Elapsed:');
    });
  });
});
