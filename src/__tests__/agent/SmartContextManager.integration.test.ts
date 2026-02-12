import { SmartContextManager } from '../../../src/agent/smartContextManager';
import { ContextManager } from '../../../src/agent/contextManager';
import { saveContext, clearContextStorage } from '../../../src/commands/contextStorage';
import fs from 'fs/promises';
import path from 'path';

const CONTEXT_DIR = path.resolve(process.cwd(), '.ai');
const CONTEXT_FILE = path.join(CONTEXT_DIR, 'context.json');

jest.mock('../../../src/commands/contextStorage');

describe('SmartContextManager P0 Fix: Persisted Context Integration', () => {
  let smartManager: SmartContextManager;

  beforeEach(() => {
    smartManager = new SmartContextManager();
  });

  afterEach(async () => {
    await clearContextStorage();
  });

  describe('loadPersistedContext', () => {
    it('should load persisted context items from storage', async () => {
      const mockPersisted = [
        { path: 'src/index.ts', content: 'export const x = 1;', summary: 'x is 1' },
        { path: 'src/utils.ts', content: 'export const y = 2;', summary: 'y is 2' }
      ];

      jest.spyOn(require('../../../src/commands/contextStorage'), 'loadContext')
        .mockResolvedValue(mockPersisted);

      const result = await smartManager['loadPersistedContext']();

      expect(result).toEqual(mockPersisted);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no persisted context exists', async () => {
      jest.spyOn(require('../../../src/commands/contextStorage'), 'loadContext')
        .mockResolvedValue([]);

      const result = await smartManager['loadPersistedContext']();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should handle errors gracefully and return empty array', async () => {
      jest.spyOn(require('../../../src/commands/contextStorage'), 'loadContext')
        .mockRejectedValue(new Error('Storage error'));

      const result = await smartManager['loadPersistedContext']();

      expect(result).toEqual([]);
    });
  });

  describe('getEnhancedContext with persisted context', () => {
    it('should include persisted context in relevance ranking', async () => {
      const mockPersisted = [
        { path: 'src/utils.ts', content: 'export function helper() {}', summary: 'Helper function' },
        { path: 'src/types.ts', content: 'export type MyType = string;', summary: 'Type definition' }
      ];

      jest.spyOn(require('../../../src/commands/contextStorage'), 'loadContext')
        .mockResolvedValue(mockPersisted);

      (smartManager as any).messages = [
        { role: 'user', content: '@src/index.ts' }
      ];

      const result = await smartManager.getEnhancedContext({
        query: 'src utils helper',
        minRelevance: 0.05,
        maxTokens: 10000,
        enableSmartSummary: true
      });

      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.rankedItems).toBeDefined();
      expect(result.summary).toBeTruthy();
    });

    it('should merge persisted context with message-based context', async () => {
      const mockPersisted = [
        { path: 'src/config.ts', content: 'export const config = {};', summary: 'Config object' }
      ];

      jest.spyOn(require('../../../src/commands/contextStorage'), 'loadContext')
        .mockResolvedValue(mockPersisted);

      (smartManager as any).messages = [
        { role: 'user', content: '@src/index.ts' },
        { role: 'assistant', content: 'Help provided' }
      ];

      const result = await smartManager.getEnhancedContext({
        query: 'config and index',
        minRelevance: 0.3,
        maxTokens: 10000,
        enableSmartSummary: true
      });

      expect(result.totalCount).toBeGreaterThanOrEqual(1);
    });

    it('should handle empty persisted context gracefully', async () => {
      jest.spyOn(require('../../../src/commands/contextStorage'), 'loadContext')
        .mockResolvedValue([]);

      const result = await smartManager.getEnhancedContext({
        query: 'test query',
        minRelevance: 0.3,
        maxTokens: 10000,
        enableSmartSummary: true
      });

      expect(result).toBeDefined();
      expect(result.rankedItems).toBeDefined();
    });
  });

  describe('Context drift detection integration', () => {
    it('should detect and handle drifted persisted items', async () => {
      const mockPersistedWithDrift = [
        { path: 'src/changed.ts', content: 'old content', summary: 'old summary', status: 'stale', drifted: true },
        { path: 'src/active.ts', content: 'active content', summary: 'active summary', status: 'active', drifted: false }
      ];

      jest.spyOn(require('../../../src/commands/contextStorage'), 'loadContext')
        .mockResolvedValue(mockPersistedWithDrift);

      const result = await smartManager.getEnhancedContext({
        query: 'content',
        minRelevance: 0.3,
        maxTokens: 10000,
        enableSmartSummary: true
      });

      expect(result.totalCount).toBe(2);
    });
  });
});
