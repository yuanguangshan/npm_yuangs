/**
 * 命令语义分类系统
 *
 * 将 shell 命令按语义分类，实现白名单安全模型：
 * - READ: 只读命令（cat, head, tail, stat, file 等）
 * - SEARCH: 搜索命令（grep, rg, find, locate 等）
 * - LIST: 列表命令（ls, tree, du 等）
 * - WRITE: 写入命令（echo >>, tee, cp, mv, rm 等）
 * - DANGEROUS: 危险命令（rm -rf /, dd, mkfs, curl|sh 等）
 *
 * 参考：cc/src/tools/BashTool/commandSemantics.ts, bashSecurity.ts, pathValidation.ts
 */

export type CommandCategory = 'READ' | 'SEARCH' | 'LIST' | 'WRITE' | 'DANGEROUS' | 'UNKNOWN';

export interface CommandAnalysis {
  category: CommandCategory;
  risk: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  isReadOnly: boolean;
  blockedCommands?: string[];
}

// ============================================================================
// 命令分类表
// ============================================================================

const READ_COMMANDS = new Set([
  'cat', 'head', 'tail', 'less', 'more', 'wc', 'stat', 'file',
  'strings', 'hexdump', 'od', 'base64', 'nl', 'md5sum', 'sha1sum', 'sha256sum',
  'diff', 'cmp', 'comm', 'patch', // 只读比较
  'du', 'df', // 磁盘信息
  'date', 'whoami', 'hostname', 'uname', 'pwd', 'echo', 'printf',
  'basename', 'dirname', 'readlink', 'realpath',
  'jq', 'awk', 'cut', 'sort', 'uniq', 'tr', 'sed', // 数据处理（只读输出）
]);

const SEARCH_COMMANDS = new Set([
  'grep', 'rg', 'ag', 'ack',
  'find', 'locate', 'which', 'whereis', 'whatis',
  'lsblk', 'mount',
]);

const LIST_COMMANDS = new Set([
  'ls', 'tree', 'dir',
]);

const WRITE_COMMANDS = new Set([
  'rm', 'rmdir',
  'mv', 'cp', 'ln',
  'mkdir', 'touch',
  'chmod', 'chown', 'chgrp',
  'tee', 'dd',
  'tar', 'zip', 'unzip', 'gzip', 'gunzip',
  'git', 'npm', 'yarn', 'pnpm', 'pip', 'go', 'cargo', 'node', 'python',
  'curl', 'wget', 'ssh', 'scp', 'rsync',
  'kill', 'killall', 'pkill',
  'systemctl', 'service', 'launchctl',
  'make', 'cmake', 'npx',
  'export', 'unset',
  'sed', 'awk', // sed -i 会写入
]);

