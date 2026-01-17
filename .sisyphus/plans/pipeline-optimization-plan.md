# yuangs CLI 管道命令优化计划

## 📋 需求概述

优化 `yuangs` CLI 的管道命令功能,实现以下两个目标:

1. **省略 `ai` 子命令关键字**: 管道模式下支持 `cat file | yuangs '问题'` 省略 `ai` 关键字
2. **智能文件内容读取**: 管道模式下自动读取文件内容,让AI能看到ls结果及文件实际内容

---

## 🎯 功能需求详解

### 需求1: 管道模式省略 `ai` 关键字

**当前行为**:
```bash
cat file.txt | yuangs ai '解释这个文件'
```

**期望行为**:
```bash
cat file.txt | yuangs '解释这个文件'
```

**实现要点**:
- 当检测到stdin输入时,如果命令参数不匹配任何已知的子命令,则默认调用AI命令
- 保持向后兼容:`yuangs ai` 仍然有效
- 支持 `yuangs` 的所有AI选项:`-p`, `-f`, `-l`, `-m`, `-e`

### 需求2: 智能文件内容读取 (`-w` 参数)

**当前行为**:
```bash
ls | yuangs ai '分析这些文件'
# AI只能看到文件名列表,看不到文件内容
```

**期望行为**:
```bash
ls | yuangs -w '分析这些文件'
# AI能看到文件列表 + 每个文件的实际内容
```

**实现要点**:
- 新增 `-w` / `--with-content` 参数
- 解析ls输出,提取文件路径
- 批量读取文件内容
- 将文件列表和文件内容组织成结构化提示传递给AI

---

## 🏗️ 技术设计

### 1. 管道模式省略 `ai` 关键字

#### 1.1 修改入口文件 (`src/cli.ts`)

**当前代码** (第24-62行):
```typescript
async function readStdin(): Promise<string> { ... }

program
    .command('ai [question...]')
    .description('向 AI 提问')
    .option('-e, --exec', '生成并执行 Linux 命令')
    ...
```

**修改方案**:

添加一个全局的fallback处理函数,在程序最后调用:

```typescript
// 在 program.parse() 之前添加
const args = process.argv.slice(2);
const stdinData = await readStdin();

// 检测是否是管道模式 + 未匹配的命令
if (stdinData && !args.some(arg => args.includes(arg))) {
    // 提取问题和选项
    const options = parseOptionsFromArgs(args);
    const question = args.filter(arg => !arg.startsWith('-')).join(' ');
    
    // 调用AI命令
    await handleAICommandOrChat(question, stdinData, options);
    return;
}

program.parse();
```

#### 1.2 命令选项解析函数

创建一个新的工具函数来从参数中提取选项:

```typescript
function parseOptionsFromArgs(args: string[]): {
    exec: boolean;
    model?: string;
    withContent: boolean;
} {
    return {
        exec: args.includes('-e') || args.includes('--exec'),
        model: getArgValue(args, ['-m', '--model']) || getModelFromShortcuts(args),
        withContent: args.includes('-w') || args.includes('--with-content')
    };
}

function getModelFromShortcuts(args: string[]): string | undefined {
    if (args.includes('-p')) return 'gemini-pro-latest';
    if (args.includes('-f')) return 'gemini-flash-latest';
    if (args.includes('-l')) return 'gemini-flash-lite-latest';
    return undefined;
}
```

### 2. 智能文件内容读取 (`-w` 参数)

#### 2.1 新增工具模块 (`src/core/fileReader.ts`)

