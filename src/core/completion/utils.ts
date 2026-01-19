import { CompletionItem } from './types';

export function unique(items: CompletionItem[]): CompletionItem[] {
  const seen = new Set<string>();
  return items.filter(i => {
    if (seen.has(i.label)) return false;
    seen.add(i.label);
    return true;
  });
}
