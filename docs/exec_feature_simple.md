# 执行 bash 命令功能 - 简化方案

## 核心设计

在 `@` 语法基础上，增加简单的执行方式。

---

## 新增语法

### 1. 立即执行（添加到上下文 + 执行）

```typescript
@!script.sh

// 行为：
// 1. 读取 script.sh 并添加到上下文
// 2. 立即执行 script.sh
// 3. 显示执行输出
```

**使用示例**：
```bash
你：@!script.sh
📦 已加入文件上下文: script.sh
⚡️  正在执行: ./script.sh

[命令输出...]
✓ 执行完成
```

---

### 2. 指定命令执行

```typescript
@ script.sh:run dev

// 行为：
// 1. 读取 script.sh 并添加到上下文
// 2. 执行: npm run dev
```

**使用示例**：
```bash
你：@ script.sh:run build
📦 已加入文件上下文: script.sh
⚡️  正在执行: npm run build

[输出...]
✓ 执行完成
```

---

### 3. 只执行（不添加到上下文）

```typescript
:exec script.sh
:exec config.json:run test

// 语法：:exec filepath[:command]

// 行为：
// 1. 不添加到上下文
// 2. 直接执行指定文件（如果包含命令，执行命令；否则执行文件）
// 3. 显示输出
```

**使用示例**：
```bash
你：:exec script.sh
⚡️  正在执行: ./script.sh

[脚本输出...]
✓ 执行完成

你：:exec config.json:run build
⚡️  正在执行: npm run build

[npm output...]
✓ 执行完成
```

---

## 实现优先级

### 阶段 1（立即实现）
- [x] 实现 `@!` 语法 - 立即执行
- [x] 实现 `:exec` 语法 - 独立执行

### 阶段 2（可选，后续）
- [ ] 上下文管理命令（`:ls`, `:run <index>`）
- [ ] 上下文编辑命令（`:edit <index>`）

---

## 交互示例

### 示例 1：添加并立即执行脚本
```bash
你：@!deploy.sh
📦 已加入文件上下文: deploy.sh
⚡️  正在执行: ./deploy.sh

Deploying application...
✓ Deployed successfully
```

### 示例 2：添加并执行指定命令
```bash
你：@ package.json:run build
📦 已加入文件上下文: package.json
⚡️  正在执行: npm run build

> yuangs@2.9.0 build
[build output...]
✓ Build completed
```

### 示例 3：只执行脚本
```bash
你：:exec deploy.sh
⚡️  正在执行: ./deploy.sh

Deploying...
✓ Deploy completed
```

---

## 实现方案

### 语法解析

```typescript
// 现有正则（@ 文件引用）
const match = trimmed.match(/^@\s*(.+?)(?::(\d+)(?:-(\d+))?)?(?:\s+as\s+(.+))?$/);

// 新增：立即执行
const execMatch = trimmed.match(/^@\s*(.+?)\s+\!\s*$/);
if (execMatch) {
    // filePath: execMatch[1]
    // 立即执行，不添加到上下文
}

// 新增：命令执行
const cmdMatch = trimmed.match(/^@\s*(.+?)\s*:\s*([^].*)$/);
if (cmdMatch) {
    // filePath: cmdMatch[1]
    // command: cmdMatch[2]
    // 添加到上下文并执行命令
}

// 独立执行
const standaloneMatch = trimmed.match(/^:\s*exec\s*(.+?)(?::([^).*)?$/);
if (standaloneMatch) {
    // filepath: standaloneMatch[1]
    // command: standaloneMatch[2] || 'run'  // 默认执行文件
    // 不添加到上下文
}
```

### 执行逻辑

```typescript
async function handleExecMode(filePath: string, command?: string) {
    const fullPath = path.resolve(filePath);

    if (command) {
        // 执行命令
        const { stdout, stderr } = await exec(command, { cwd: path.dirname(fullPath) });
        console.log(stdout);
        if (stderr) console.error(stderr);
    } else {
        // 执行文件
        const { stdout, stderr } = await exec(fullPath, { cwd: process.cwd() });
        console.log(stdout);
        if (stderr) console.error(stderr);
    }
}

async function handleAddAndExec(filePath: string, command?: string) {
    const content = await fs.promises.readFile(fullPath, 'utf-8');
    const absolutePath = path.resolve(filePath);

    // 添加到上下文
    contextBuffer.add({
        type: 'file',
        path: absolutePath,
        content
    });

    // 执行命令
    if (command) {
        const { stdout, stderr } = await exec(command, { cwd: path.dirname(fullPath) });
        console.log(chalk.green(`✓ 已加入文件上下文: ${filePath}`));
        console.log(chalk.cyan(`⚡️  正在执行: ${command}`));
        console.log(stdout);
        if (stderr) console.error(chalk.red(stderr));
    } else {
        const { stdout, stderr } = await exec(fullPath, { cwd: process.cwd() });
        console.log(chalk.green(`✓ 已加入文件上下文: ${filePath}`));
        console.log(chalk.cyan(`⚡️  正在执行: ${fullPath}`));
        console.log(stdout);
        if (stderr) console.error(chalk.red(stderr));
    }
}
```

---

## 实现优先级

### 必做（立即实现）
1. ✅ 实现 `@!filename` 语法 - 立即执行文件
2. ✅ 实现 `:exec filepath[:command]` 语法 - 独立执行文件或命令

### 推荐（后续）
- 上下文管理（`:ls`, `:run <index>`, `:edit <index>`）

---

## 总结

**新增功能**：
- `@!filename` - 添加并立即执行
- `@ filename:command` - 添加并执行指定命令
- `:exec filepath[:command]` - 独立执行（不添加到上下文）

**优势**：
- 简单直观，易于理解
- 功能全面，支持多种场景
- 不破坏现有 `@` 语法
- 清晰的语义：`!` 表示立即，`:` 表示命令

**是否开始实现？**
请回复 "开始实现" 或提出修改建议。
