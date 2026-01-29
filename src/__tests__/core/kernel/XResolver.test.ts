/**
 * X-Resolver 跨文件依赖探测测试
 *
 * 验证 X-Resolver 的跨文件符号发现能力
 */

import { XResolver } from '../../../core/kernel/XResolver';
import { EnhancedASTParser } from '../../../core/kernel/ASTParser';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('X-Resolver 跨文件依赖探测测试', () => {
  const testWorkspace = path.join(__dirname, 'temp_workspace');
  let resolver: XResolver;

  beforeAll(async () => {
    await fs.mkdir(testWorkspace, { recursive: true });
    resolver = new XResolver();

    const providerCode = `
/**
 * 计算总价（含税）
 * @param {number} price 商品价格
 * @param {number} tax 税率（如 0.05 表示 5%）
 * @returns {number} 含税总价
 */
export function calculateTotal(price: number, tax: number): number {
  return price * (1 + tax);
}

/**
 * 版本号常量
 */
export const VERSION = '1.0.0';

/**
 * 商品接口
 */
export interface Product {
  name: string;
  price: number;
}
`;

    const consumerCode = `
import { calculateTotal } from './Provider';
import { Product } from './Provider';

/**
 * 结账函数
 */
function checkout(product: Product) {
  console.log("Starting checkout...");
  const total = calculateTotal(product.price, 0.05);
  return total;
}

export { checkout };
`;

    await fs.writeFile(path.join(testWorkspace, 'Provider.ts'), providerCode);
    await fs.writeFile(path.join(testWorkspace, 'Consumer.ts'), consumerCode);
  });

  afterAll(async () => {
    await fs.rm(testWorkspace, { recursive: true, force: true });
  });

  describe('AST Parser 符号提取', () => {
    it('应该能精准提取 Provider.ts 导出的符号', async () => {
      const parser = new EnhancedASTParser();
      const result = await parser.parseFile(path.join(testWorkspace, 'Provider.ts'));

      expect(result.success).toBe(true);
      expect(result.symbols.length).toBeGreaterThan(0);

      const calcTotal = result.symbols.find(s => s.name === 'calculateTotal');
      expect(calcTotal).toBeDefined();
      expect(calcTotal?.kind).toBe('Function');
      expect(calcTotal?.isExported).toBe(true);
      expect(calcTotal?.jsDoc).toContain('@param');
      expect(calcTotal?.jsDoc).toContain('商品价格');
      expect(calcTotal?.jsDoc).toContain('税率');
      expect(calcTotal?.jsDoc).toContain('returns');
    });

    it('应该提取接口类型符号', async () => {
      const parser = new EnhancedASTParser();
      const result = await parser.parseFile(path.join(testWorkspace, 'Provider.ts'));

      const productInterface = result.symbols.find(s => s.name === 'Product');
      expect(productInterface).toBeDefined();
      expect(productInterface?.kind).toBe('Interface');
      expect(productInterface?.isExported).toBe(true);
    });

    it('应该提取常量符号', async () => {
      const parser = new EnhancedASTParser();
      const result = await parser.parseFile(path.join(testWorkspace, 'Provider.ts'));

      const version = result.symbols.find(s => s.name === 'VERSION');
      expect(version).toBeDefined();
      expect(version?.kind).toBe('Variable');
      expect(version?.isExported).toBe(true);
    });
  });

  describe('X-Resolver 跨文件分析', () => {
    it('应该能发现 Consumer.ts 引用了 Provider.ts', async () => {
      const result = await resolver.getImpactAnalysis(path.join(testWorkspace, 'Provider.ts'));

      expect(result.exportedSymbols.length).toBe(3);
      expect(result.impacts.length).toBeGreaterThan(0);

      const consumerImpact = result.impacts.find(i =>
        i.filePath.includes('Consumer.ts')
      );

      expect(consumerImpact).toBeDefined();
      expect(consumerImpact?.symbols).toContain('calculateTotal');
      expect(consumerImpact?.symbols).toContain('Product');
    });

    it('应该只切取包含符号调用的相关代码块', async () => {
      const result = await resolver.getImpactAnalysis(path.join(testWorkspace, 'Provider.ts'));

      const consumerImpact = result.impacts.find(i =>
        i.filePath.includes('Consumer.ts')
      );

      expect(consumerImpact?.snippet).toContain('calculateTotal(product.price, 0.05)');
      expect(consumerImpact?.snippet).toContain('import { calculateTotal }');
    });

    it('应该包含导出符号的 JSDoc', async () => {
      const result = await resolver.getImpactAnalysis(path.join(testWorkspace, 'Provider.ts'));

      const consumerImpact = result.impacts.find(i =>
        i.filePath.includes('Consumer.ts')
      );

      expect(consumerImpact?.jsDoc).toBeDefined();
      expect(consumerImpact?.jsDoc).toContain('calculateTotal');
      expect(consumerImpact?.jsDoc).toContain('@param');
      expect(consumerImpact?.jsDoc).toContain('商品价格');
      expect(consumerImpact?.jsDoc).toContain('税率');
    });

    it('应该返回完整的分析结果', async () => {
      const result = await resolver.getImpactAnalysis(path.join(testWorkspace, 'Provider.ts'));

      expect(result).toHaveProperty('targetFile');
      expect(result).toHaveProperty('exportedSymbols');
      expect(result).toHaveProperty('impacts');
      expect(result).toHaveProperty('duration');
      expect(typeof result.duration).toBe('number');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('AI 上下文渲染', () => {
    it('应该渲染为 AI 友好的格式', async () => {
      const result = await resolver.getImpactAnalysis(path.join(testWorkspace, 'Provider.ts'));
      const context = resolver.renderAsAIContext(result);

      expect(context).toContain('X-RESOLVER: CROSS-FILE DEPENDENCY CONTEXT');
      expect(context).toContain('[EXPORTED SYMBOLS]');
      expect(context).toContain('[AFFECTED FILES]');
      expect(context).toContain('EXTERNAL DEPENDENCY REFERENCE');
      expect(context).toContain('READ-ONLY');
      expect(context).toContain('USAGE SNIPPET');
    });

    it('应该包含导出符号列表', async () => {
      const result = await resolver.getImpactAnalysis(path.join(testWorkspace, 'Provider.ts'));
      const context = resolver.renderAsAIContext(result);

      expect(context).toContain('calculateTotal');
      expect(context).toContain('VERSION');
      expect(context).toContain('Product');
    });

    it('应该包含受影响文件的路径', async () => {
      const result = await resolver.getImpactAnalysis(path.join(testWorkspace, 'Provider.ts'));
      const context = resolver.renderAsAIContext(result);

      expect(context).toContain('Consumer.ts');
    });

    it('应该包含 JSDoc 文档', async () => {
      const result = await resolver.getImpactAnalysis(path.join(testWorkspace, 'Provider.ts'));
      const context = resolver.renderAsAIContext(result);

      expect(context).toContain('SYMBOL CONTRACT');
      expect(context).toContain('@param');
      expect(context).toContain('商品价格');
      expect(context).toContain('税率');
    });
  });

  describe('错误处理', () => {
    it('应该正确处理不存在的文件', async () => {
      const result = await resolver.getImpactAnalysis('/nonexistent/file.ts');

      expect(result.exportedSymbols).toHaveLength(0);
      expect(result.impacts).toHaveLength(0);
    });

    it('应该正确处理没有导出的文件', async () => {
      const noExportFile = path.join(testWorkspace, 'NoExport.ts');
      await fs.writeFile(noExportFile, 'const x = 42;');

      const result = await resolver.getImpactAnalysis(noExportFile);

      expect(result.exportedSymbols).toHaveLength(0);
      expect(result.impacts).toHaveLength(0);
    });
  });
});
