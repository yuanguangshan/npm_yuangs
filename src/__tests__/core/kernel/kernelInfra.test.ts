import { AtomicTransactionManager } from '../../../core/kernel/AtomicTransactionManager';
import { PostCheckVerifier } from '../../../core/kernel/PostCheckVerifier';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

/**
 * P1 优化：证明 core/kernel 下的原子事务与后验证器是"活的、可用的"基础设施，
 * 而非死代码。WriteFile 现已在 YUANGS_POST_TYPECHECK=1 时接入 PostCheckVerifier。
 */
describe('Kernel infrastructure (P1 wiring)', () => {
  // AtomicTransactionManager 以 process.cwd() 为基准做相对路径快照/回滚，
  // 因此测试文件必须位于 cwd 之下（与真实使用场景一致：agent 在仓库内写文件）。
  let baseDir: string;

  beforeEach(async () => {
    baseDir = path.join(process.cwd(), '.yuangs-kernel-test');
    await fs.mkdir(baseDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(baseDir, { recursive: true, force: true });
  });

  describe('AtomicTransactionManager', () => {
    it('abortBatch rolls back files to their pre-transaction state', async () => {
      const file = path.join(baseDir, 'a.txt');
      await fs.writeFile(file, 'original', 'utf-8');
      const atm = new AtomicTransactionManager(path.join(baseDir, 'snapshots'));

      const txId = await atm.startBatch('edit-a', [file]);
      await fs.writeFile(file, 'changed', 'utf-8');

      await atm.abortBatch(txId);

      const content = await fs.readFile(file, 'utf-8');
      expect(content).toBe('original');
    });

    it('commitBatch keeps the modified state and succeeds', async () => {
      const file = path.join(baseDir, 'b.txt');
      await fs.writeFile(file, 'original', 'utf-8');
      const atm = new AtomicTransactionManager(path.join(baseDir, 'snapshots'));

      const txId = await atm.startBatch('edit-b', [file]);
      await fs.writeFile(file, 'changed', 'utf-8');

      const result = await atm.commitBatch(txId);
      expect(result.success).toBe(true);

      const content = await fs.readFile(file, 'utf-8');
      expect(content).toBe('changed');
    });

    it('commitBatch on unknown id returns failure', async () => {
      const atm = new AtomicTransactionManager(path.join(baseDir, 'snapshots'));
      const result = await atm.commitBatch('does-not-exist');
      expect(result.success).toBe(false);
    });
  });

  describe('PostCheckVerifier', () => {
    it('reports passed=true when the check command exits 0', async () => {
      const verifier = new PostCheckVerifier({
        typeCheckCommand: 'node -e "process.exit(0)"',
        cwd: baseDir,
      });
      const res = await verifier.verifyTypeCheck();
      expect(res.passed).toBe(true);
    });

    it('reports passed=false when the check command exits non-zero', async () => {
      const verifier = new PostCheckVerifier({
        typeCheckCommand: 'node -e "process.exit(1)"',
        cwd: baseDir,
      });
      const res = await verifier.verifyTypeCheck();
      expect(res.passed).toBe(false);
    });
  });
});
