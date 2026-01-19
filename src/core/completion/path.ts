import fs from 'fs';
import path from 'path';

export type PathKind = 'file' | 'dir';

export function resolvePathSuggestions(
  input: string,
  kind: PathKind
): string[] {
  const cwd = process.cwd();
  const normalized = input.replace(/^~(?=$|\/)/, process.env.HOME || '');
  const isDirInput = normalized.endsWith(path.sep);

  const baseDir = isDirInput
    ? path.resolve(cwd, normalized)
    : path.resolve(cwd, path.dirname(normalized));

  const prefix = isDirInput ? '' : path.basename(normalized);

  try {
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    return entries
      .filter(e => !e.name.startsWith('.'))
      .filter(e => {
        if (kind === 'file') return e.isFile();
        return e.isDirectory();
      })
      .filter(e => e.name.startsWith(prefix))
      .map(e => {
        const fullPath = path.join(baseDir, e.name);
        const suggestion = e.isDirectory()
          ? fullPath + path.sep
          : fullPath;
        return suggestion.replace(/^\\/g, '');
      });
  } catch {
    return [];
  }
}
