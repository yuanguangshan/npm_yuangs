# 实例功能实现原理详解

本文档详细解释 `@`（文件引用）和 `#`（目录引用）功能的实现原理。

---

## 核心架构

### 1. 上下文管理模型

```typescript
type ContextItem = {
    type: 'file' | 'directory';
    path: string;
    alias?: string;        // 可选别名
    content: string;       // 文件/目录内容
    summary?: string;     // 可选摘要
    tokens: number;        // 估算的 token 数量
};

class ContextBuffer {
    private items: ContextItem[] = [];
    private maxTokens = 8000;  // 最大 token 限制

    add(item, bypassTokenLimit = false) {
        // 添加到上下文缓冲区
    }

    buildPrompt(userInput: string): string {
        // 构建包含上下文的提示词
    }
}
```

**核心设计思想**：
- **缓冲区模式**：所有上下文项存储在内存中的 `ContextBuffer` 里
- **Token 预算**：每个项预先估算 token 数量
- **自动裁剪**：当总 token 超过 8000 时，自动移除最早的项
- **持久化**：使用 `contextStorage` 保存到磁盘，重启后恢复

---

## @ 符号（文件引用）实现原理

### 工作流程

```
用户输入: @ README.md
    ↓
解析正则匹配
    ↓
读取文件内容
    ↓
添加到 ContextBuffer
    ↓
构建提示词（buildPrompt）
    ↓
发送给 AI
```

### 详细步骤

#### 1. 输入识别
```typescript
if (trimmed.startsWith('@')) {
    // 进入文件引用模式
}
```

#### 2. 正则解析（支持高级语法）
```typescript
// 支持语法：@ filepath:startLine-endLine as alias
const match = trimmed.match(/^@\s*(.+?)(?::(\d+)(?:-(\d+))?)?(?:\s+as\s+(.+))?$/);

// 匹配结果：
// match[1]: 文件路径
// match[2]: 起始行号
// match[3]: 结束行号（可选）
// match[4]: 别名（可选）
```

**示例**：
- `@ README.md` → 读取整个文件
- `@ README.md:10-20` → 只读取第 10-20 行
- `@ README.md as 配置文件` → 读取整个文件，别名为"配置文件"

#### 3. 文件内容读取
```typescript
const absolutePath = path.resolve(filePath);
let content = await fs.promises.readFile(absolutePath, 'utf-8');

// 如果指定了行号范围
if (lineStart !== null) {
    const lines = content.split('\n');
    const startIdx = lineStart - 1;  // 转换为数组索引
    const endIdx = lineEnd ? Math.min(lineEnd, lines.length) : lines.length;

    // 验证行号范围
    if (lineStart < 1 || lineStart > lines.length) {
        console.log(chalk.red(`错误: 起始行号 ${lineStart} 超出文件范围`));
    }

    // 提取指定范围
    content = lines.slice(startIdx, endIdx).join('\n');
}
```

#### 4. 添加到上下文缓冲区
```typescript
contextBuffer.add({
    type: 'file',
    path: pathWithRange,  // 如 "README.md:10-20"
    alias,
    content
}, true);  // bypassTokenLimit = true，允许超过限制
```

**为什么 `bypassTokenLimit = true`？**
- 用户明确引用的文件应始终包含在上下文中
- 即使超过 8000 token 限制，也不应该被裁剪

#### 5. 提示词构建
```typescript
buildPrompt(userInput) {
    const contextBlock = this.items.map(item => {
        const title = item.alias
            ? `${item.type}：${item.alias} (${item.path})`
            : `${item.type}：${item.path}`;

        const body = item.summary ?? item.content;

        return `
${title}
\`\`\`
${body}
\`\`\`
`;
    }).join('\n\n');

    return `
你正在基于以下上下文回答问题：

${contextBlock}

用户问题：
${userInput}
`;
}
```

**最终发送给 AI 的提示词示例**：
```
你正在基于以下上下文回答问题：

file：配置文件 (README.md)
```
This is the README content...
```

用户问题：
解释这个项目的功能
```

---

## # 符号（目录引用）实现原理

### 工作流程

```
用户输入: # src/
    ↓
解析正则匹配
    ↓
