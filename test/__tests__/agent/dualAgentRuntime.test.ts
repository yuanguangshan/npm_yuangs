// @ts-nocheck
import { DualAgentRuntime } from '../../../src/agent/DualAgentRuntime';

// Mock dependencies
jest.mock('../../../src/agent/llmAdapter', () => ({
  LLMAdapter: {
    think: jest.fn().mockResolvedValue({
      type: 'answer',
      raw: 'Mock response',
      payload: { text: 'Mock response' },
      reasoning: 'Mock reasoning',
      isDone: true,
      parsedPlan: {}
    })
  }
}));

jest.mock('../../../src/ai/client', () => ({
  getUserConfig: jest.fn(() => ({})),
  askAI: jest.fn()
}));

jest.mock('../../../src/agent/executor', () => ({
  ToolExecutor: {
    execute: jest.fn().mockResolvedValue({
      success: true,
      output: 'Mock output'
    })
  }
}));

jest.mock('../../../src/agent/skills', () => ({
  learnSkillFromRecord: jest.fn(),
  getAllSkills: jest.fn(() => []),
  updateSkillStatus: jest.fn(),
  computeSkillScore: jest.fn(() => 0.5),
  getRelevantSkills: jest.fn(() => []),
  reapColdSkills: jest.fn()
}));

jest.mock('readline', () => ({
  createInterface: jest.fn().mockReturnValue({
    question: jest.fn(),
    close: jest.fn()
  })
}));

jest.mock('../../../src/core/executionRecord', () => ({
  createExecutionRecord: jest.fn((cmd, req, config, match, outcome, command, input, mode) => ({
    id: 'test-record-id',
    meta: {
      commandName: cmd,
      timestamp: new Date().toISOString(),
      toolVersion: '5.13.0',
      projectPath: '/test',
      rawInput: input?.rawInput,
      mode,
      version: '5.13.0'
    },
    intent: { required: [], preferred: [], capabilityVersion: '1.0' },
    configSnapshot: config,
    decision: match,
    outcome: { success: outcome.success || false }
  }))
}));

jest.mock('../../../src/core/executionStore', () => ({
  saveExecutionRecord: jest.fn(() => 'test-record-id'),
  loadExecutionRecord: jest.fn(() => ({
    id: 'test-record-id',
    meta: {
      commandName: 'test',
      mode: 'agent'
    },
    llmResult: { plan: { goal: 'Test step' } },
    input: { rawInput: 'test input' }
  }))
}));

jest.mock('marked', () => ({
  parse: jest.fn((text: string) => text),
  setOptions: jest.fn()
}));