// 危险模式（必须拦截）
const DANGEROUS_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /\brm\s+(-rf?|--recursive\s+--force)\s+\/\s*$/, reason: '删除根目录' },
  { pattern: /\brm\s+-rf?\s+\/\b/, reason: '递归删除根目录子树' },
  { pattern: /\bdd\s+if=\/dev\/zero/, reason: '用零填充设备' },
  { pattern: /\bdd\s+of=\/dev\/[a-z]/, reason: '写入设备' },
  { pattern: /\bmkfs\b/, reason: '格式化文件系统' },
  { pattern: />\s*\/dev\/sda/, reason: '直接写磁盘设备' },
  { pattern: />\s*\/dev\/vda/, reason: '直接写虚拟磁盘' },
  { pattern: />\s*\/dev\/nvme/, reason: '直接写 NVMe 设备' },
  { pattern: /:\(\)\{\s*:\|:\s*&\s*\}\s*;/, reason: 'Fork bomb' },
  { pattern: /\bwget\s+.*\s*\|\s*(sh|bash)\b/i, reason: '远程脚本执行' },
  { pattern: /\bcurl\s+.*\s*\|\s*(sh|bash)\b/i, reason: '远程脚本执行' },
  { pattern: /\bchmod\s+777\s+\/\b/, reason: '全局权限开放' },
  { pattern: /\bchown\s+-R\s+.*\s+\/\b/, reason: '递归更改全局所有权' },
  { pattern: /\bsudo\s+rm\s+-rf\s+\/\b/, reason: 'sudo 删除根目录' },
  { pattern: />\s*\/etc\/(passwd|shadow|sudoers)/, reason: '写入系统认证文件' },
  // === 绕过变体 ===
  { pattern: /\brm\s+(-r\s+-f|-f\s+-r|--recursive\s+-f|-r\s+--force|--force\s+-r)\s+\/\s*$/, reason: '删除根目录（参数拆分绕过）' },
  { pattern: /\benv\s+rm\s+-rf\s+\/\b/, reason: 'env 前缀绕过删除根目录' },
  { pattern: /\bsudo\s+env\s+rm\s+-rf\s+\/\b/, reason: 'sudo env 前缀绕过删除根目录' },
  { pattern: /\bbase64\s+(-d|--decode)\s*\|.*\b(sh|bash|zsh)\b/i, reason: 'base64 解码后脚本执行' },
  { pattern: /\bxargs\s+(rm\s+-rf|dd|mkfs|chmod|chown)\b/i, reason: 'xargs 管道破坏命令' },
  { pattern: /\bfind\s+\/[^&|;\s]*\s+-exec\s+(rm|dd|mkfs|chmod)\b/i, reason: 'find -exec 系统目录破坏' },
  { pattern: /`\s*(rm\s+-rf|dd|mkfs)/i, reason: '反引号注入破坏命令' },
  { pattern: /\$\(.*\b(rm\s+-rf|dd|mkfs)\b.*\)/i, reason: '子命令注入破坏命令' },
  { pattern: /\bwget\s+-O-.*\|\s*(sh|bash|zsh)\b/i, reason: 'wget 远程脚本执行（变体）' },
  { pattern: /\bcurl\s+-sL.*\|\s*(sh|bash|zsh)\b/i, reason: 'curl 远程脚本执行（变体）' },
  { pattern: /\beval\s+.*\b(rm\s+-rf|dd|mkfs|chmod\s+777)\b/i, reason: 'eval 执行破坏命令' },
];

// ============================================================================
// 核心分析函数
// ============================================================================

/**
 * 解析命令，提取基础命令名
 * 处理管道、重定向、逻辑运算符
 */
function extractBaseCommand(command: string): string {
  const trimmed = command.trim();
  // 提取第一个命令（管道前）
  const first = trimmed.split(/\s*[|;&]\s*/)[0].trim();
  // 提取命令名
  const parts = first.split(/\s+/);
  return parts[0] ? parts[0].toLowerCase() : '';
}

/**
 * 检查命令是否包含危险模式
 */
function checkDangerous(command: string): { dangerous: boolean; reason?: string } {
  for (const { pattern, reason } of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      return { dangerous: true, reason };
    }
  }
  return { dangerous: false };
}

/**
 * 检查命令是否包含写入操作（sed -i, tee, 重定向等）
 */
function hasWriteOperation(command: string): boolean {
  const trimmed = command.trim();
  // 重定向操作
  if (/>[>]?/.test(trimmed) && !/>\s*\/dev\/null/.test(trimmed)) return true;
  // sed -i
  if (/\bsed\s+(-[A-Za-z]*i|-i\b)/.test(trimmed)) return true;
  // tee
  if (/\btee\b/.test(trimmed)) return true;
  return false;
}

/**
 * 分析命令的语义分类
 */
export function analyzeCommand(command: string, allowedCwd?: string): CommandAnalysis {
  const trimmed = command.trim();

  // 1. 首先检查危险模式
  const dangerous = checkDangerous(trimmed);
  if (dangerous.dangerous) {
    return {
      category: 'DANGEROUS',
      risk: 'critical',
      description: `🚫 安全拦截: ${dangerous.reason}`,
      isReadOnly: false,
    };
  }

  // 2. 检查路径安全（如果指定了允许的工作目录）
  if (allowedCwd) {
    const pathCheck = checkPathSafety(trimmed, allowedCwd);
    if (pathCheck.blocked) {
      return {
        category: 'DANGEROUS',
        risk: 'critical',
        description: pathCheck.reason || '路径安全检查未通过',
        isReadOnly: false,
        blockedCommands: pathCheck.blockedCommands,
      };
    }
  }

  // 3. 提取基础命令
  const baseCmd = extractBaseCommand(trimmed);

  // 4. 分类
  if (SEARCH_COMMANDS.has(baseCmd)) {
    return {
      category: 'SEARCH',
      risk: 'low',
      description: `搜索命令: ${baseCmd}`,
      isReadOnly: true,
    };
  }

  if (LIST_COMMANDS.has(baseCmd)) {
    return {
      category: 'LIST',
      risk: 'low',
      description: `列表命令: ${baseCmd}`,
      isReadOnly: true,
    };
  }

  // READ 命令需要检查是否有写入操作
  if (READ_COMMANDS.has(baseCmd)) {
    const hasWrite = hasWriteOperation(trimmed);
    return {
      category: hasWrite ? 'WRITE' : 'READ',
      risk: hasWrite ? 'medium' : 'low',
      description: hasWrite ? `数据命令带写入: ${baseCmd}` : `读取命令: ${baseCmd}`,
      isReadOnly: !hasWrite,
    };
  }

  if (WRITE_COMMANDS.has(baseCmd)) {
    return {
      category: 'WRITE',
      risk: getWriteRisk(baseCmd, trimmed),
      description: `写入命令: ${baseCmd}`,
      isReadOnly: false,
    };
  }

  // 未知命令，保守处理
  return {
    category: 'UNKNOWN',
    risk: 'medium',
    description: `未知命令: ${baseCmd}`,
    isReadOnly: false,
  };
}

/**
 * 获取写入命令的风险等级
 */
function getWriteRisk(cmd: string, fullCommand: string): 'low' | 'medium' | 'high' {
  // 高风险：删除、权限修改
  if (['rm', 'rmdir', 'chmod', 'chown'].includes(cmd)) return 'high';
  // 中风险：移动、复制、网络
  if (['mv', 'curl', 'wget', 'kill', 'killall'].includes(cmd)) return 'medium';
  // 低风险：创建目录、touch
  if (['mkdir', 'touch'].includes(cmd)) return 'low';
  return 'medium';
}

// ============================================================================
// 路径安全检查
// ============================================================================

interface PathCheckResult {
  blocked: boolean;
  reason?: string;
  blockedCommands?: string[];
}

const DANGEROUS_PATHS = ['/', '/etc', '/usr', '/var', '/tmp', '/root', '/home', '/System'];
const DANGEROUS_CD_PATTERNS = [
  /\bcd\s+\/\s*$/,
  /\bcd\s+\/[^.]/,
];

function checkPathSafety(command: string, allowedCwd: string): PathCheckResult {
  // 检查 cd 到危险目录
  for (const pattern of DANGEROUS_CD_PATTERNS) {
    if (pattern.test(command)) {
      return {
        blocked: true,
        reason: `🚫 不允许切换到系统目录。允许的工作目录: ${allowedCwd}`,
        blockedCommands: ['cd /'],
      };
    }
  }

  // 检查绝对路径是否超出允许范围
  const absPathRegex = /(?:^|\s)(\/[^&|;\s>]+)/g;
  let match;
  while ((match = absPathRegex.exec(command)) !== null) {
    const path = match[1];
    // 跳过常见的安全路径
    if (path === '/dev/null' || path === '/dev/stdin') continue;
    // 检查是否在允许目录内
    if (!path.startsWith(allowedCwd)) {
      // 警告但不阻塞（只阻塞危险路径）
      if (DANGEROUS_PATHS.some(dp => path.startsWith(dp))) {
        return {
          blocked: true,
          reason: `🚫 不允许操作系统目录: ${path}。允许的工作目录: ${allowedCwd}`,
          blockedCommands: [path],
        };
      }
    }
  }

  return { blocked: false };
}

/**
 * 获取所有允许的命令列表（用于 prompt 生成）
 */
export function getAllowedCommandsSummary(): string {
  return [
    `READ: ${[...READ_COMMANDS].slice(0, 10).join(', ')}...`,
    `SEARCH: ${[...SEARCH_COMMANDS].join(', ')}`,
    `LIST: ${[...LIST_COMMANDS].join(', ')}`,
    `WRITE: ${[...WRITE_COMMANDS].slice(0, 10).join(', ')}...`,
  ].join('\n');
}
