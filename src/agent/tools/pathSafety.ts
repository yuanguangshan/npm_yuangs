import fs from 'fs/promises';
import path from 'path';

/**
 * Known dangerous system paths that should never be accessed,
 * even if they happen to be under allowedCwd (e.g. via symlink).
 */
const SYSTEM_PATHS = [
  '/etc', '/usr', '/var', '/tmp', '/root', '/home',
  '/System', '/Library', '/Applications',
  '/dev', '/proc', '/sys', '/boot'
];

/**
 * Resolve a path and validate it's safe to access.
 *
 * @param targetPath The path to validate (may be relative or contain symlinks)
 * @param allowedCwd The root directory that access should be confined to
 * @returns The resolved absolute path if safe
 * @throws Error if the path is outside allowedCwd or points to a system path
 */
export async function resolveAndValidate(targetPath: string, allowedCwd: string): Promise<string> {
  // 1. Normalize to absolute path
  const resolved = path.resolve(allowedCwd, targetPath);

  // 2. Check against known system paths (string-level check, fast)
  for (const sysPath of SYSTEM_PATHS) {
    if (resolved === sysPath || resolved.startsWith(sysPath + '/')) {
      throw new Error(`Access denied: ${resolved} is a protected system path`);
    }
  }

  // 3. Resolve symlinks to get the real path
  let realPath: string;
  try {
    realPath = await fs.realpath(resolved);
  } catch (error: any) {
    // File may not exist yet (e.g. write_file creating new file)
    // For non-existent files, validate the parent directory
    const parentDir = path.dirname(resolved);
    try {
      const realParent = await fs.realpath(parentDir);
      if (!isPathInScope(realParent, allowedCwd)) {
        throw new Error(`Access denied: parent directory of ${resolved} is outside allowed workspace`);
      }
      return resolved;
    } catch {
      // Parent doesn't exist either — allow it (write_file will create dirs)
      // But still check that the resolved path is under allowedCwd
      if (!isPathInScope(resolved, allowedCwd)) {
        throw new Error(`Access denied: ${resolved} is outside allowed workspace`);
      }
      return resolved;
    }
  }

  // 4. Validate real path is under allowedCwd
  if (!isPathInScope(realPath, allowedCwd)) {
    throw new Error(`Access denied: ${realPath} resolves outside allowed workspace (${allowedCwd})`);
  }

  // 5. Double-check: real path shouldn't point to system paths (symlink escape)
  for (const sysPath of SYSTEM_PATHS) {
    if (realPath === sysPath || realPath.startsWith(sysPath + '/')) {
      throw new Error(`Access denied: ${targetPath} resolves to protected system path ${realPath}`);
    }
  }

  return realPath;
}

/**
 * Check if a resolved path is within the allowed scope.
 * Both paths should already be absolute/normalized.
 */
function isPathInScope(targetPath: string, allowedCwd: string): boolean {
  const normalizedTarget = path.normalize(targetPath);
  const normalizedCwd = path.normalize(allowedCwd);

  // Ensure allowedCwd has a trailing separator for proper prefix check
  const cwdPrefix = normalizedCwd.endsWith(path.sep)
    ? normalizedCwd
    : normalizedCwd + path.sep;

  return normalizedTarget === normalizedCwd || normalizedTarget.startsWith(cwdPrefix);
}