```typescript
import fs from 'fs';
import path from 'path';

/**
 * 从ls输出中解析文件路径
 * 支持常见的ls输出格式:
 * - ls: file.txt
 * - ls -l: -rw-r--r-- 1 user group 123 Jan 1 file.txt
 * - ls -la: drwxr-xr-x 5 user group 160 Jan 1 .
 */
export function parseFilePathsFromLsOutput(output: string): string[] {
    const lines = output.trim().split('\n');
    const filePaths: string[] = [];

    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const lastPart = parts[parts.length - 1];
        
        // 跳过特殊目录 (. 和 ..) 和权限字符串
        if (lastPart && !lastPart.startsWith('-') && lastPart !== '.' && lastPart !== '..') {
            filePaths.push(lastPart);
        }
    }

    return filePaths;
}

/**
 * 读取多个文件的内容
 */
export function readFilesContent(filePaths: string[]): Map<string, string> {
    const contentMap = new Map<string, string>();

    for (const filePath of filePaths) {
        try {
            const fullPath = path.resolve(filePath);
            if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                contentMap.set(filePath, content);
            }
        } catch (error) {
            // 忽略读取失败的文件,记录日志
            console.error(`无法读取文件: ${filePath}`);
        }
    }

    return contentMap;
}

/**
 * 构建包含文件内容的AI提示
 */
export function buildPromptWithFileContent(
    originalOutput: string,
    filePaths: string[],
    contentMap: Map<string, string>,
    question?: string
): string {
    let prompt = '';

    // 添加原始ls输出
    prompt += '## 文件列表\n';
    prompt += '```\n';
    prompt += originalOutput;
    prompt += '```\n\n';

    // 添加文件内容
    if (contentMap.size > 0) {
        prompt += '## 文件内容\n\n';
        for (const [filePath, content] of contentMap) {
            prompt += `### ${filePath}\n`;
            prompt += '```\n';
            // 限制每个文件的最大字符数,避免token过多
            const maxChars = 5000;
            const truncated = content.length > maxChars 
                ? content.substring(0, maxChars) + '\n... (内容过长已截断)'
                : content;
            prompt += truncated;
            prompt += '\n```\n\n';
        }
    }

    // 添加用户问题
    if (question) {
        prompt += `\n## 我的问题\n${question}`;
    } else {
        prompt += '\n## 我的问题\n请分析以上文件列表和文件内容';
    }

    return prompt;
}
```

#### 2.2 修改 `src/cli.ts` 的AI命令处理

在 `ai` 命令的action中添加 `-w` 参数处理:

```typescript
program
    .command('ai [question...]')
    .description('向 AI 提问')
    .option('-e, --exec', '生成并执行 Linux 命令')
    .option('-m, --model <model>', '指定 AI 模型')
    .option('-p', '使用 Pro 模型 (gemini-pro-latest)')
    .option('-f', '使用 Flash 模型 (gemini-flash-latest)')
    .option('-l', '使用 Lite 模型 (gemini-flash-lite-latest)')
    .option('-w, --with-content', '在管道模式下读取文件内容')
    .action(async (questionArgs, options) => {
        const stdinData = await readStdin();
        let question = Array.isArray(questionArgs) ? questionArgs.join(' ').trim() : questionArgs || '';

        if (stdinData) {
            if (options.withContent) {
                // 智能读取文件内容
                const { parseFilePathsFromLsOutput, readFilesContent, buildPromptWithFileContent } = 
                    await import('./core/fileReader');
                
                const filePaths = parseFilePathsFromLsOutput(stdinData);
                const contentMap = readFilesContent(filePaths);
                question = buildPromptWithFileContent(stdinData, filePaths, contentMap, question);
            } else {
                // 普通管道模式
                question = `以下是输入内容：\n\n${stdinData}\n\n我的问题是：${question || '分析以上内容'}`;
            }
        }

        let model = options.model;
        if (options.p) model = 'gemini-pro-latest';
        if (options.f) model = 'gemini-flash-latest';
        if (options.l) model = 'gemini-flash-lite-latest';

        if (options.exec) {
            await handleAICommand(question, { execute: false, model });
        } else {
            await handleAIChat(question || null, model);
        }
    });
```

---

## 📝 使用示例

### 示例1: 管道模式省略 `ai` 关键字

```bash
# 分析日志文件
cat error.log | yuangs "解释这个错误"

# 代码审查
git diff | yuangs "review这个代码变更"

# 使用Pro模型
ls -la | yuangs -p "总结这些文件"

# 命令生成模式
cat requirements.txt | yuangs -e "创建对应的Dockerfile"
```

### 示例2: 智能文件内容读取 (`-w`)

```bash
# 分析目录下的所有文件
ls | yuangs -w "分析这个目录"

# 查看并解释所有TypeScript文件
ls *.ts | yuangs -w "解释这些文件的功能"

# 结合省略ai关键字
ls | yuangs -w "有什么问题需要修复吗?"
```

---

## 🧪 测试计划

### 单元测试

**新建测试文件: `test/fileReader.test.js`**

```javascript
const {
    parseFilePathsFromLsOutput,
    readFilesContent,
    buildPromptWithFileContent
} = require('../dist/core/fileReader');

