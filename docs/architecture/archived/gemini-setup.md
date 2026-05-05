# Gemini 适配器配置指南

## ✅ 修复完成

Gemini 适配器已经修复完成！现在可以正确识别和使用 Gemini CLI。

## 📋 问题分析

### 原来的问题
1. **错误的命令**: 代码使用了 `gcloud ai models generate-content`，这个命令不存在
2. **工具识别错误**: 您安装的是 **Gemini CLI** (npm 包)，而不是 gcloud 工具

### 已修复的内容
1. ✅ 更新为使用正确的 `gemini` 命令
2. ✅ 修复命令参数: `--model`, `--prompt`, `--output-format json`
3. ✅ 改进健康检查：检测 API key 配置
4. ✅ 改进错误处理：提供清晰的错误信息
5. ✅ 更新 JSON 输出解析逻辑

## 🚀 配置步骤

### 1. 获取 Gemini API Key

访问: https://aistudio.google.com/apikey

点击 "Create API Key" 创建新的 API key

### 2. 配置环境变量

有两种方式配置：

#### 方式 A: 使用 .env 文件（推荐）

在项目根目录创建 `.env` 文件：

```bash
GEMINI_API_KEY=your_api_key_here
```

#### 方式 B: 设置系统环境变量

**macOS/Linux (zsh/bash):**

在 `~/.zshrc` 或 `~/.bashrc` 中添加：

```bash
export GEMINI_API_KEY="your_api_key_here"
```

然后重新加载配置：
```bash
source ~/.zshrc  # 或 source ~/.bashrc
```

**Windows:**

```cmd
setx GEMINI_API_KEY "your_api_key_here"
```

### 3. 验证配置

运行测试脚本验证：

```bash
node test-gemini-adapter.js
```

或手动测试 Gemini CLI：

```bash
gemini "Hello, can you respond?"
```

## 📊 测试结果

运行测试脚本后，您应该看到：

- ✅ 健康检查通过
- ✅ 执行任务成功
- ✅ 显示适配器能力

## 🔧 适配器能力

- **支持的任务类型**: 代码生成、代码审查、对话、翻译、摘要、分析、调试、通用
- **最大上下文窗口**: 1,000,000 tokens
- **成本等级**: 2 (中等)
- **支持流式输出**: ✅
- **特殊能力**: 长文本、多模态

## 🛠️ 使用示例

### 在代码中使用

```typescript
import { GoogleAdapter } from './dist/core/modelRouter/adapters/GoogleAdapter';
import { TaskType } from './dist/core/modelRouter/types';

const adapter = new GoogleAdapter();

// 检查是否可用
const isAvailable = await adapter.healthCheck();

if (isAvailable) {
  // 执行任务
  const result = await adapter.execute(
    '用 TypeScript 写一个快速排序函数',
    {
      type: TaskType.CODE_GENERATION,
      description: '生成排序函数',
    }
  );
  
  console.log(result.content);
}
```

### 通过路由器使用

```typescript
import { executeTask, TaskType } from './dist/core/modelRouter';

const result = await executeTask(
  '解释什么是闭包',
  {
    type: TaskType.CONVERSATION,
    description: '技术解释',
  }
);

console.log(result.content);
```

## ⚠️ 常见问题

### 1. "GEMINI_API_KEY environment variable" 错误

**原因**: 未配置 API key

**解决**: 按照上面的步骤配置环境变量

### 2. 命令超时

**原因**: 网络连接问题或 prompt 太长

**解决**: 
- 检查网络连接
- 减少 prompt 长度
- 增加超时时间

### 3. "command not found: gemini"

**原因**: Gemini CLI 未安装

**解决**: 
```bash
npm install -g @google/generative-ai-cli
```

## 📝 相关文件

- `src/core/modelRouter/adapters/GoogleAdapter.ts` - 适配器实现
- `test-gemini-adapter.js` - 测试脚本
- `dist/core/modelRouter/adapters/GoogleAdapter.js` - 编译后的代码

## 🎉 完成！

配置完成后，Gemini 适配器就可以正常工作了！
