// @ts-nocheck
import {
  analyzeRiskLevel,
  generateRiskDisclosure,
  formatRiskDisclosureCLI
} from '../../../src/agent/riskDisclosure';

describe('riskDisclosure', () => {
  describe('analyzeRiskLevel', () => {
    it('should calculate low risk for safe operations', () => {
      const factors = {
        commandType: 'file_read',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false
      };

      const risk = analyzeRiskLevel(factors);

      expect(risk.level).toBe('low');
      expect(risk.score).toBeLessThan(40);
    });

    it('should calculate high risk for destructive operations', () => {
      const factors = {
        commandType: 'shell_cmd',
        command: 'rm -rf /important/data',
        isDestructive: true,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false
      };

      const risk = analyzeRiskLevel(factors);

      expect(risk.level).toBe('high');
      expect(risk.score).toBeGreaterThanOrEqual(70);
    });

    it('should detect rm -rf pattern', () => {
      const factors = {
        commandType: 'shell_cmd',
        command: 'rm -rf /tmp/data',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false
      };

      const risk = analyzeRiskLevel(factors);

      expect(risk.score).toBeGreaterThanOrEqual(80); // base 50 + 30 for pattern
      expect(risk.level).toBe('high');
    });

    it('should detect dd command', () => {
      const factors = {
        commandType: 'shell_cmd',
        command: 'dd if=/dev/zero of=/dev/sda',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false
      };

      const risk = analyzeRiskLevel(factors);

      expect(risk.level).toBe('high');
      expect(risk.score).toBeGreaterThanOrEqual(80);
    });

    it('should detect chmod 777', () => {
      const factors = {
        commandType: 'shell_cmd',
        command: 'chmod 777 /etc/config',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false
      };

      const risk = analyzeRiskLevel(factors);

      expect(risk.score).toBeGreaterThanOrEqual(80);
    });

    it('should detect eval command', () => {
      const factors = {
        commandType: 'shell_cmd',
        command: 'eval $USER_INPUT',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false
      };

      const risk = analyzeRiskLevel(factors);

      expect(risk.level).toBe('high');
    });

    it('should calculate high risk for system modifications with system_config', () => {
      const factors = {
        commandType: 'system_config',
        isDestructive: false,
        modifiesSystem: true,
        requiresNetwork: false,
        modifiesGit: false
      };

      const risk = analyzeRiskLevel(factors);

      // system_config (80) + modifiesSystem (20) = 100, which is >= 70 = 'high'
      expect(risk.level).toBe('high');
      expect(risk.score).toBeGreaterThanOrEqual(70);
    });

    it('should add risk for network operations', () => {
      const factors = {
        commandType: 'docker_operation',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: true,
        modifiesGit: false
      };

      const risk = analyzeRiskLevel(factors);

      expect(risk.score).toBeGreaterThan(50); // base 50 + 15 for network
    });

    it('should limit score to 100', () => {
      const factors = {
        commandType: 'shell_cmd',
        command: 'rm -rf /',
        isDestructive: true,
        modifiesSystem: true,
        requiresNetwork: true,
        modifiesGit: true,
        fileCount: 100
      };

      const risk = analyzeRiskLevel(factors);

      expect(risk.score).toBeLessThanOrEqual(100);
    });

    it('should add risk for multiple files', () => {
      const factors = {
        commandType: 'file_delete',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
        fileCount: 20
      };

      const risk = analyzeRiskLevel(factors);

      expect(risk.score).toBeGreaterThan(70); // base 70 + 20 for fileCount
    });
  });

  describe('generateRiskDisclosure', () => {
    it('should generate disclosure for shell command', () => {
      const factors = {
        commandType: 'shell_cmd',
        command: 'ls -la',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false
      };

      const disclosure = generateRiskDisclosure(factors);

      expect(disclosure).toHaveProperty('riskLevel');
      expect(disclosure).toHaveProperty('factors');
      expect(disclosure).toHaveProperty('description');
      expect(disclosure).toHaveProperty('potentialIssues');
      expect(disclosure).toHaveProperty('recommendedActions');
      expect(disclosure).toHaveProperty('requireConfirmation');
      expect(disclosure.description).toContain('即将执行命令行操作');
    });

    it('should generate disclosure for file write', () => {
      const factors = {
        commandType: 'file_write',
        fileCount: 5,
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false
      };

      const disclosure = generateRiskDisclosure(factors);

      expect(disclosure.description).toContain('即将写入5个文件');
    });

    it('should generate disclosure for file delete', () => {
      const factors = {
        commandType: 'file_delete',
        fileCount: 1,
        isDestructive: true,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false
      };

      const disclosure = generateRiskDisclosure(factors);

      expect(disclosure.description).toContain('即将删除1个文件');
      expect(disclosure.potentialIssues).toContain('数据可能无法恢复');
      expect(disclosure.recommendedActions).toContain('备份重要数据');
    });

    it('should require confirmation for high risk', () => {
      const factors = {
        commandType: 'shell_cmd',
        command: 'rm -rf /important',
        isDestructive: true,
        modifiesSystem: true,
        requiresNetwork: false,
        modifiesGit: false
      };

      const disclosure = generateRiskDisclosure(factors);

      expect(disclosure.riskLevel.level).toBe('high');
      expect(disclosure.requireConfirmation).toBe(true);
      expect(disclosure.checkpoint).toBeDefined();
      expect(disclosure.checkpoint).toContain('Checkpoint');
    });

    it('should not require confirmation for low risk', () => {
      const factors = {
        commandType: 'file_read',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false
      };

      const disclosure = generateRiskDisclosure(factors);

      expect(disclosure.riskLevel.level).toBe('low');
      expect(disclosure.requireConfirmation).toBe(false);
      expect(disclosure.checkpoint).toBeUndefined();
    });

    it('should include potential issues for destructive operations', () => {
      const factors = {
        commandType: 'shell_cmd',
        command: 'rm -rf /data',
        isDestructive: true,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false
      };

      const disclosure = generateRiskDisclosure(factors);

      expect(disclosure.potentialIssues.length).toBeGreaterThan(0);
      expect(disclosure.potentialIssues).toContain('数据可能无法恢复');
      expect(disclosure.potentialIssues).toContain('重要文件可能被永久删除');
    });

    it('should include potential issues for system modifications', () => {
      const factors = {
        commandType: 'system_config',
        isDestructive: false,
        modifiesSystem: true,
        requiresNetwork: false,
        modifiesGit: false
      };

      const disclosure = generateRiskDisclosure(factors);

      expect(disclosure.potentialIssues).toContain('系统配置可能被修改');
      expect(disclosure.potentialIssues).toContain('可能影响其他应用程序');
    });

    it('should include recommended actions for destructive operations', () => {
      const factors = {
        commandType: 'file_delete',
        isDestructive: true,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false
      };

      const disclosure = generateRiskDisclosure(factors);

      expect(disclosure.recommendedActions.length).toBeGreaterThan(0);
      expect(disclosure.recommendedActions).toContain('备份重要数据');
      expect(disclosure.recommendedActions).toContain('确认删除列表');
    });

    it('should include checkpoint for high risk operations', () => {
      const factors = {
        commandType: 'file_delete',
        isDestructive: true,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false
      };

      const disclosure = generateRiskDisclosure(factors);

      expect(disclosure.checkpoint).toBeDefined();
      expect(disclosure.checkpoint).toContain('Checkpoint');
      expect(disclosure.checkpoint).toContain('已确认重要数据已备份'); // destructive operations trigger backup checkpoint
    });
  });

  describe('formatRiskDisclosureCLI', () => {
    it('should format low risk disclosure', () => {
      const disclosure = {
        riskLevel: { level: 'low', score: 25 },
        factors: {
          commandType: 'file_read',
          isDestructive: false,
          modifiesSystem: false,
          requiresNetwork: false,
          modifiesGit: false
        },
        description: 'File read operation with low risk',
        potentialIssues: [],
        recommendedActions: [],
        requireConfirmation: false
      };

      const formatted = formatRiskDisclosureCLI(disclosure);

      expect(formatted).toContain('🟢');
      expect(formatted).toContain('低风险');
      expect(formatted).toContain('风险等级');
      expect(formatted).toContain('操作描述');
    });

    it('should format medium risk disclosure', () => {
      const disclosure = {
        riskLevel: { level: 'medium', score: 55 },
        factors: {
          commandType: 'file_write',
          isDestructive: false,
          modifiesSystem: false,
          requiresNetwork: false,
          modifiesGit: false
        },
        description: 'File write operation with medium risk',
        potentialIssues: [],
        recommendedActions: [],
        requireConfirmation: false
      };

      const formatted = formatRiskDisclosureCLI(disclosure);

      expect(formatted).toContain('🟡');
      expect(formatted).toContain('中风险');
      expect(formatted).toContain('(55/100)');
    });

    it('should format high risk disclosure', () => {
      const disclosure = {
        riskLevel: { level: 'high', score: 85 },
        factors: {
          commandType: 'shell_cmd',
          command: 'rm -rf /data',
          isDestructive: true,
          modifiesSystem: true,
          requiresNetwork: false,
          modifiesGit: false
        },
        description: 'High risk shell command',
        potentialIssues: ['Data loss', 'System instability'],
        recommendedActions: ['Backup data', 'Verify command'],
        requireConfirmation: true,
        checkpoint: 'Checkpoint [2026-01-24]\n- Confirmed risk'
      };

      const formatted = formatRiskDisclosureCLI(disclosure);

      expect(formatted).toContain('🔴');
      expect(formatted).toContain('高风险');
      expect(formatted).toContain('(85/100)');
      expect(formatted).toContain('⚠️  潜在问题');
      expect(formatted).toContain('💡 推荐行动');
      expect(formatted).toContain('📍 操作前检查点');
      expect(formatted).toContain('🔐 需要确认');
      expect(formatted).toContain('[y] 继续执行');
      expect(formatted).toContain('[n] 取消操作');
    });

    it('should list potential issues', () => {
      const disclosure = {
        riskLevel: { level: 'high', score: 90 },
        factors: {
          commandType: 'file_delete',
          isDestructive: true,
          modifiesSystem: false,
          requiresNetwork: false,
          modifiesGit: false
        },
        description: 'High risk deletion',
        potentialIssues: [
          'Data cannot be recovered',
          'Important files may be deleted'
        ],
        recommendedActions: [],
        requireConfirmation: true
      };

      const formatted = formatRiskDisclosureCLI(disclosure);

      disclosure.potentialIssues.forEach(issue => {
        expect(formatted).toContain(issue);
      });
    });

    it('should list recommended actions', () => {
      const disclosure = {
        riskLevel: { level: 'high', score: 90 },
        factors: {
          commandType: 'file_delete',
          isDestructive: true,
          modifiesSystem: false,
          requiresNetwork: false,
          modifiesGit: false
        },
        description: 'High risk deletion',
        potentialIssues: [],
        recommendedActions: [
          'Backup important data',
          'Verify deletion list',
          'Use --dry-run to test'
        ],
        requireConfirmation: true
      };

      const formatted = formatRiskDisclosureCLI(disclosure);

      disclosure.recommendedActions.forEach(action => {
        expect(formatted).toContain(action);
      });
    });

    it('should include checkpoint when available', () => {
      const disclosure = {
        riskLevel: { level: 'high', score: 85 },
        factors: {
          commandType: 'shell_cmd',
          isDestructive: true,
          modifiesSystem: false,
          requiresNetwork: false,
          modifiesGit: false
        },
        description: 'High risk operation',
        potentialIssues: [],
        recommendedActions: [],
        requireConfirmation: true,
        checkpoint: 'Checkpoint [2026-01-24T10:00:00.000Z]\n- Confirmed operation risk'
      };

      const formatted = formatRiskDisclosureCLI(disclosure);

      expect(formatted).toContain('📍 操作前检查点');
      expect(formatted).toContain(disclosure.checkpoint);
    });

    it('should format border separator', () => {
      const disclosure = {
        riskLevel: { level: 'low', score: 25 },
        factors: {
          commandType: 'file_read',
          isDestructive: false,
          modifiesSystem: false,
          requiresNetwork: false,
          modifiesGit: false
        },
        description: 'Low risk operation',
        potentialIssues: [],
        recommendedActions: [],
        requireConfirmation: false
      };

      const formatted = formatRiskDisclosureCLI(disclosure);

      expect(formatted).toContain('='.repeat(60));
    });
  });

  describe('extractRiskFactorsFromThought', () => {
    it('should extract default factors', () => {
      // This is a placeholder test for the current implementation
      const thought = 'I will execute a command';
      const factors = require('../../../src/agent/riskDisclosure').extractRiskFactorsFromThought(thought);

      expect(factors).toHaveProperty('commandType');
      expect(factors).toHaveProperty('isDestructive');
      expect(factors).toHaveProperty('modifiesSystem');
      expect(factors).toHaveProperty('requiresNetwork');
      expect(factors).toHaveProperty('modifiesGit');
    });
  });
});
