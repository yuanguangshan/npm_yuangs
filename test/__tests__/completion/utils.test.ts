import { unique } from '../../../src/core/completion/utils';
import { CompletionItem } from '../../../src/core/completion/types';

describe('unique() - Utility', () => {
  it('should return empty array for empty input', () => {
    const result = unique([]);
    expect(result).toEqual([]);
  });

  it('should return single item for single-element array', () => {
    const items: CompletionItem[] = [{ label: 'ai' }];
    const result = unique(items);
    expect(result).toEqual([{ label: 'ai' }]);
  });

  it('should remove duplicate labels', () => {
    const items: CompletionItem[] = [
      { label: 'ai' },
      { label: 'ai' },
      { label: 'config' },
      { label: 'config' },
      { label: 'ai' }
    ];
    const result = unique(items);

    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('ai');
    expect(result[1].label).toBe('config');
  });

  it('should preserve first occurrence of each label', () => {
    const items: CompletionItem[] = [
      { label: 'cmd', insertText: 'first' },
      { label: 'cmd', insertText: 'second' },
      { label: 'cmd', insertText: 'third' }
    ];
    const result = unique(items);

    expect(result).toHaveLength(1);
    expect(result[0].insertText).toBe('first');
  });

  it('should handle items with different labels', () => {
    const items: CompletionItem[] = [
      { label: 'ai' },
      { label: 'list' },
      { label: 'config' },
      { label: 'help' }
    ];
    const result = unique(items);

    expect(result).toHaveLength(4);
    expect(result).toEqual(items);
  });

  it('should handle items with optional fields', () => {
    const items: CompletionItem[] = [
      { label: 'gemini', detail: 'Model' },
      { label: 'gemini', detail: 'Model 2' },
      { label: 'gpt', detail: 'GPT Model' }
    ];
    const result = unique(items);

    expect(result).toHaveLength(2);
    expect(result[0].detail).toBe('Model');
    expect(result[1].label).toBe('gpt');
  });

  it('should be case-sensitive', () => {
    const items: CompletionItem[] = [
      { label: 'AI' },
      { label: 'ai' },
      { label: 'Ai' }
    ];
    const result = unique(items);

    expect(result).toHaveLength(3);
  });
});