使用 find 命令查找目录下所有文件
    ↓
批量读取文件内容
    ↓
构建结构化提示词
    ↓
添加到 ContextBuffer
    ↓
发送给 AI
```

### 详细步骤

#### 1. 输入识别
```typescript
if (trimmed.startsWith('#')) {
    // 进入目录引用模式
}
```

#### 2. 正则解析
```typescript
const match = trimmed.match(/^#\s*(.+?)\s*(?:\n(.*))?$/s);
// match[1]: 目录路径
// match[2]: 可选的问题
```

#### 3. 文件查找（跨平台）
```typescript
const findCommand = process.platform === 'darwin' || process.platform === 'linux'
    ? `find "${fullPath}" -type f`      // macOS/Linux
    : `dir /s /b "${fullPath}"`;        // Windows

const { stdout } = await execAsync(findCommand);
const filePaths = stdout.trim().split('\n').filter(f => f);
```

#### 4. 批量读取文件
```typescript
const contentMap = readFilesContent(filePaths);
// 返回 Map<filePath, content>

// buildPromptWithFileContent 构建：
// 1. 显示文件列表（ls 输出）
// 2. 显示每个文件的内容（最多 5000 字符）
// 3. 追加用户问题
```

#### 5. 提示词构建
```typescript
buildPromptWithFileContent(
    `目录: ${dirPath}\n找到 ${filePaths.length} 个文件`,
    filePaths.map(p => path.relative(process.cwd(), p)),
    contentMap,
    ''
);
```

**生成的提示词结构**：
```
## 文件列表
```
src/cli.ts
src/index.ts
src/types.d.ts
...
```

## 文件内容
### src/cli.ts
```
[文件内容...]
```

### src/index.ts
```
[文件内容...]
```
```

---

## Tab 补全实现原理

### 工作流程

```
用户输入: @ REA<Tab>
    ↓
completer 函数被调用
    ↓
分析输入（@ 或 #，路径，部分名称）
    ↓
读取目标目录文件
    ↓
过滤匹配项（文件/目录，部分匹配）
    ↓
返回补全列表和共同前缀
    ↓
readline 显示补全菜单或自动补全
```

### 详细步骤

#### 1. 触发条件
```typescript
completer: (line: string) => {
    // 只在 @ 或 # 开头时启用补全
    if (!line.startsWith('@') && !line.startsWith('#')) {
        return [[], line];  // 不提供补全
    }

    const isFileMode = line.startsWith('@');  // @ 模式补全文件
    const isDirMode = line.startsWith('#');   // # 模式补全目录
}
```

#### 2. 输入解析
```typescript
const prefix = isFileMode ? '@ ' : '# ';
const inputAfterPrefix = line.substring(prefix.length);

// 示例：
// 输入: "@ src/REA"
// prefix: "@ "
// inputAfterPrefix: "src/REA"
```

#### 3. 路径拆分
```typescript
const parts = inputAfterPrefix.split(path.sep);  // 按 / 或 \ 拆分
const partialName = parts[parts.length - 1];    // 最后部分是待补全的
const basePath = parts.slice(0, -1).join(path.sep);  // 前面部分是已确定路径

// 示例：输入 "@ src/REA"
// parts: ["src", "REA"]
// partialName: "REA"
// basePath: "src"
```

#### 4. 文件系统查询
```typescript
const searchPath = basePath ? path.resolve(basePath) : process.cwd();
const files = fs.readdirSync(searchPath);

const completions = files
    .filter(f => {
        const fullPath = path.join(searchPath, f);
        const isDir = fs.statSync(fullPath).isDirectory();
        const matchesPrefix = f.toLowerCase().startsWith(partialName.toLowerCase());

        if (isFileMode) {
            return matchesPrefix && !isDir;  // 只匹配文件
        } else {
            return matchesPrefix && isDir;   // 只匹配目录
        }
    })
    .map(f => {
        const fullPath = path.join(searchPath, f);
        const isDir = fs.statSync(fullPath).isDirectory();
        return isDir ? f + path.sep : f;  // 目录添加 / 后缀
    });
```

#### 5. 共同前缀计算
```typescript
function findCommonPrefix(strings: string[]): string {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];

    let common = '';
    const first = strings[0];

    // 逐字符比较
    for (let i = 0; i < first.length; i++) {
        const char = first[i];
        if (strings.every(s => s[i] === char)) {
            common += char;
        } else {
            break;
        }
    }

    return common;
}

