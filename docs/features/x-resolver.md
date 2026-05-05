# X-Resolver: Cross-File Symbol Dependency Resolver

yuangs 的全域感知核心 - 跨文件符号依赖解析系统

## 概述

X-Resolver 为 yuangs Agent 提供**跨文件依赖感知能力**。当 Agent 准备修改某个文件时，X-Resolver 能够自动发现所有受影响的依赖文件，并提供完整的上下文信息。

## 核心功能

### 1. 符号提取（ASTParser）

使用 TypeScript Compiler API 精确提取导出符号及其 JSDoc：

- **导出符号类型**：函数、类、接口、类型别名、枚举、常量
- **JSDoc 解析**：提取注释、`@param`、`@returns`、`@throws` 等标签
- **行号定位**：精确记录每个符号的起始行号

### 2. 快速扫描（FastScanner）

极速定位引用文件：

- **ripgrep 优先**：毫秒级扫描速度
- **原生回退**：无 ripgrep 时自动降级到文件系统遍历
- **智能过滤**：自动排除 `node_modules`、`.git` 等无关目录

### 3. 跨文件分析（XResolver）

构建完整的依赖拓扑：

- **影响域评估**：发现所有引用目标符号的文件
- **智能切片**：仅提取包含相关调用的代码片段（而非整个文件）
- **语义感知**：包含符号的 JSDoc 文档，帮助 AI 理解契约

### 4. 原子事务（AtomicTransactionManager）

确保多文件修改的原子性：

- **全量快照**：为事务中的所有文件创建备份
- **原子提交**：要么全部成功，要么全部回滚
- **安全回退**：失败时自动恢复到修改前状态

### 5. 后验证（PostCheckVerifier）

强制编译检查：

- **TypeScript 检查**：自动运行 `tsc --noEmit`
- **自定义验证**：支持用户配置的检查命令
- **错误提取**：结构化错误信息，便于 AI 理解和修复

## 快速开始

### 基本使用

```typescript
import { XResolver } from './src/core/kernel/XResolver';

const resolver = new XResolver();

// 分析文件的跨文件影响
const result = await resolver.getImpactAnalysis('src/models/User.ts');

console.log(`发现了 ${result.impacts.length} 个受影响文件`);
console.log(`导出了 ${result.exportedSymbols.length} 个符号`);
```

### 渲染 AI 上下文

```typescript
// 渲染为 AI 友好的格式
const context = resolver.renderAsAIContext(result);

console.log(context);

// 输出示例：
// ===========================================================
// X-RESOLVER: CROSS-FILE DEPENDENCY CONTEXT
// Target: src/models/User.ts
// Exported Symbols: 3
// Affected Files: 5
// Analysis Time: 12ms
// ===========================================================
// ...
```

## 完整工作流示例

### 场景：修改 User 类的构造函数

```typescript
import { XResolver } from './src/core/kernel/XResolver';
import { AtomicTransactionManager } from './src/core/kernel/AtomicTransactionManager';
import { PostCheckVerifier } from './src/core/kernel/PostCheckVerifier';

// 1. 分析影响域
const xResolver = new XResolver();
const impact = await xResolver.getImpactAnalysis('src/models/User.ts');

// 2. 开启原子事务
const transactionManager = new AtomicTransactionManager();
const transactionId = await transactionManager.startBatch(
  'refactor User constructor',
  ['src/models/User.ts', ...impact.impacts.map(i => i.filePath)]
);

// 3. AI 根据影响域生成修改计划
const context = xResolver.renderAsAIContext(impact);
console.log('AI Context:\n', context);

// 4. Agent 执行修改（省略具体代码）
// ...

// 5. 后验证检查
const verifier = new PostCheckVerifier();
const checkResult = await verifier.verifyAll();

if (checkResult.passed) {
  // 6. 提交事务
  await transactionManager.commitBatch(transactionId);
  console.log('✅ 修改成功并已提交');
} else {
  // 7. 回滚事务
  console.error('❌ 验证失败，正在回滚...');
  console.error(verifier.formatErrorForAI(checkResult));
  await transactionManager.abortBatch(transactionId);
}
```

## API 文档

### XResolver

```typescript
class XResolver {
  constructor(astParser?: EnhancedASTParser, scanner?: FastScanner)

  async getImpactAnalysis(targetFilePath: string): Promise<XResolverResult>
  async getExportedSymbols(filePath: string): Promise<SymbolMetadata[]>
  renderAsAIContext(result: XResolverResult): string
}
```

### AtomicTransactionManager

```typescript
class AtomicTransactionManager {
  constructor(snapshotBaseDir?: string)

  async startBatch(taskName: string, files: string[]): Promise<string>
  async commitBatch(transactionId: string): Promise<CommitResult>
  async abortBatch(transactionId: string): Promise<void>
  getTransactionState(transactionId: string): TransactionState | null
}
```

### PostCheckVerifier

```typescript
class PostCheckVerifier {
  constructor(config?: Partial<VerifierConfig>)

  async verifyTypeCheck(): Promise<VerificationResult>
  async verifyCustomCheck(): Promise<VerificationResult>
  async verifyAll(): Promise<VerificationResult>
  formatErrorForAI(result: VerificationResult): string
  extractErrorLocations(result: VerificationResult): ErrorLocation[]
}
```

## 测试

运行测试套件：

```bash
npm test -- src/__tests__/core/kernel/XResolver.test.ts
```

测试覆盖：
- ✅ 符号提取（函数、类、接口、类型、常量）
- ✅ JSDoc 解析（@param、@returns、@throws）
- ✅ 跨文件引用发现
- ✅ 智能代码切片
- ✅ AI 上下文渲染
- ✅ 错误处理

## 设计原则

1. **零污染**：验证失败时自动回滚，绝不破坏源码
2. **Token 降噪**：仅提取相关代码片段，避免 Agent 被大文件淹没
3. **类型安全**：使用 TypeScript Compiler API，100% 准确
4. **性能优先**：ripgrep 优先，毫秒级扫描
5. **语义感知**：解析 JSDoc，让 AI 理解开发者契约

## 下一步

集成到 yuangs Agent 运行时，实现完整的跨文件重构能力：

```typescript
// 在 DualAgentRuntime 中集成
async prepareContext(task: Task) {
  for (const file of task.targetFiles) {
    // 挂载主文件
    await this.contextManager.mount('file', file);

    // 自动探索影响域
    const impacts = await this.xResolver.getImpactAnalysis(file);

    // 将依赖文件挂载为只读上下文
    for (const impact of impacts) {
      await this.contextManager.mountReadOnly(
        impact.filePath,
        this.xResolver.renderAsAIContext({ ...impact })
      );
    }
  }
}
```

---

**让 Agent 看得更广，改得更准。**