describe('DualAgentRuntime', () => {
  let runtime: DualAgentRuntime;
  let mockReadlineInterface: any;

  beforeEach(() => {
    runtime = new DualAgentRuntime({});
    jest.clearAllMocks();

    // Mock readline for askUser
    mockReadlineInterface = require('readline').createInterface();
    (require('readline').createInterface as jest.Mock).mockReturnValue(mockReadlineInterface);

    // Setup mock for question to return 'y' by default
    mockReadlineInterface.question = jest.fn((question: string, callback: any) => {
      callback('y');
    });
    mockReadlineInterface.close = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Fast Path', () => {
    it('should use fast path for simple commands', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { LLMAdapter } = require('../../../src/agent/llmAdapter');

      await runtime.run('ls files', undefined, undefined, 'test-model');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🚀 Quick path'));
      expect(LLMAdapter.think).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should use fast path for short inputs', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { LLMAdapter } = require('../../../src/agent/llmAdapter');

      await runtime.run('Do this', undefined, undefined, 'test-model');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🚀 Quick path'));
      expect(LLMAdapter.think).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should use fast path when no planner keywords present', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { LLMAdapter } = require('../../../src/agent/llmAdapter');

      await runtime.run('Just show the file list', undefined, undefined, 'test-model');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🚀 Quick path'));
      expect(LLMAdapter.think).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Planner Path', () => {
    it('should use planner for refactor keyword', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { askAI } = require('../../../src/ai/client');

      (askAI as jest.Mock).mockResolvedValue(
        '```json\n{\n  "plan": "Test plan",\n  "steps": [],\n  "estimated_time": "1 min"\n}\n```'
      );

      await runtime.run('Refactor the codebase', undefined, undefined, 'test-model');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📋 Planning task'));
      expect(askAI).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Plan created'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[y] 继续执行'));
      consoleSpy.mockRestore();
    });

    it('should use planner for optimize all keyword', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { askAI } = require('../../../src/ai/client');

      (askAI as jest.Mock).mockResolvedValue(
        '```json\n{\n  "plan": "Test",\n  "steps": [],\n  "estimated_time": "1 min"\n}\n```'
      );

      await runtime.run('Optimize all the functions', undefined, undefined, 'test-model');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📋 Planning task'));
      expect(askAI).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should use planner for batch keyword', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { askAI } = require('../../../src/ai/client');

      (askAI as jest.Mock).mockResolvedValue(
        '```json\n{\n  "plan": "Test",\n  "steps": [],\n  "estimated_time": "1 min"\n}\n```'
      );

      await runtime.run('Batch process files', undefined, undefined, 'test-model');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📋 Planning task'));
      expect(askAI).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should use planner for Chinese keywords', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { askAI } = require('../../../src/ai/client');

      (askAI as jest.Mock).mockResolvedValue(
        '```json\n{\n  "plan": "Test",\n  "steps": [],\n  "estimated_time": "1 min"\n}\n```'
      );

      await runtime.run('批量处理文件', undefined, undefined, 'test-model');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📋 Planning task'));
      expect(askAI).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should respect planner disabled config', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { getUserConfig } = require('../../../src/ai/client');

      (getUserConfig as jest.Mock).mockReturnValue({ disablePlanner: true });

      await runtime.run('Refactor the code', undefined, undefined, 'test-model');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🚀 Quick path'));
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('📋 Planning task'));
      consoleSpy.mockRestore();
    });

    it('should cancel execution when user rejects plan', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { askAI } = require('../../../src/ai/client');

      (askAI as jest.Mock).mockResolvedValue(
        '```json\n{\n  "plan": "Test plan",\n  "steps": [],\n  "estimated_time": "1 min"\n}\n```'
      );

      // Setup to return 'n' (user rejects)
      mockReadlineInterface.question = jest.fn((question: string, callback: any) => {
        callback('n');
      });

      await runtime.run('Refactor code', undefined, undefined, 'test-model');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Execution cancelled by user'));
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('🎉 All tasks completed'));
      consoleSpy.mockRestore();
    });

    it('should handle plan with multiple steps', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { askAI } = require('../../../src/ai/client');
      const { ToolExecutor } = require('../../../src/agent/executor');

      const mockPlan = {
        plan: 'Test execution plan',
        steps: [
          {
            id: 'step1',
            description: 'First step',
            type: 'shell_cmd',
            command: 'echo "step1"',
            risk_level: 'low',
            dependencies: []
          },
          {
            id: 'step2',
            description: 'Second step',
            type: 'shell_cmd',
            command: 'echo "step2"',
            risk_level: 'low',
            dependencies: []
          }
        ],
        estimated_time: '2 minutes'
      };

      (askAI as jest.Mock).mockResolvedValue(
        '```json\n' + JSON.stringify(mockPlan) + '\n```'
      );

      (ToolExecutor.execute as jest.Mock).mockResolvedValue({
        success: true,
        output: 'step1 output',
        artifacts: []
      });

      await runtime.run('Execute two steps', undefined, undefined, 'test-model');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Plan created with 2 steps'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('▶️  Step 1/2'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('▶️  Step 2/2'));
      expect(ToolExecutor.execute).toHaveBeenCalledTimes(2);
      consoleSpy.mockRestore();
    });

    it('should handle step failure and continue', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { askAI } = require('../../../src/ai/client');
      const { ToolExecutor } = require('../../../src/agent/executor');

      const mockPlan = {
        plan: 'Test plan',
        steps: [
          {
            id: 'step1',
            description: 'First step',
            type: 'shell_cmd',
            command: 'echo "step1"',
            risk_level: 'low',
            dependencies: []
          },
          {
            id: 'step2',
            description: 'Failing step',
            type: 'shell_cmd',
            command: 'invalid-command',
            risk_level: 'low',
            dependencies: []
          }
        ],
        estimated_time: '2 minutes'
      };

      (askAI as jest.Mock).mockResolvedValue(
        '```json\n' + JSON.stringify(mockPlan) + '\n```'
      );

      (ToolExecutor.execute as jest.Mock)
        .mockResolvedValueOnce({ success: true, output: 'step1', artifacts: [] })
        .mockResolvedValueOnce({ success: false, error: 'Command failed', output: '' });

      // Setup to return 'y' (continue despite failure)
      mockReadlineInterface.question = jest.fn()
        .mockImplementationOnce((question: string, callback: any) => {
          callback('y');
        })
        .mockImplementationOnce((question: string, callback: any) => {
          callback('n'); // Stop after second step
        });

      await runtime.run('Execute plan with failure', undefined, undefined, 'test-model');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('❌ Step failed'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Step 1/2'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Step 2/2'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Execution stopped by user'));
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('🎉 All tasks completed'));
      consoleSpy.mockRestore();
    });

    it('should execute all steps successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { askAI } = require('../../../src/ai/client');
      const { ToolExecutor } = require('../../../src/agent/executor');

      const mockPlan = {
        plan: 'Test plan',
        steps: [
          {
            id: 'step1',
            description: 'Step 1',
            type: 'shell_cmd',
            command: 'echo "done"',
            risk_level: 'low',
            dependencies: []
          }
        ],
        estimated_time: '1 minute'
      };

      (askAI as jest.Mock).mockResolvedValue(
        '```json\n' + JSON.stringify(mockPlan) + '\n```'
      );

      (ToolExecutor.execute as jest.Mock).mockResolvedValue({
        success: true,
        output: 'Success',
        artifacts: []
      });

      await runtime.run('Execute single step', undefined, undefined, 'test-model');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Step completed'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🎉 All tasks completed'));
      expect(ToolExecutor.execute).toHaveBeenCalledTimes(1);
      consoleSpy.mockRestore();
    });

    it('should handle planner API error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { askAI } = require('../../../src/ai/client');

      (askAI as jest.Mock).mockRejectedValue(new Error('API unavailable'));

      await runtime.run('Try to plan', undefined, undefined, 'test-model');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Planner error'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Plan generation failed'));
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('Proceed with this plan'));
      consoleSpy.mockRestore();
    });

    it('should learn from successful step execution', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { askAI } = require('../../../src/ai/client');
      const { learnSkillFromRecord } = require('../../../src/agent/skills');
      const { createExecutionRecord } = require('../../../src/core/executionRecord');
      const { saveExecutionRecord } = require('../../../src/core/executionStore');
      const { loadExecutionRecord } = require('../../../src/core/executionStore');

      const mockPlan = {
        plan: 'Test execution plan',
          steps: [
            {
              id: 'step1',
              description: 'Execute echo',
              type: 'shell_cmd',
              command: 'echo "test"',
              risk_level: 'low',
              dependencies: []
            }
          ],
          estimated_time: '1 minute'
        };

      (askAI as jest.Mock).mockResolvedValue(
        '```json\n' + JSON.stringify(mockPlan) + '\n```'
      );

      await runtime.run('Execute plan', undefined, undefined, 'test-model');

      expect(createExecutionRecord).toHaveBeenCalled();
      expect(saveExecutionRecord).toHaveBeenCalled();
      expect(loadExecutionRecord).toHaveBeenCalled();
      expect(learnSkillFromRecord).toHaveBeenCalled();
      expect(learnSkillFromRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({ mode: 'agent' }),
          llmResult: expect.objectContaining({
            plan: expect.objectContaining({ goal: 'Execute echo' })
          })
        }),
        true
      );
      consoleSpy.mockRestore();
    });

    it('should update skill status on failed step', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { askAI } = require('../../../src/ai/client');
      const { ToolExecutor } = require('../../../src/agent/executor');
      const { getAllSkills } = require('../../../src/agent/skills');
      const { updateSkillStatus } = require('../../../src/agent/skills');

      const existingSkill = {
        id: 'existing-skill-id',
        name: 'Execute echo',
        description: 'Existing skill',
        whenToUse: 'Test',
        planTemplate: {},
        successCount: 5,
        failureCount: 1,
        confidence: 0.6,
        lastUsed: Date.now(),
        createdAt: Date.now() - 100000,
        enabled: true
      };

      (getAllSkills as jest.Mock).mockReturnValue([existingSkill]);

      const mockPlan = {
        plan: 'Test with failure',
          steps: [
            {
              id: 'step1',
              description: 'Execute echo',
              type: 'shell_cmd',
              command: 'echo "test"',
              risk_level: 'low',
              dependencies: []
            }
          ],
          estimated_time: '1 minute'
        };

      (askAI as jest.Mock).mockResolvedValue(
        '```json\n' + JSON.stringify(mockPlan) + '\n```'
      );

      (ToolExecutor.execute as jest.Mock)
        .mockResolvedValueOnce({ success: true, output: 'step1', artifacts: [] })
        .mockResolvedValueOnce({ success: false, error: 'Command failed', output: '' });

      mockReadlineInterface.question = jest.fn()
        .mockImplementationOnce((question: string, callback: any) => {
          callback('y');
        })
        .mockImplementationOnce((question: string, callback: any) => {
          callback('n');
        });

      await runtime.run('Execute with failure', undefined, undefined, 'test-model');

      expect(updateSkillStatus).toHaveBeenCalledWith('existing-skill-id', false);
      consoleSpy.mockRestore();
    });
  });

  describe('getExecutionState', () => {
    it('should return empty state initially', () => {
      const state = runtime.getExecutionState();
      expect(state.steps).toEqual([]);
      expect(state.currentIndex).toBe(0);
    });

    it('should track execution state after planning', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { askAI } = require('../../../src/ai/client');

      const mockPlan = {
        plan: 'Test',
        steps: [
          {
            id: 'step1',
            description: 'Step 1',
            type: 'shell_cmd',
            command: 'echo "test"',
            risk_level: 'low',
            dependencies: []
          }
        ],
        estimated_time: '1 min'
      };

      (askAI as jest.Mock).mockResolvedValue(
        '```json\n' + JSON.stringify(mockPlan) + '\n```'
      );

      // User rejects to stop execution
      mockReadlineInterface.question = jest.fn((question: string, callback: any) => {
        callback('n');
      });

      await runtime.run('Track state', undefined, undefined, 'test-model');

      const state = runtime.getExecutionState();
      expect(state.steps).toHaveLength(1);
      expect(state.currentIndex).toBe(0); // Reset after plan rejection
      consoleSpy.mockRestore();
    });
  });
});
