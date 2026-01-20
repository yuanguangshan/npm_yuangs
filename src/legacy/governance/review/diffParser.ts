export interface DiffFile {
  file: string;
  additions: number;
  deletions: number;
  hunks: string[];
}

export function parseUnifiedDiff(diff: string): DiffFile[] {
  const files: DiffFile[] = [];
  let current: DiffFile | null = null;

  for (const line of diff.split("\n")) {
    if (line.startsWith("diff --git")) {
      if (current) {
        files.push(current);
      }
      const match = line.match(/b\/(.+)$/);
      const file = match ? match[1] : "unknown";
      current = { file, additions: 0, deletions: 0, hunks: [] };
    } else if (!current) {
      continue;
    } else if (line.startsWith("+") && !line.startsWith("+++")) {
      current.additions++;
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      current.deletions++;
    } else if (line.startsWith("@@")) {
      current.hunks.push(line);
    }
  }

  if (current) {
    files.push(current);
  }

  return files;
}

export function extractFilesFromDiff(diff: string): string[] {
  const files: string[] = [];
  const filePattern = /^\+\+\+ b\/(.+)$/gm;

  for (const match of diff.matchAll(filePattern)) {
    files.push(match[1]);
  }

  return files;
}

export function assessRisk(files: DiffFile[]): {
  level: "low" | "medium" | "high";
  warnings: string[];
} {
  const warnings: string[] = [];
  const totalLines = files.reduce(
    (sum, f) => sum + f.additions + f.deletions,
    0
  );

  if (totalLines > 300) {
    warnings.push(`Large changeset: ${totalLines} lines`);
  }

  if (files.length > 10) {
    warnings.push(`Many files touched: ${files.length}`);
  }

  if (totalLines > 1000) {
    return { level: "high", warnings };
  }

  if (totalLines > 300 || files.length > 10) {
    return { level: "medium", warnings };
  }

  return { level: "low", warnings };
}
