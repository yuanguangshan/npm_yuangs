/**
 * 统一的危险 shell 命令模式源。
 *
 * 这是整个项目的唯一权威危险模式定义。
 * 使用者：
 *   - PolicyEngine (policy/engine.ts) — 风险评分
 *   - NoDangerousShellPolicy (policies/noDangerousShell.ts) — 拦截
 *   - SSH SimpleGovernanceService (commands/ssh/index.ts) — 远程拦截
 *   - commandSemantics.ts (analyzeCommand) — 语义分析
 */

export interface DangerousShellPattern {
  pattern: RegExp;
  name: string;
  reason: string;
  risk: 'medium' | 'high' | 'critical';
}

/** 危险命令模式（27 条，覆盖根目录删除、设备写入、远程脚本、注入绕过等） */
export const DANGEROUS_SHELL_PATTERNS: DangerousShellPattern[] = [
  // === 根目录破坏 ===
  { pattern: /\brm\s+(-rf?|--recursive\s+--force)\s+\/\s*$/, name: 'rm -rf /', reason: '删除根目录', risk: 'critical' },
  { pattern: /\brm\s+-rf?\s+\/\b/, name: 'rm -rf / subtree', reason: '递归删除根目录子树', risk: 'critical' },
  { pattern: /\bsudo\s+rm\s+-rf\s+\/\b/, name: 'sudo rm -rf /', reason: 'sudo 删除根目录', risk: 'critical' },

  // === 设备写入 ===
  { pattern: /\bdd\s+if=\/dev\/zero/, name: 'dd /dev/zero', reason: '用零填充设备', risk: 'critical' },
  { pattern: /\bdd\s+of=\/dev\/[a-z]/, name: 'dd to device', reason: '写入设备', risk: 'critical' },
  { pattern: /mkfs/, name: 'mkfs', reason: '格式化文件系统', risk: 'critical' },
  { pattern: />>\s*\/dev\/sda/, name: 'write /dev/sda', reason: '直接写磁盘设备', risk: 'critical' },
  { pattern: />>\s*\/dev\/vda/, name: 'write /dev/vda', reason: '直接写虚拟磁盘', risk: 'critical' },
  { pattern: />>\s*\/dev\/nvme/, name: 'write /dev/nvme', reason: '直接写 NVMe 设备', risk: 'critical' },

  // === 系统认证文件 ===
  { pattern: />>\s*\/etc\/(passwd|shadow|sudoers)/, name: 'write system auth', reason: '写入系统认证文件', risk: 'critical' },

  // === Fork bomb ===
  { pattern: /:\s*\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;/, name: 'fork bomb', reason: 'Fork bomb', risk: 'critical' },

  // === 远程脚本执行 ===
  { pattern: /\bwget\s+.*\s*\|\s*(sh|bash)\b/i, name: 'wget | sh', reason: '远程脚本执行', risk: 'high' },
  { pattern: /\bcurl\s+.*\s*\|\s*(sh|bash)\b/i, name: 'curl | sh', reason: '远程脚本执行', risk: 'high' },
  { pattern: /\bwget\s+-O-.*\|\s*(sh|bash|zsh)\b/i, name: 'wget -O- | sh', reason: '远程脚本执行（变体）', risk: 'high' },
  { pattern: /\bcurl\s+-sL.*\|\s*(sh|bash|zsh)\b/i, name: 'curl -sL | sh', reason: '远程脚本执行（变体）', risk: 'high' },
  { pattern: /\bbase64\s+(-d|--decode)\s*\|.*\b(sh|bash|zsh)\b/i, name: 'base64 | sh', reason: 'base64 解码后脚本执行', risk: 'high' },

  // === 权限/所有权滥用 ===
  { pattern: /\bchmod\s+777\s+\/\b/, name: 'chmod 777 /', reason: '全局权限开放', risk: 'high' },
  { pattern: /\bchown\s+-R\s+.*\s+\/\b/, name: 'chown -R /', reason: '递归更改全局所有权', risk: 'high' },

  // === 绕过变体 ===
  { pattern: /\brm\s+(-r\s+-f|-f\s+-r|--recursive\s+-f|-r\s+--force|--force\s+-r)\s+\/\s*$/, name: 'rm -rf / bypass', reason: '删除根目录（参数拆分绕过）', risk: 'critical' },
  { pattern: /\benv\s+rm\s+-rf\s+\/\b/, name: 'env rm -rf /', reason: 'env 前缀绕过删除根目录', risk: 'critical' },
  { pattern: /\bsudo\s+env\s+rm\s+-rf\s+\/\b/, name: 'sudo env rm -rf /', reason: 'sudo env 前缀绕过删除根目录', risk: 'critical' },
  { pattern: /\bxargs\s+(rm\s+-rf|dd|mkfs|chmod|chown)\b/i, name: 'xargs dangerous', reason: 'xargs 管道破坏命令', risk: 'high' },
  { pattern: /\bfind\s+\/[^&|;\s]*\s+-exec\s+(rm|dd|mkfs|chmod)\b/i, name: 'find -exec dangerous', reason: 'find -exec 系统目录破坏', risk: 'high' },
  { pattern: /`\s*(rm\s+-rf|dd|mkfs)/i, name: 'backtick injection', reason: '反引号注入破坏命令', risk: 'high' },
  { pattern: /\$\(.*\b(rm\s+-rf|dd|mkfs)\b.*\)/i, name: 'subcommand injection', reason: '子命令注入破坏命令', risk: 'high' },
  { pattern: /\beval\s+.*\b(rm\s+-rf|dd|mkfs|chmod\s+777)\b/i, name: 'eval dangerous', reason: 'eval 执行破坏命令', risk: 'high' },

  // === 辅助：sudo rm（泛指，risk 低于特定路径） ===
  { pattern: /\bsudo\s+rm\b/, name: 'sudo rm', reason: 'sudo 删除操作', risk: 'high' },
];

/**
 * 检查命令是否包含危险模式。
 * 返回命中的第一个模式，无则返回 null。
 */
export function checkDangerousCommand(command: string): DangerousShellPattern | null {
  for (const p of DANGEROUS_SHELL_PATTERNS) {
    if (p.pattern.test(command)) {
      return p;
    }
  }
  return null;
}

/**
 * 命令是否是危险的。
 */
export function isDangerousCommand(command: string): boolean {
  return checkDangerousCommand(command) !== null;
}
