# Yuangs Git 命令短参数指南

所有 `yuangs git` 命令现已支持短参数，提升命令行使用效率。

## 📋 命令对照表

### `yuangs git review` - AI 代码审查

| 短参数 | 长参数 | 说明 | 默认值 |
|--------|--------|------|--------|
| `-l` | `--level` | 审查级别 (quick/standard/deep) | standard |
| `-f` | `--file` | 审查特定文件 | - |
| `-u` | `--unstaged` | 审查未暂存的变更 | false |
| `-c` | `--commit` | 审查指定的 commit | - |
| - | `--no-ai` | 禁用 AI | false |
| - | `--no-save` | 不保存审查结果 | false |
| - | `--force` | 忽略安全警告 | false |
| - | `--no-security` | 跳过安全扫描 | false |

**使用示例**:
```bash
# 使用短参数
yuangs git review -l deep -f src/app.ts
yuangs git review -u -l quick
yuangs git review -c HEAD~1

# 等同于长参数
yuangs git review --level deep --file src/app.ts
yuangs git review --unstaged --level quick
yuangs git review --commit HEAD~1
```

### `yuangs git commit` - AI 生成 Commit Message

| 短参数 | 长参数 | 说明 | 默认值 |
|--------|--------|------|--------|
| `-a` | `--all` | 暂存所有变更 | false |
| `-d` | `--detailed` | 生成详细的 commit message | false |
| `-t` | `--type` | 指定 commit 类型 | - |
| `-s` | `--scope` | 指定影响范围 | - |
| - | `--dry-run` | 只生成 message，不实际提交 | false |
| - | `--no-ai` | 不使用 AI，使用规则生成 | false |

**使用示例**:
```bash
# 使用短参数
yuangs git commit -a -d
yuangs git commit -t feat -s auth

# 等同于长参数
yuangs git commit --all --detailed
yuangs git commit --type feat --scope auth
```

### `yuangs git plan` - AI 规划开发任务

| 短参数 | 长参数 | 说明 | 默认值 |
|--------|--------|------|--------|
| `-r` | `--rounds` | 对话轮数 | 2 |

**使用示例**:
```bash
# 使用短参数
yuangs git plan -r 3 "添加用户认证功能"

# 等同于长参数
yuangs git plan --rounds 3 "添加用户认证功能"
```

### `yuangs git exec` - 执行任务

| 短参数 | 长参数 | 说明 | 默认值 |
|--------|--------|------|--------|
| `-f` | `--fromfile` | 指定 todo 文件路径 | todo.md |
| `-t` | `--task` | 执行指定编号的任务 | 1 |
| `-m` | `--model` | 指定 AI 模型 | Assistant |

**使用示例**:
```bash
# 使用短参数
yuangs git exec -t 2 -m gemini-2.5-flash-lite
yuangs git exec -f my-todo.md

# 等同于长参数
yuangs git exec --task 2 --model gemini-2.5-flash-lite
yuangs git exec --fromfile my-todo.md
```

### `yuangs git auto` - 全自动工作流

| 短参数 | 长参数 | 说明 | 默认值 |
|--------|--------|------|--------|
| `-n` | `--max-tasks` | 最大执行任务数 | 5 |
| `-m` | `--model` | 指定 AI 模型 | Assistant |
| `-s` | `--min-score` | 最低审查分数 | 85 |
| `-r` | `--skip-review` | 跳过代码审查 | false |
| `-o` | `--save-only` | 只保存代码，不写入文件 | false |
| `-c` | `--commit` | 完成后自动提交 | false |
| - | `--commit-message` | 自定义提交信息 | - |

**使用示例**:
```bash
# 使用短参数
yuangs git auto -n 10 -s 90 -c
yuangs git auto -r -o

# 等同于长参数
yuangs git auto --max-tasks 10 --min-score 90 --commit
yuangs git auto --skip-review --save-only
```

## 🎯 短参数设计原则

