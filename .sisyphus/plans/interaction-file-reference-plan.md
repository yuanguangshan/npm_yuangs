# AI 交互模式文件引用功能实现计划

## 📋 需求概述

在 AI 连续对话模式（交互模式）下添加快捷文件引用功能，提升用户体验：

1. **`@` 符号** - 显示当前目录文件列表，支持选择文件
2. **`#` 符号** - 指定目录，自动读取目录下所有文件的内容

---

## 🎯 功能需求详解

### 功能 1: `@` 符号 - 当前目录文件选择

**交互流程**:

```bash
你：@
📁 当前目录文件列表:
  [1] cli.ts
  [2] package.json
  [3] src/
  [4] test/
  [5] README.md
请选择文件 (输入序号，或按 Enter 返回): 1

你：cli.ts 
```

**实现要点**:
- 检测用户输入仅为 `@` 时触发
- 使用 `fs.readdirSync()` 读取当前目录
- 显示格式化的文件列表，带序号
- 用户输入序号后，将选中的文件名保留在输入提示符中
- 支持按 Enter 返回，不选择任何文件

**功能特性**:
- 显示文件类型图标（目录用 📁，文件用 📄）
- 区分文件和目录
- 支持选择相对路径下的文件

### 功能 2: `#` 符号 - 指定目录内容读取

**使用示例**:

```bash
你：# src 分析这个目录下的代码
# AI 会看到 src 目录下所有文件的内容

你：# src/commands 解释这些命令文件
# AI 会看到 src/commands 目录下所有文件的内容
```

**实现要点**:
- 检测用户输入以 `#` 开头
- 提取 `#` 后面的目录路径和问题
- 递归读取指定目录下的所有文件
- 复用 `fileReader.ts` 中的功能
- 将文件列表和内容传递给 AI

**功能特性**:
- 支持绝对路径和相对路径
- 支持递归读取子目录
- 复用现有的文件内容读取逻辑（5000字符限制）
- 如果目录不存在，显示友好错误提示

---

## 🏗️ 技术设计

### 1. 修改 `src/commands/handleAIChat.ts`

#### 1.1 新增函数：显示文件选择器

```typescript
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

/**
 * 显示当前目录文件列表供用户选择
 * @returns 用户选择的文件名，或 null（用户取消）
 */
async function showFileSelector(rl: readline.Interface): Promise<string | null> {
    try {
        const currentDir = process.cwd();
        const files = fs.readdirSync(currentDir);
        
        if (files.length === 0) {
            console.log(chalk.yellow('当前目录为空\n'));
            return null;
        }

        console.log(chalk.bold.cyan('📁 当前目录文件列表:\n'));
        
        files.forEach((file, index) => {
            const fullPath = path.join(currentDir, file);
            const isDir = fs.statSync(fullPath).isDirectory();
            const icon = isDir ? chalk.cyan('📁') : chalk.green('📄');
            const padding = (index + 1).toString().padStart(2);
            console.log(`  [${padding}] ${icon} ${file}`);
        });
        console.log();

        const choice = await rl.question(chalk.cyan('请选择文件 (输入序号，或按 Enter 返回): '));
        
        if (choice.trim() === '') {
            console.log(chalk.gray('已取消选择\n'));
            return null;
        }

        const index = parseInt(choice) - 1;
        if (isNaN(index) || index < 0 || index >= files.length) {
            console.log(chalk.red('无效的序号\n'));
            return null;
        }

        const selectedFile = files[index];
        console.log(chalk.green(`✓ 已选择: ${selectedFile}\n`));
        return selectedFile;
    } catch (error) {
        console.error(chalk.red(`读取目录失败: ${error}\n`));
        return null;
    }
}
```

#### 1.2 新增函数：处理 `#` 符号

