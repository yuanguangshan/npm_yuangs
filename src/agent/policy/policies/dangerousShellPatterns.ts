/**
 * Dangerous shell command patterns used by both the policy (full evaluation)
 * and the engine (risk scoring). Kept here as the single source of truth.
 */
export const DANGEROUS_SHELL_PATTERNS: Array<{ pattern: RegExp; name: string; risk: string }> = [
  { pattern: /rm\s+-rf\s+\//, name: 'rm -rf /', risk: 'high' },
  { pattern: /rm\s+-rf\s+~/, name: 'rm -rf ~', risk: 'high' },
  { pattern: />\s*\/dev\/null/, name: 'Redirect to /dev/null', risk: 'medium' },
  { pattern: /dd\s+if=/, name: 'dd command', risk: 'high' },
  { pattern: /mkfs/, name: 'mkfs (filesystem creation)', risk: 'high' },
  { pattern: /format/, name: 'format command', risk: 'high' },
  { pattern: /sudo\s+rm/, name: 'sudo rm', risk: 'high' },
  { pattern: /chmod\s+777\s+\/(?!dev)/, name: 'chmod 777 on system', risk: 'high' },
  { pattern: /:\s*~\(\)/, name: 'fork bomb', risk: 'high' },
];
