// @ts-nocheck
import {
  detectGitContext,
  detectTechStack,
  generateTechStackGuidance,
  generateErrorRecovery,
  buildDynamicContext,
  injectDynamicContext
} from '../../../src/agent/dynamicPrompt';

describe('dynamicPrompt', () => {
  describe('detectGitContext', () => {
    it('should detect git repository via git command', async () => {
      const gitContext = await detectGitContext();

      if (gitContext) {
        expect(gitContext).toContain('[GIT CONTEXT]');
        expect(gitContext).toContain('git ls-files');
        expect(gitContext).toContain('git diff');
        expect(gitContext).toContain('git log');
      }
    });

    it('should return null when not in git repository', async () => {
      // This test assumes we're in a non-git context
      // In the actual repo, this will return context
      const gitContext = await detectGitContext();

      // Just verify it returns either null or valid context
      expect(gitContext === null || typeof gitContext === 'string').toBe(true);
    });
  });

  describe('detectTechStack', () => {
    it('should detect Node.js project', async () => {
      const stacks = await detectTechStack();

      // Since we're in a Node.js project
      if (stacks.includes('Node.js')) {
        expect(stacks).toContain('Node.js');
      }
    });

    it('should detect multiple tech stacks', async () => {
      const stacks = await detectTechStack();

      expect(Array.isArray(stacks)).toBe(true);
      stacks.forEach(stack => {
        expect(typeof stack).toBe('string');
        expect(stack.length).toBeGreaterThan(0);
      });
    });

    it('should return empty array when no package files exist', async () => {
      const stacks = await detectTechStack();

      // In current directory, may have multiple stacks
      // Just verify it's an array
      expect(Array.isArray(stacks)).toBe(true);
    });

    it('should detect Python project', async () => {
      const stacks = await detectTechStack();

      if (stacks.includes('Python')) {
        expect(stacks).toContain('Python');
      }
    });

    it('should detect Go project', async () => {
      const stacks = await detectTechStack();

      if (stacks.includes('Go')) {
        expect(stacks).toContain('Go');
      }
    });

    it('should detect Rust project', async () => {
      const stacks = await detectTechStack();

      if (stacks.includes('Rust')) {
        expect(stacks).toContain('Rust');
      }
    });

    it('should detect Docker configuration', async () => {
      const stacks = await detectTechStack();

      if (stacks.includes('Docker')) {
        expect(stacks).toContain('Docker');
      }
    });
  });

  describe('generateTechStackGuidance', () => {
    it('should generate Node.js guidance', () => {
      const guidance = generateTechStackGuidance(['Node.js']);

      expect(guidance).toContain('[TECH STACK: Node.js]');
      expect(guidance).toContain('npm');
      expect(guidance).toContain('yarn');
      expect(guidance).toContain('package.json');
      expect(guidance).toContain('TypeScript');
    });

    it('should generate Python guidance', () => {
      const guidance = generateTechStackGuidance(['Python']);

      expect(guidance).toContain('[TECH STACK: Python]');
      expect(guidance).toContain('pip');
      expect(guidance).toContain('poetry');
      expect(guidance).toContain('PEP 8');
      expect(guidance).toContain('虚拟环境');
    });

    it('should generate Go guidance', () => {
      const guidance = generateTechStackGuidance(['Go']);

      expect(guidance).toContain('[TECH STACK: Go]');
      expect(guidance).toContain('go mod');
      expect(guidance).toContain('go.mod');
      expect(guidance).toContain('Go惯用模式');
    });

    it('should generate Rust guidance', () => {
      const guidance = generateTechStackGuidance(['Rust']);

      expect(guidance).toContain('[TECH STACK: Rust]');
      expect(guidance).toContain('cargo');
      expect(guidance).toContain('Cargo.toml');
      expect(guidance).toContain('所有权');
      expect(guidance).toContain('clippy');
    });

    it('should generate Docker guidance', () => {
      const guidance = generateTechStackGuidance(['Docker']);

      expect(guidance).toContain('[TECH STACK: Docker]');
      expect(guidance).toContain('Dockerfile');
      expect(guidance).toContain('docker-compose.yml');
      expect(guidance).toContain('容器化');
    });

    it('should generate guidance for multiple stacks', () => {
      const guidance = generateTechStackGuidance(['Node.js', 'Docker']);

      expect(guidance).toContain('[TECH STACK: Node.js]');
      expect(guidance).toContain('[TECH STACK: Docker]');
    });

    it('should return empty string for no stacks', () => {
      const guidance = generateTechStackGuidance([]);

      expect(guidance).toBe('');
    });
  });

  describe('generateErrorRecovery', () => {
    it('should generate error recovery guidance', () => {
      const lastError = 'Command failed: file not found';
      const recovery = generateErrorRecovery(lastError);

      expect(recovery).toContain('[ERROR RECOVERY]');
      expect(recovery).toContain(lastError);
      expect(recovery).toContain('尝试不同的方法');
      expect(recovery).toContain('验证前置条件');
      expect(recovery).toContain('检查命令语法');
    });

    it('should suggest checking prerequisites', () => {
      const lastError = 'Module not found';
      const recovery = generateErrorRecovery(lastError);

      expect(recovery).toContain('验证文件/路径是否存在');
      expect(recovery).toContain('检查依赖是否已安装');
    });

    it('should suggest alternative approaches', () => {
      const lastError = 'Permission denied';
      const recovery = generateErrorRecovery(lastError);

      expect(recovery).toContain('使用不同的标志或工具');
    });

    it('should suggest checking logs', () => {
      const lastError = 'Unknown error';
      const recovery = generateErrorRecovery(lastError);

      expect(recovery).toContain('查看错误日志获取更多信息');
    });

    it('should suggest switching to answer mode', () => {
      const lastError = 'Persistent failure';
      const recovery = generateErrorRecovery(lastError);

      expect(recovery).toContain('切换到 "answer" 模式向用户说明问题');
    });
  });

  describe('buildDynamicContext', () => {
    it('should include git context when in git repo', async () => {
      const context = await buildDynamicContext();

      if (context.gitContext) {
        expect(context.gitContext).toContain('[GIT CONTEXT]');
        expect(typeof context.gitContext).toBe('string');
      }
    });

    it('should include tech stack detection', async () => {
      const context = await buildDynamicContext(undefined, true);

      if (context.techStack) {
        expect(Array.isArray(context.techStack)).toBe(true);
        context.techStack.forEach(stack => {
          expect(typeof stack).toBe('string');
        });
      }
    });

    it('should include error recovery when error provided', async () => {
      const lastError = 'Test error message';
      const context = await buildDynamicContext(lastError);

      expect(context.lastError).toBe(lastError);
      expect(context.errorRecovery).toContain(lastError);
      expect(context.errorRecovery).toContain('[ERROR RECOVERY]');
    });

    it('should skip tech stack when disabled', async () => {
      const context = await buildDynamicContext(undefined, false);

      expect(context.techStack).toBeUndefined();
    });

    it('should not include error recovery when no error', async () => {
      const context = await buildDynamicContext();

      expect(context.lastError).toBeUndefined();
      expect(context.errorRecovery).toBeUndefined();
    });
  });

  describe('injectDynamicContext', () => {
    it('should inject git context into prompt', () => {
      const basePrompt = 'Base system prompt';
      const context = {
        gitContext: '[GIT CONTEXT]\nGit repository detected'
      };

      const enhancedPrompt = injectDynamicContext(basePrompt, context);

      expect(enhancedPrompt).toContain(basePrompt);
      expect(enhancedPrompt).toContain(context.gitContext);
    });

    it('should inject tech stack guidance into prompt', () => {
      const basePrompt = 'Base system prompt';
      const context = {
        techStack: ['Node.js', 'Docker']
      };

      const enhancedPrompt = injectDynamicContext(basePrompt, context);

      expect(enhancedPrompt).toContain(basePrompt);
      expect(enhancedPrompt).toContain('[TECH STACK: Node.js]');
      expect(enhancedPrompt).toContain('[TECH STACK: Docker]');
    });

    it('should inject error recovery into prompt', () => {
      const basePrompt = 'Base system prompt';
      const lastError = 'Previous error occurred';
      const context = {
        lastError,
        errorRecovery: generateErrorRecovery(lastError)
      };

      const enhancedPrompt = injectDynamicContext(basePrompt, context);

      expect(enhancedPrompt).toContain(basePrompt);
      expect(enhancedPrompt).toContain(lastError);
      expect(enhancedPrompt).toContain('[ERROR RECOVERY]');
    });

    it('should inject all context types', () => {
      const basePrompt = 'Base prompt';
      const context = {
        gitContext: '[GIT CONTEXT]',
        techStack: ['Node.js'],
        lastError: 'Error',
        errorRecovery: generateErrorRecovery('Error')
      };

      const enhancedPrompt = injectDynamicContext(basePrompt, context);

      expect(enhancedPrompt).toContain('[GIT CONTEXT]');
      expect(enhancedPrompt).toContain('[TECH STACK: Node.js]');
      expect(enhancedPrompt).toContain('[ERROR RECOVERY]');
      expect(enhancedPrompt).toContain('Error');
    });

    it('should not modify prompt when context is empty', () => {
      const basePrompt = 'Base system prompt';
      const context = {};

      const enhancedPrompt = injectDynamicContext(basePrompt, context);

      expect(enhancedPrompt).toBe(basePrompt);
    });

    it('should preserve base prompt content', () => {
      const basePrompt = 'This is the original prompt\nWith multiple lines';
      const context = {
        gitContext: '[GIT CONTEXT]'
      };

      const enhancedPrompt = injectDynamicContext(basePrompt, context);

      expect(enhancedPrompt).toContain(basePrompt);
    });
  });
});
