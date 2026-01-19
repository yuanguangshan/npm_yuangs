import { CompletionRequest, CompletionItem, CompletionResponse } from '../../../src/core/completion/types';

describe('Completion Types', () => {
  describe('CompletionRequest', () => {
    it('should have required properties', () => {
      const req: CompletionRequest = {
        words: ['yuangs', 'ai', 'chat'],
        currentIndex: 2
      };

      expect(req.words).toEqual(['yuangs', 'ai', 'chat']);
      expect(req.currentIndex).toBe(2);
    });

    it('should accept empty words array', () => {
      const req: CompletionRequest = {
        words: [],
        currentIndex: 0
      };

      expect(req.words).toEqual([]);
      expect(req.currentIndex).toBe(0);
    });

    it('should handle edge case: currentIndex at boundary', () => {
      const req: CompletionRequest = {
        words: ['yuangs', 'ai'],
        currentIndex: 1
      };

      expect(req.currentIndex).toBe(1);
    });
  });

  describe('CompletionItem', () => {
    it('should accept minimal item with only label', () => {
      const item: CompletionItem = { label: 'ai' };

      expect(item.label).toBe('ai');
    });

    it('should accept optional insertText', () => {
      const item: CompletionItem = { label: 'model', insertText: '--model' };

      expect(item.label).toBe('model');
      expect(item.insertText).toBe('--model');
    });

    it('should accept optional detail', () => {
      const item: CompletionItem = {
        label: 'ai',
        detail: 'Chat with AI'
      };

      expect(item.label).toBe('ai');
      expect(item.detail).toBe('Chat with AI');
    });

    it('should accept all optional fields', () => {
      const item: CompletionItem = {
        label: 'gemini-2.5-flash-lite',
        insertText: 'gemini-2.5-flash-lite',
        detail: 'Fast AI model'
      };

      expect(item.label).toBe('gemini-2.5-flash-lite');
      expect(item.insertText).toBe('gemini-2.5-flash-lite');
      expect(item.detail).toBe('Fast AI');
    });
  });

  describe('CompletionResponse', () => {
    it('should accept empty items array', () => {
      const res: CompletionResponse = {
        items: [],
        isPartial: false
      };

      expect(res.items).toEqual([]);
      expect(res.isPartial).toBe(false);
    });

    it('should accept multiple items', () => {
      const res: CompletionResponse = {
        items: [
          { label: 'ai' },
          { label: 'list' },
          { label: 'config' }
        ],
        isPartial: true
      };

      expect(res.items).toHaveLength(3);
      expect(res.isPartial).toBe(true);
    });

    it('should accept items with optional fields', () => {
      const res: CompletionResponse = {
        items: [
          {
            label: 'gemini-2.5-flash-lite',
            detail: 'Fast model'
          }
        ],
        isPartial: true
      };

      expect(res.items[0].label).toBe('gemini-2.5-flash-lite');
      expect(res.items[0].detail).toBe('Fast model');
      expect(res.isPartial).toBe(true);
    });
  });
});