```typescript
import { buildPromptWithFileContent, readFilesContent, parseFilePathsFromLsOutput } from '../core/fileReader';

/**
 * 处理 # 符号：读取指定目录的所有文件内容
 * @param input 用户输入（以 # 开头）
 * @returns 处理后的提示文本
 */
async function handleDirectoryReference(input: string): Promise<string> {
    // 提取 # 后面的内容
    const match = input.match(/^#\s*(.+?)\s*(?:\n(.*))?$/s);
    if (!match) {
        console.log(chalk.yellow('格式错误，正确用法: # 目录路径 [问题]\n'));
        return input;
    }

    const dirPath = match[1].trim();
    const question = match[2] ? match[2].trim() : '请分析这个目录下的文件';

    const fullPath = path.resolve(dirPath);

    // 检查目录是否存在
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
        console.log(chalk.red(`错误: 目录 "${dirPath}" 不存在或不是一个目录\n`));
        return question;
    }

    // 递归读取目录下所有文件
    const spinner = ora(chalk.cyan('正在读取文件...')).start();
    
    try {
        // 使用递归的 find 命令获取所有文件
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        const findCommand = process.platform === 'darwin' || process.platform === 'linux'
            ? `find "${fullPath}" -type f`
            : `dir /s /b "${fullPath}"`; // Windows

        const { stdout } = await execAsync(findCommand);
        const filePaths = stdout.trim().split('\n').filter(f => f);

        spinner.stop();

        if (filePaths.length === 0) {
            console.log(chalk.yellow(`目录 "${dirPath}" 下没有文件\n`));
            return question;
        }

        // 读取文件内容
        const contentMap = readFilesContent(filePaths);
        
        // 构建提示
        const prompt = buildPromptWithFileContent(
            `目录: ${dirPath}\n找到 ${filePaths.length} 个文件`,
            filePaths.map(p => path.relative(process.cwd(), p)),
            contentMap,
            question
        );

        console.log(chalk.green(`✓ 已读取 ${contentMap.size} 个文件\n`));
        return prompt;
    } catch (error) {
        spinner.stop();
        console.error(chalk.red(`读取目录失败: ${error}\n`));
        return question;
    }
}
```

#### 1.3 修改主循环：添加 `@` 和 `#` 处理

```typescript
// 在 while 循环中添加新的处理逻辑
while (true) {
    const input = await ask(chalk.green('你：'));
    const trimmed = input.trim();

    // 处理 @ 符号：显示文件选择器
    if (trimmed === '@') {
        const selectedFile = await showFileSelector(rl);
        if (selectedFile) {
            // 循环重新开始，用户可以继续编辑选中的文件名
            continue;
        }
        continue;
    }

    // 处理 # 符号：读取目录内容
    if (trimmed.startsWith('#')) {
        rl.pause();
        try {
            const processedInput = await handleDirectoryReference(trimmed);
            // 发送处理后的输入给 AI
            await askOnceStream(processedInput, model);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(chalk.red(`\n[处理错误]: ${message}`));
        } finally {
            rl.resume();
        }
        continue;
    }

    // Handle Exit
    if (['exit', 'quit', 'bye'].includes(trimmed.toLowerCase())) {
        console.log(chalk.cyan('👋 再见！'));
        break;
    }

    // Handle Commands
    if (trimmed === '/clear') {
        clearConversationHistory();
        console.log(chalk.yellow('✓ 对话历史已清空\n'));
        continue;
    }

    if (trimmed === '/history') {
        const history = getConversationHistory();
        if (history.length === 0) {
            console.log(chalk.gray('暂无对话历史\n'));
        } else {
            history.forEach((msg) => {
                const prefix = msg.role === 'user' ? chalk.green('你: ') : chalk.blue('AI: ');
                console.log(prefix + msg.content);
            });
        }
        continue;
    }

    if (!trimmed) continue;

    // Handle AI Request
    try {
        rl.pause();
        await askOnceStream(trimmed, model);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`\n[AI execution error]: ${message}`));
    } finally {
        rl.resume();
    }
}
```

---

## 📝 使用示例

### 示例 1: 使用 `@` 选择文件

```bash
$ yuangs ai
🤖 进入 AI 交互模式 (输入 exit 退出)

你：@
📁 当前目录文件列表:

  [ 1] 📁 src
  [ 2] 📄 package.json
  [ 3] 📄 README.md
  [ 4] 📁 test
  [ 5] 📄 tsconfig.json

请选择文件 (输入序号，或按 Enter 返回): 3
✓ 已选择: README.md

你：README.md 解释一下这个项目的功能
# AI 会分析 README.md 的内容
```

### 示例 2: 使用 `#` 读取目录

```bash
$ yuangs ai
🤖 进入 AI 交互模式 (输入 exit 退出)

你：# src/commands 分析这些命令的功能
✓ 已读取 3 个文件

# AI 会看到 src/commands 下所有文件的内容并进行分析
```

