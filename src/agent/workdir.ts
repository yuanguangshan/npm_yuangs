/**
 * 共享工作目录状态（打破 executor ↔ tools 循环依赖）。
 */
let _allowedCwd: string = process.cwd();

export function setAllowedCwd(cwd: string): void {
  _allowedCwd = cwd;
}

export function getAllowedCwd(): string {
  return _allowedCwd;
}
