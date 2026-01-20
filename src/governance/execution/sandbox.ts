import { execSync } from "child_process";

export interface ExecutionSnapshot {
  id: string;
  commitHash: string;
  timestamp: number;
  isClean: boolean;
}

export function createSnapshot(): ExecutionSnapshot {
  const statusOutput = execSync("git status --porcelain", {
    encoding: "utf-8",
  }).trim();

  const isClean = statusOutput.length === 0;

  if (!isClean) {
    throw new Error(
      "Cannot create snapshot: working tree is dirty. Commit or stash changes first."
    );
  }

  const commitHash = execSync("git rev-parse HEAD", {
    encoding: "utf-8",
  }).trim();

  return {
    id: commitHash,
    commitHash,
    timestamp: Date.now(),
    isClean,
  };
}

export function verifySnapshot(snapshotId: string): boolean {
  try {
    const current = execSync("git rev-parse HEAD", {
      encoding: "utf-8",
    }).trim();

    return current === snapshotId;
  } catch {
    return false;
  }
}

export function rollbackToSnapshot(snapshotId: string): void {
  try {
    execSync(`git reset --hard ${snapshotId}`, {
      stdio: "inherit",
    });
    console.log(`Rolled back to snapshot ${snapshotId}`);
  } catch (error) {
    throw new Error(
      `Failed to rollback to snapshot ${snapshotId}: ${error}`
    );
  }
}

export function commitChanges(message: string, snapshotId: string): void {
  try {
    execSync(`git commit -am "${message}"`, {
      stdio: "inherit",
    });
  } catch (error) {
    throw new Error(`Failed to commit changes: ${error}`);
  }
}

export function getChangedFiles(): string[] {
  const output = execSync("git diff --name-only", {
    encoding: "utf-8",
  });

  return output
    .trim()
    .split("\n")
    .filter((f) => f.length > 0);
}

export function assertNoExtraChanges(
  approvedFiles: string[],
  actualFiles: string[]
): void {
  const approvedSet = new Set(approvedFiles);
  const extraFiles = actualFiles.filter((f) => !approvedSet.has(f));

  if (extraFiles.length > 0) {
    throw new Error(
      `Governance violation: execution modified undeclared files:\n${extraFiles.join("\n")}`
    );
  }
}