// 示例：
// 输入: "@ RE"
// 匹配: ["README.md", "release-notes.md"]
// 共同前缀: "README"
// 显示: "@ README"
```

#### 6. 返回值格式
```typescript
return [
    completions.map(c => prefix + basePath + path.sep + c),  // 完整补全列表
    prefix + basePath + path.sep + commonPrefix  // 共同前缀（自动补全）
];
```

**readline 行为**：
1. 如果多个匹配 → 显示补全菜单
2. 如果一个匹配 → 自动补全
3. 持续 Tab → 循环遍历

---

## 完整数据流图

```
用户输入 (@ 或 #)
    ↓
┌─────────────────────────────┐
│  Tab 补全 (可选)        │
│  completer 函数         │
│  - 路径解析             │
│  - 文件系统查询         │
│  - 前缀匹配             │
└─────────────────────────────┘
    ↓
解析输入（正则）
    ↓
┌─────────────────────────────┐
│  文件内容读取             │
│  - fs.readFile           │
│  - 或 find + readFile    │
│  - 行号范围提取           │
└─────────────────────────────┘
    ↓
添加到 ContextBuffer
    ├─ Token 预算 (estimateTokens)
    ├─ 持久化 (saveContext)
    └─ 自动裁剪 (trimIfNeeded)
    ↓
构建提示词 (buildPrompt)
    ├─ 格式化上下文项
    ├─ 添加用户问题
    └─ 生成完整 Prompt
    ↓
调用 AI API (callAI_Stream)
    ├─ 流式输出
    ├─ Markdown 渲染
    └─ 显示给用户
```

---

## 关键设计决策

### 1. 为什么使用缓冲区而不是直接发送？

**优点**：
- **支持多文件**：用户可以多次使用 `@` 和 `#` 累积上下文
- **Token 管控**：预先估算，避免超限
- **会话持久化**：重启后恢复上下文

### 2. 为什么支持行号范围？

**场景**：
- 大型文件不需要全部发送
- 精确定位问题代码片段
- 减少 token 消耗

### 3. 为什么 Tab 补全使用 `completer`？

**优点**：
- **集成度高**：使用 Node.js 原生 readline API
- **无额外依赖**：不需要第三方补全库
- **跨平台**：自动适配不同终端

### 4. 为什么目录使用 `find` 命令而不是递归？

**考虑**：
- **效率**：`find` 命令是系统调用，比 Node.js 递归快
- **兼容性**：支持隐藏文件和特殊字符
- **跨平台**：自动选择 `find` (Unix) 或 `dir` (Windows)

---

## 优化策略

### 1. Token 估算
```typescript
const estimateTokens = (text: string) => Math.ceil(text.length / 4);
```
- **简单但有效**：1 个字符 ≈ 0.25 个 token
- **实时计算**：无需额外库
- **保守估算**：宁可多算，避免超限

### 2. 内容截断
```typescript
const maxChars = 5000;
const truncated = content.length > maxChars
    ? content.substring(0, maxChars) + '\n... (内容过长已截断)'
    : content;
```
- **防止过大文件**：避免发送 10MB 的单文件
- **保持可读性**：添加截断提示

### 3. 持久化时机
```typescript
await saveContext(contextBuffer.export());
```
- **每次添加后保存**：确保不丢失
- **异步保存**：不阻塞用户输入
- **磁盘写入**：使用 JSON 格式

---

## 总结

实例功能的核心原理是：

1. **上下文缓冲区**：`ContextBuffer` 管理所有上下文项
2. **Token 管理**：自动裁剪，控制成本
3. **智能解析**：支持高级语法（行号、别名）
4. **Tab 补全**：提升用户体验，快速定位文件
5. **提示词构建**：将文件内容格式化为 AI 可理解的格式
6. **持久化**：保存到磁盘，支持会话恢复

这些设计共同构成了一个高效、用户友好的文件上下文系统！
