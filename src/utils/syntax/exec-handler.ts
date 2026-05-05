import { logger } from '../../utils/Logger';

const log = logger.child('SyntaxHandler');

/**
 * :exec — 原子执行命令（终端直接输出，不捕获给 AI）
 */
export async function handleAtomicExec(
  command: string,
): Promise<{ processed: boolean; result: string }> {
  log.info(`⚡️ [Atomic Exec] 执行命令: ${command}`);

  try {
    const { spawn } = require('child_process');
    const child = spawn(command, {
      shell: true,
      stdio: 'inherit',
    });

    await new Promise<void>((resolve, reject) => {
      child.on('close', (code: number) => {
        if (code === 0) resolve();
        else reject(new Error(`Exit code ${code}`));
      });
      child.on('error', reject);
    });

    return { processed: true, result: '' };
  } catch (error) {
    log.error(`执行失败: ${error}`);
    return { processed: true, result: '' };
  }
}
