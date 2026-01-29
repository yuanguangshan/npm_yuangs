import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanWorkflow } from '../PlanWorkflow';
import { GitService } from '../../git/GitService';
import { runLLM, AIError } from '../../../agent/llm';
import {
  PlanInput,
  WorkflowConfig,
  WorkflowError,
  workflowSuccess
} from '../types';
import { CapabilityLevel } from '../../capability/CapabilityLevel';

vi.mock('../../git/GitService');
vi.mock('../../../agent/llm');

describe('PlanWorkflow', () => {
  let planWorkflow: PlanWorkflow;
  let mockGitService: any;

  beforeEach(() => {
    mockGitService = {
      getRecentCommits: vi.fn(),
      getDiff: vi.fn(),
      getDiffNumstat: vi.fn()
    } as any;

    planWorkflow = new PlanWorkflow(mockGitService);
  });

  describe('run method', () => {
    it('should generate plan with multi-agent collaboration', async () => {
      const mockCommits = [
        {
          hash: 'abc123',
          date: '2026-01-01',
          message: 'test commit'
        }
      ];

      mockGitService.getRecentCommits.mockResolvedValue(mockCommits);

      const architectDraft = 'Initial plan draft';
      const reviewerComments = 'Some improvements';
      const refinedPlan = 'Refined plan';

      vi.mocked(runLLM)
        .mockResolvedValueOnce({
          rawText: architectDraft
        } as any)
        .mockResolvedValueOnce({
          rawText: reviewerComments
        } as any)
        .mockResolvedValueOnce({
          rawText: refinedPlan
        } as any)
        .mockResolvedValue({
          rawText: architectDraft
        } as any);

      const config: WorkflowConfig = {
        sessionId: 'test',
        model: 'test-model',
        capability: CapabilityLevel.SEMANTIC
      };

      const input: PlanInput = {
        userPrompt: 'Implement user authentication',
        maxRounds: 2
      };

      const result = await planWorkflow.run(input, config);

      expect(result.success).toBe(true);
      expect(mockGitService.getRecentCommits).toHaveBeenCalledWith(10);
      expect(vi.mocked(runLLM)).toHaveBeenCalledTimes(4);
    });

    it('should handle LLM errors and return workflow failure', async () => {
      mockGitService.getRecentCommits.mockResolvedValue([]);

      const aiError = new AIError('LLM failed', 500, {});
      vi.mocked(runLLM).mockRejectedValue(aiError);

      const config: WorkflowConfig = {
        sessionId: 'test',
        model: 'test-model',
        capability: CapabilityLevel.SEMANTIC
      };

      const input: PlanInput = {
        userPrompt: 'test prompt'
      };

      const result = await planWorkflow.run(input, config);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].kind).toBe('ExternalService');
      expect(result.summary).toContain('LLM call failed');
    });

    it('should calculate capability requirements from file changes', async () => {
      mockGitService.getRecentCommits.mockResolvedValue([]);
      mockGitService.getDiff.mockResolvedValue({
        files: {
          staged: ['test.ts', 'other.js'],
          unstaged: []
        },
        summary: 'test diff'
      } as any);

      mockGitService.getDiffNumstat.mockResolvedValue({
        added: 100,
        deleted: 20
      });

      vi.mocked(runLLM).mockResolvedValue({
        rawText: 'test todo content'
      } as any);

      const config: WorkflowConfig = {
        sessionId: 'test',
        model: 'test-model',
        capability: CapabilityLevel.SEMANTIC
      };

      const input: PlanInput = {
        userPrompt: 'test'
      };

      const result = await planWorkflow.run(input, config);

      expect(result.success).toBe(true);
      expect(result.data?.capability.minCapability).toBeDefined();
    });
  });

  describe('capability estimation', () => {
    it('should detect small scope for few files and lines', async () => {
      mockGitService.getRecentCommits.mockResolvedValue([]);
      mockGitService.getDiff.mockResolvedValue({
        files: { staged: [], unstaged: ['file1.ts'] },
        summary: ''
      } as any);

      mockGitService.getDiffNumstat.mockResolvedValue({
        added: 50,
        deleted: 10
      });

      vi.mocked(runLLM).mockResolvedValue({
        rawText: 'test'
      } as any);

      const result = await planWorkflow.run(
        { userPrompt: 'test' },
        { sessionId: 'test', model: 'test', capability: CapabilityLevel.TEXT }
      );

      expect(result.data?.scope).toBe('small');
    });

    it('should detect medium scope for moderate changes', async () => {
      mockGitService.getRecentCommits.mockResolvedValue([]);
      mockGitService.getDiff.mockResolvedValue({
        files: { staged: Array.from({ length: 5 }, (_, i) => `file${i}.ts`) },
        summary: ''
      } as any);

      mockGitService.getDiffNumstat.mockResolvedValue({
        added: 200,
        deleted: 50
      });

      vi.mocked(runLLM).mockResolvedValue({
        rawText: 'test'
      } as any);

      const result = await planWorkflow.run(
        { userPrompt: 'test' },
        { sessionId: 'test', model: 'test', capability: CapabilityLevel.TEXT }
      );

      expect(result.data?.scope).toBe('medium');
    });

    it('should detect large scope for many files', async () => {
      mockGitService.getRecentCommits.mockResolvedValue([]);
      mockGitService.getDiff.mockResolvedValue({
        files: { staged: Array.from({ length: 15 }, (_, i) => `file${i}.ts`) },
        summary: ''
      } as any);

      mockGitService.getDiffNumstat.mockResolvedValue({
        added: 600,
        deleted: 150
      });

      vi.mocked(runLLM).mockResolvedValue({
        rawText: 'test'
      } as any);

      const result = await planWorkflow.run(
        { userPrompt: 'test' },
        { sessionId: 'test', model: 'test', capability: CapabilityLevel.TEXT }
      );

      expect(result.data?.scope).toBe('large');
    });
  });
});
