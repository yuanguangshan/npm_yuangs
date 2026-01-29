# 执行 bash 命令功能设计

## 需求理解

用户在交互模式中添加文件到上下文后，希望能够执行文件中定义的命令。

## 当前设计分析

### 现有 `@` 语法
```typescript
@ filepath           // 添加文件到上下文
@ filepath:10-20    // 添加指定行范围
@ filepath as alias  // 添加带别名
```

**问题**：添加到上下文后，还需要手动输入命令来执行，操作不够连贯

## 新的设计方案

### 方案 1：扩展 `@` 语法（推荐）

#### 语法 A：直接执行
```typescript
@!script.sh
// 或
@ script.sh exec

// 行为：
// 1. 读取 script.sh 到上下文
// 2. 立即执行 script.sh
// 3. 不添加到上下文（因为执行了）
```

#### 语法 B：添加并询问
```typescript
@ script.sh?

// 行为：
// 1. 读取 script.sh 到上下文
// 2. 询问：是否执行 script.sh？
//    [1] 是，执行
//    [2] 不，只添加到上下文
```

#### 语法 C：指定命令执行
```typescript
@ script.sh:run dev

// 行为：
// 1. 读取 script.sh 到上下文
// 2. 执行命令：npm run dev
```

#### 语法 D：行号范围 + 命令
```typescript
@ config.json:run build

// 行为：
// 1. 读取 config.json
// 2. 执行 npm run build
```

---

### 方案 2：独立执行命令（最简洁）

#### 语法：`:exec <filepath>`
```typescript
:exec script.sh
:exec config.json run build

// 行为：
// 1. 直接执行指定文件中的命令
// 2. 不添加到上下文
// 3. 显示输出
```

#### 语法：`:run <filepath> [args...]`
```typescript
:run script.sh dev
:run config.json test

// 行为：
// 1. 在指定目录下执行命令
// 2. 传递额外参数
// 3. 显示输出
```

---

### 方案 3：上下文管理命令

#### 命令：`:run <index>` - 执行上下文中的第 N 个文件
```typescript
:run 1
:run 2-3

// 行为：
// 1. 查看 `:ls` 列表
// 2. 执行指定文件
```

#### 命令：`:edit <index>` - 编辑上下文中的文件
```typescript
:edit 1
:edit README.md

// 行为：
// 1. 打开编辑器编辑文件
```

---

## 推荐方案

### ⭐ 方案 1 + 方案 3 混合（最灵活）

#### 扩展 `@` 语法
```typescript
// 1. 标准添加（现有）
@ script.sh                    // 添加到上下文

// 2. 执行语法（新增）
@ script.sh?                  // 询问是否执行
@!script.sh                  // 立即执行
@ script.sh:run dev         // 执行指定命令

// 3. 独立命令（新增）
:exec script.sh
:run script.sh dev
```

#### 独立命令（方案 3）
```typescript
:exec script.sh                    // 执行 script.sh
:exec config.json run build    // 执行配置中的命令

:run script.sh dev              // 在指定目录执行
:run config.json test          // 在指定目录执行

:run 1                        // 执行上下文第 1 项
:run 2-3                      // 执行上下文第 2-3 项

:edit README.md                 // 编辑上下文文件
```

---

## 交互提示示例

### 场景 1：添加并执行脚本
```
你：@ deploy.sh
📦 已加入文件上下文: deploy.sh

你：@ deploy.sh:run prod
📦 已加入文件上下文: deploy.sh
⚡️  即将执行: npm run prod

[输出命令执行结果...]
```

### 场景 2：查看并管理上下文
```
你：:ls
📦 上下文列表：
  1. file: deploy.sh (tokens: 120)
  2. file: config.json (tokens: 350)

你：:run 1
⚡️  即将执行: ./deploy.sh

[输出...]
```

### 场景 3：添加文件并询问
```
你：@ script.sh
📦 已加入文件上下文: script.sh

请选择操作：
  [1] 执行 script.sh
  [2] 只添加到上下文
你：1
⚡️  即将执行: ./script.sh

[输出...]
```

---

## 实现细节

### 正则表达式
```typescript
// 扩展现有的正则
const match = trimmed.match(/^@\s*(.+?)(?::(\d+)(?:-(\d+))?)?(?:\s+as\s+(.+))?$/);

// 新增：支持执行语法
const execMatch = trimmed.match(/^@\s*(.+?)(?::([^).*)?$/);
// execMatch[1]: 文件路径
// execMatch[2]: 要执行的命令（可选）

const askMatch = trimmed.match(/^@\s*(.+?)\s+\?\s*$/);
// askMatch[1]: 文件路径
```

### 功能优先级

#### 阶段 1（1-2 天）
- [ ] 扩展 `@` 语法支持 `!` 和 `:command` 模式
- [ ] 实现命令解析和执行
- [ ] 添加输出捕获和显示

#### 阶段 2（3-5 天）
- [ ] 添加独立命令（`:exec`, `:run`）
- [ ] 实现上下文管理命令（`:ls`, `:edit`, `:run <index>`）

#### 阶段 3（可选）
- [ ] 添加命令历史和重试机制
- [ ] 优化错误处理和输出

---

## 用户决策

请选择您希望的实现方案：

**选项 A**：仅扩展 `@` 语法
- `@ script.sh?` - 添加并询问
- `@!script.sh` - 添加并立即执行
- `@ script.sh:run dev` - 添加并执行指定命令

**选项 B**：扩展 `@` 语法 + 独立命令
- `@ script.sh` - 添加到上下文
- `:exec script.sh` - 独立执行
- `:run script.sh dev` - 独立命令执行
- `:ls` - 查看上下文
- `:edit 1` - 编辑上下文文件

**选项 C**：独立命令（不扩展 `@`）
- `:exec script.sh`
- `:run script.sh dev`
- `:ls`
- `:edit 1`

**选项 D**：其他想法
- ________________________________

---

## 我的推荐

**推荐选项 B** - 功能最全面，灵活性最高

理由：
1. ✅ 保持 `@` 的语义清晰（添加文件到上下文）
2. ✅ 提供独立命令（`:exec`, `:run`）来执行
3. ✅ 提供上下文管理命令（`:ls`, `:edit`, `:run <index>`）
4. ✅ 语法简单直观
5. ✅ 不破坏现有功能

请告诉我您希望使用哪个选项？