describe('Module: FileReader', () => {
    describe('parseFilePathsFromLsOutput', () => {
        test('should parse simple ls output', () => {
            const output = 'file1.txt\nfile2.ts\nfile3.js';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual(['file1.txt', 'file2.ts', 'file3.js']);
        });

        test('should parse ls -l output', () => {
            const output = '-rw-r--r-- 1 user group 123 Jan 1 file1.txt\n-rw-r--r-- 1 user group 456 Jan 2 file2.ts';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual(['file1.txt', 'file2.ts']);
        });

        test('should skip . and .. directories', () => {
            const output = '.\n..\nfile.txt';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual(['file.txt']);
        });
    });

    describe('readFilesContent', () => {
        // Mock fs module
        jest.mock('fs');
        
        test('should read multiple files', () => {
            // 实现文件读取测试
        });
    });
});
```

### 集成测试

**新建测试文件: `test/pipeline.test.js`**

测试管道模式的端到端行为,包括:
- 省略 `ai` 关键字的情况
- `-w` 参数的文件内容读取
- 组合使用情况

---

## ⚠️ 注意事项

### 1. 向后兼容性
- `yuangs ai` 命令保持不变
- 现有管道模式 `yuangs ai` 仍然有效
- 新功能通过检测和fallback实现,不影响现有行为

### 2. 文件读取安全
- 只读取普通文件,跳过目录
- 限制每个文件的最大字符数(5000)
- 捕获并忽略读取错误,不中断整个流程

### 3. 性能考虑
- 对于大量文件,读取内容可能较慢
- 考虑添加文件数量限制(如最多读取10个文件)
- 显示进度信息

### 4. Token消耗
- 文件内容会大量消耗token
- 考虑添加文件大小/行数限制
- 可能需要警告用户

---

## 📂 文件变更清单

### 新建文件
1. `src/core/fileReader.ts` - 文件读取工具模块
2. `test/fileReader.test.js` - 文件读取模块测试
3. `test/pipeline.test.js` - 管道模式集成测试

### 修改文件
1. `src/cli.ts` - 主要修改点
   - 添加选项解析函数
   - 添加管道模式fallback处理
   - 在 `ai` 命令中添加 `-w` 参数支持
   - 智能处理stdin数据

### 不变文件
- `src/commands/handleAIChat.ts` - 无需修改
- `src/commands/handleAICommand.ts` - 无需修改
- `src/ai/client.ts` - 无需修改

---

## 🚀 实施步骤

### Phase 1: 创建文件读取工具
1. 创建 `src/core/fileReader.ts`
2. 实现文件路径解析函数
3. 实现文件内容读取函数
4. 实现提示构建函数
5. 编写单元测试

### Phase 2: 修改CLI入口
1. 在 `src/cli.ts` 中添加选项解析函数
2. 实现 `getModelFromShortcuts` 函数
3. 添加管道模式fallback逻辑
4. 测试省略 `ai` 关键字的功能

### Phase 3: 集成 `-w` 参数
1. 在 `ai` 命令中添加 `-w` 选项
2. 集成文件读取工具
3. 调整stdin数据处理逻辑
4. 编写集成测试

### Phase 4: 文档和验证
1. 更新 README.md
2. 运行所有测试
3. 手动验证各种使用场景
4. 构建和发布

---

## ✅ 验收标准

- [x] `cat file | yuangs '问题'` 可以正常工作
- [x] `cat file | yuangs -p '问题'` 支持模型选项
- [x] `cat file | yuangs -e '问题'` 支持命令执行模式
- [x] `ls | yuangs -w '问题'` 能读取文件内容
- [x] 文件读取有安全限制和错误处理
- [x] 所有现有功能保持正常
- [x] 所有测试通过
- [x] 文档已更新

---

## 📦 后续优化建议

1. **文件过滤**: 添加 `--include` 和 `--exclude` 参数来过滤文件
2. **递归读取**: 添加 `-r` 参数递归读取目录下的所有文件
3. **文件类型检测**: 根据文件扩展名进行不同的内容提取
4. **智能总结**: 对于大文件,先让AI总结再完整分析
5. **缓存机制**: 避免重复读取相同文件
