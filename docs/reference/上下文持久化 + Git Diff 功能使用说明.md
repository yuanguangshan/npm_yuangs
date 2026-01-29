# 上下文持久化 + Git Diff 功能使用说明

## ✅ 已实现功能

### 1️⃣ 上下文持久化（跨 CLI 会话）

退出 CLI → 再进来 → **上下文还在**

#### 基本用法

```bash
node dist/cli.js ai

# 加入文件上下文
@ src/index.ts

# 加入目录上下文
# src/utils

# 查看当前上下文
:ls

# 退出
exit

# 重新进入，上下文还在
node dist/cli.js ai
:ls   # ✅ 仍然能看到刚才的文件和目录

# 清空上下文
:clear   # ✅ 同时清空内存和磁盘存储
```

#### 支持的操作

| 命令 | 功能 |
|---|---|
| `@` | 选择文件加入上下文 |
| `@ file as 别名` | 文件 + 别名 |
| `#目录` | 加入整个目录 |
| `:ls` | 查看当前上下文（表格形式） |
| `:clear` | 清空上下文（含持久化存储） |

#### 存储位置

- 路径：`.ai/context.json`
- 已自动添加到 `.gitignore`
- 手动删除：`rm -rf .ai/`

---

### 2️⃣ Git Diff 自动注入

AI **自动知道你正在改什么代码**，无需手动 `@` 文件

#### 自动触发条件

只要你在 Git 仓库中，有任何变更（staged / unstaged），AI 都会自动看到：

```bash
# 修改了一些文件后
node dist/cli.js ai

# 直接提问，不需要 @
这个改动有没有潜在 bug？
```

AI 会同时看到：
- Git diff 变更
- 你当前上下文
- 你的问题

#### 支持的变更类型

- ✅ `git diff` （未暂存）
- ✅ `git diff --staged` （已暂存）
- ✅ 两者同时存在

#### 示例输出

```
以下是 Git 变更内容：

【未暂存】
```diff
- const a = 1;
+ const a = 2;
```

你正在基于以下上下文回答问题：

文件：index.ts
```
const a = 2;
```

用户问题：
这个改动有没有潜在 bug？
```

---

## 🎯 实际使用场景

### 场景 1：代码审查（不用复制粘贴）

```bash
# 你改了代码
git diff

# 直接问 AI
node dist/cli.js ai
这个改动的逻辑对吗？
```

---

### 场景 2：跨会话持续讨论

```bash
node dist/cli.js ai
@ src/index.ts
@ src/utils.ts
这些文件之间有什么依赖关系？

exit

# 第二次进来，上下文还在
node dist/cli.js ai
:ls   # 确认上下文还在
继续深入分析
```

---

### 场景 3：复杂问题分步骤

```bash
node dist/cli.js ai

# 第一步：加入上下文
@ src/index.ts
# src/core
@ src/config.ts

# 第二步：提问
这个项目的入口文件在哪里？
```

---

## 🧹 清理命令

| 命令 | 功能 |
|---|---|
| `/clear` | 清空本次对话历史 |
| `:clear` | 清空上下文（跨会话） + 删除 `.ai/context.json` |

---

## 🔧 技术细节

### Token 管理

- 默认上限：8000 tokens
- 超出时自动移除最早添加的上下文（FIFO）
- 每个上下文项显示 token 数量

### 持久化格式

`.ai/context.json`:

```json
[
  {
    "type": "file",
    "path": "src/index.ts",
    "alias": "entry",
    "content": "...",
    "tokens": 125
  },
  {
    "type": "directory",
    "path": "src",
    "content": "...",
    "tokens": 4500
  }
]
```

### Git Diff 行为

- Git 不存在：自动跳过，不报错
- 没有变更：不注入 diff
- diff 太大（>1MB）：自动截断

---

## ✅ 验证状态

所有功能已通过验证：

- ✅ ContextBuffer 基本功能
- ✅ 上下文持久化（save/load/clear）
- ✅ Git Diff 自动获取
- ✅ Token 自动裁剪
- ✅ 现有测试套件（32 tests 全部通过）

---

## 🚀 下一步进化方向

- 上下文持久化加密
- Git 分支感知（自动注入 diff 到目标分支）
- 上下文导出 / 导入（JSON/YAML）
- 自定义 token 上限配置