### 示例 3: 组合使用

```bash
你：@
# 选择文件
[选择 1] cli.ts

你：cli.ts 有哪些优化建议？
# AI 针对单个文件提供建议

你：# src 如何改进项目结构？
# AI 分析整个 src 目录
```

---

## 🧪 测试计划

### 测试场景

**测试 1: `@` 符号功能**
- [ ] 输入 `@` 显示当前目录文件列表
- [ ] 文件列表显示正确的序号和图标
- [ ] 选择有效序号，文件名正确返回
- [ ] 输入无效序号，显示错误提示
- [ ] 按 Enter 返回，不选择任何文件
- [ ] 空目录时显示提示信息

**测试 2: `#` 符号功能**
- [ ] `# src` 读取目录内容
- [ ] 显示读取的文件数量
- [ ] AI 能看到文件内容并正确分析
- [ ] 目录不存在时显示错误
- [ ] 指定相对路径和绝对路径都能工作

**测试 3: 错误处理**
- [ ] 无权限的目录显示友好错误
- [ ] 大文件自动截断（5000字符限制）
- [ ] 读取失败不中断程序

**测试 4: 组合测试**
- [ ] `@` 选择后可以继续输入问题
- [ ] `#` 后面跟问题正确解析
- [ ] 不使用 `@` 和 `#` 时功能不受影响

---

## 📂 文件变更清单

### 修改文件
1. **`src/commands/handleAIChat.ts`**
   - 新增 `showFileSelector()` 函数
   - 新增 `handleDirectoryReference()` 函数
   - 修改主循环，添加 `@` 和 `#` 处理逻辑
   - 导入 `fileReader` 模块

### 不变文件
- `src/core/fileReader.ts` - 复用现有功能
- 其他所有文件 - 无需修改

---

## ⚠️ 注意事项

### 1. 性能考虑
- 递归读取大目录可能很慢
- 建议添加文件数量限制（如最多100个文件）
- 显示加载动画提升用户体验

### 2. 安全性
- 读取文件时已有错误处理
- 不读取二进制文件（只读取文本文件）
- 使用已有的5000字符限制

### 3. 用户体验
- `@` 选择后用户需要重新输入完整问题
- 可以考虑改进为：选择文件后自动填入提示符
- 但需要更复杂的 readline 控制逻辑

### 4. 跨平台兼容性
- `find` 命令在 macOS/Linux 上可用
- Windows 上使用 `dir` 命令
- 或者使用 Node.js 的 `fs.readdirSync` 递归实现（更通用）

---

## 🚀 实施步骤

### Phase 1: 添加 `@` 文件选择功能
1. 实现 `showFileSelector()` 函数
2. 在主循环中添加 `@` 检测和处理
3. 测试基本功能

### Phase 2: 添加 `#` 目录读取功能
1. 实现 `handleDirectoryReference()` 函数
2. 在主循环中添加 `#` 检测和处理
3. 测试目录读取功能

### Phase 3: 集成测试和优化
1. 测试各种边界情况
2. 添加错误处理和提示信息
3. 优化用户体验（加载动画、进度显示）
4. 更新 README.md 文档

### Phase 4: 验证和发布
1. 运行所有测试
2. 手动测试各种使用场景
3. 更新版本号
4. 构建、发布

---

## ✅ 验收标准

- [ ] 输入 `@` 显示当前目录文件列表
- [ ] 可以通过序号选择文件
- [ ] 输入 `# src` 读取目录内容
- [ ] AI 能看到并分析文件内容
- [ ] 错误处理友好（目录不存在、无权限等）
- [ ] 不影响现有的 `/clear`、`/history` 等命令
- [ ] 所有现有功能正常工作
- [ ] 文档已更新

---

## 📦 后续优化建议

1. **改进 `@` 选择体验**
   - 选择文件后自动填入提示符，用户只需输入问题
   - 使用 readline 的光标控制功能

2. **文件过滤**
   - `@ #` 只显示特定类型文件（如 `.ts`, `.js`）
   - 支持通配符（如 `@ *.ts`）

3. **智能目录读取**
   - `#` 支持递归深度限制
   - 支持排除特定文件或目录

4. **快捷方式**
   - `@@` 选择上次使用的文件
   - `##` 使用上次使用的目录
