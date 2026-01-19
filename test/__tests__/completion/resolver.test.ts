import { complete } from '../../../src/core/completion';
import { setProgramInstance } from '../../../src/core/completion';
import { Command } from 'commander';

describe('complete() - Unified Entry', () => {
  beforeEach(() => {
    const program = new Command();
    setProgramInstance(program);
  });

  it('should return empty response for invalid words array', async () => {
    const res = await complete({
      words: null as any,
      currentIndex: 0
    });

    expect(res.items).toEqual([]);
    expect(res.isPartial).toBe(false);
  });

  it('should return empty response for non-array words', async () => {
    const res = await complete({
      words: 'not-array' as any,
      currentIndex: 0
    });

    expect(res.items).toEqual([]);
    expect(res.isPartial).toBe(false);
  });

  it('should return empty response for negative currentIndex', async () => {
    const res = await complete({
      words: ['yuangs', 'ai'],
      currentIndex: -1
    });

    expect(res.items).toEqual([]);
    expect(res.isPartial).toBe(false);
  });

  it('should return empty response for out-of-bounds currentIndex', async () => {
    const res = await complete({
      words: ['yuangs', 'ai'],
      currentIndex: 5
    });

    expect(res.items).toEqual([]);
    expect(res.isPartial).toBe(false);
  });

  it('should return items for valid request', async () => {
    const res = await complete({
      words: ['yuangs', 'a'],
      currentIndex: 1
    });

    expect(res.items.length).toBeGreaterThan(0);
    expect(res.isPartial).toBe(true);
  });

  it('should filter items by current word prefix', async () => {
    const res = await complete({
      words: ['yuangs', 'con'],
      currentIndex: 1
    });

    res.items.forEach(item => {
      expect(item.label).toMatch(/^con/);
    });
  });
});