### 1. 常用选项优先
最常用的选项分配短参数，提升使用效率：
- `-l` (level) - 审查级别
- `-f` (file) - 文件路径
- `-c` (commit) - commit 引用
- `-m` (model) - AI 模型

### 2. 语义关联
短参数与长参数首字母对应：
- `-l` = `--level`
- `-f` = `--file` / `--fromfile`
- `-t` = `--type` / `--task`
- `-s` = `--scope` / `--min-score`
- `-m` = `--model`
- `-r` = `--rounds` / `--skip-review`

### 3. 避免冲突
在不同命令中，同一短参数可能对应不同长参数：
- `review -f` = `--file`
- `exec -f` = `--fromfile`
- `auto -r` = `--skip-review`
- `plan -r` = `--rounds`

### 4. 布尔选项
布尔选项（开关类）通常只有长参数：
- `--no-ai`
- `--no-save`
- `--force`
- `--dry-run`

## 💡 使用技巧

### 组合短参数
多个短参数可以组合使用：
```bash
# 审查未暂存的文件，使用 deep 级别
yuangs git review -u -l deep

# 暂存所有变更并生成详细 commit
yuangs git commit -a -d

# 执行任务 3，使用特定模型
yuangs git exec -t 3 -m gemini-2.5-flash-lite
```

### 混合使用
短参数和长参数可以混合使用：
```bash
yuangs git review -l deep --force
yuangs git auto -n 10 --commit-message "完成所有任务"
yuangs git commit -a --dry-run
```

### 环境变量配置
结合环境变量，进一步简化命令：
```bash
# 设置默认模型
export YUANGS_DEFAULT_MODEL=gemini-2.5-flash-lite

# 现在可以省略 -m 参数
yuangs git exec -t 2
```

## 📚 完整示例

### 场景 1: 快速审查
```bash
# 审查当前暂存的文件（quick 级别）
yuangs git review -l quick

# 审查未暂存的文件（standard 级别）
yuangs git review -u

# 审查特定文件（deep 级别）
yuangs git review -l deep -f src/core/auth.ts
```

### 场景 2: 自动化工作流
```bash
# 生成任务计划（3 轮对话）
yuangs git plan -r 3 "实现用户认证系统"

# 执行第一个任务
yuangs git exec -t 1

# 或者直接使用自动化工作流
yuangs git auto -n 5 -s 90 -c
```

### 场景 3: 提交代码
```bash
# 暂存所有变更并生成详细 commit
yuangs git commit -a -d

# 指定 commit 类型和范围
yuangs git commit -t feat -s auth

# 预览 commit message（不实际提交）
yuangs git commit --dry-run
```

## 🔍 查看帮助

每个命令都支持 `--help` 查看完整参数列表：
```bash
yuangs git review --help
yuangs git commit --help
yuangs git plan --help
yuangs git exec --help
yuangs git auto --help
```

## 📝 更新日志

### 2026-01-28
- ✅ 为 `review` 命令添加 `-u` (unstaged) 短参数
- ✅ 为 `exec` 命令添加 `-f`, `-t`, `-m` 短参数
- ✅ 为 `auto` 命令添加 `-n`, `-m`, `-s`, `-r`, `-o`, `-c` 短参数
- ✅ 统一所有命令的短参数设计

### 已有短参数
- `review`: `-l`, `-f`, `-c` (已存在)
- `commit`: `-a`, `-d`, `-t`, `-s` (已存在)
- `plan`: `-r` (已存在)

## 🎉 总结

现在所有常用选项都有了短参数，命令行操作更加高效！

**记忆技巧**:
- `-l` = level (级别)
- `-f` = file (文件)
- `-c` = commit (提交)
- `-m` = model (模型)
- `-t` = task/type (任务/类型)
- `-s` = score/scope (分数/范围)
- `-u` = unstaged (未暂存)
- `-r` = rounds/review (轮数/审查)
- `-n` = number (数量)
- `-o` = output-only (仅输出)
