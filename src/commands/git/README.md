# Git 命令模块

本目录包含 Git 相关命令的实现。

## 文件结构

### 命令文件
- `auto.ts` - 自动化 Git 工作流
- `branch.ts` - 分支管理命令
- `commit.ts` - 提交相关命令
- `exec.ts` - 执行 Git 命令
- `plan.ts` - AI 驱动的开发规划
- `review.ts` - AI 代码审查
- `status.ts` - Git 状态查看

### 共享模块
- `constants.ts` - 常量配置
  - Diff 行数估算配置
  - 安全扫描配置
  - 能力等级显示映射
  
- `utils.ts` - 工具函数
  - `cleanLLMOutput()` - 清理 LLM 输出
  - `deduplicateFiles()` - 文件去重
  - `getCapabilityLevelDisplay()` - 能力等级显示
  
- `errors.ts` - 自定义错误类型
  - `GitError` - 基础 Git 错误
  - `NoChangesFoundError` - 未找到变更
  - `CommitNotFoundError` - Commit 不存在
  - `NoReviewContentError` - 无审查内容

## 设计原则

1. **关注点分离**: 命令逻辑、配置、工具函数、错误处理分离
2. **可维护性**: 常量集中管理，避免魔法数字
3. **可复用性**: 提取通用逻辑为工具函数
4. **类型安全**: 使用 TypeScript 和自定义错误类型
5. **可测试性**: 函数职责单一，易于测试

## 使用示例

### 使用常量
```typescript
import { DIFF_ESTIMATION, SECURITY_SCAN } from './constants';

const estimatedLines = fileCount * DIFF_ESTIMATION.LINES_PER_FILE_DEFAULT;
const limit = pLimit(SECURITY_SCAN.MAX_CONCURRENT);
```

### 使用工具函数
```typescript
import { cleanLLMOutput, deduplicateFiles, getCapabilityLevelDisplay } from './utils';

const cleaned = cleanLLMOutput(rawOutput);
const uniqueFiles = deduplicateFiles([...staged, ...unstaged]);
const displayName = getCapabilityLevelDisplay(level);
```

### 使用自定义错误
```typescript
import { NoChangesFoundError, isNoChangesFoundError } from './errors';

try {
  // ... 代码
} catch (error) {
  if (isNoChangesFoundError(error)) {
    console.log('未找到变更');
  }
}
```

## 最近更新

- 2026-01-28: 根据代码审查结论进行系统性优化
  - 创建 `constants.ts` 集中管理配置
  - 创建 `utils.ts` 提取通用逻辑
  - 创建 `errors.ts` 实现类型安全的错误处理
  - 优化 `plan.ts` 和 `review.ts`，降低复杂度
