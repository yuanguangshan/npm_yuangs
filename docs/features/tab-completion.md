# Tab 补全功能实现详解

> **目标读者**: 开发者、技术爱好者
> **阅读时间**: 15 分钟
> **相关文件**: `src/core/completion.ts`, `src/cli.ts`

---

## 目录

1. [背景与目标](#1-背景与目标)
2. [Shell 补全基础原理](#2-shell-补全基础原理)
3. [yuangs 补全架构设计](#3-yuangs-补全架构设计)
4. [核心实现详解](#4-核心实现详解)
5. [完整流程图](#5-完整流程图)
6. [关键技术细节](#6-关键技术细节)
7. [测试与验证](#7-测试与验证)
8. [常见问题](#8-常见问题)

---

## 1. 背景与目标

### 1.1 问题陈述

用户反馈：输入命令时，如 `yuangs mac` 按 Tab 键无法补全为 `yuangs macros`。

**原因**: yuangs 作为一个 npm 包安装后，Shell 不知道有哪些子命令可用。

### 1.2 解决方案

为 yuangs 实现 Shell 补全功能，使用户能够：
- 补全命令名（`yuangs ma<Tab>` → `yuangs macros`）
- 补全命令参数（`yuangs ai --mo<Tab>` → `yuangs ai --model`）
- 补全自定义应用
- 补全 Macro 快捷指令

### 1.3 支持的 Shell

- ✅ Bash（包括 Ubuntu、Debian 等默认 Bash 的发行版）
- ✅ Zsh（macOS 默认 Shell、Oh My Zsh）

---

## 2. Shell 补全基础原理

### 2.1 Bash 补全机制

Bash 使用 `complete` 内置命令注册补全函数：

```bash
# 注册补全函数
complete -F _function_name command_name
#          ↑ 补全函数名      ↑ 要补全的命令

# 示例
complete -F _yuangs_completion yuangs
```

**当用户按下 Tab 键时**：

```bash
用户输入: yuangs ma<Tab>
           ↓
Bash 检测 Tab 键
           ↓
Bash 查找 yuangs 对应的补全函数: _yuangs_completion
           ↓
调用 _yuangs_completion() 并传入环境变量
           ↓
补全函数返回建议列表到 COMPREPLY 数组
           ↓
Bash 显示建议
```

### 2.2 Bash 提供的环境变量

| 变量名 | 类型 | 说明 |
|---------|------|------|
| `COMP_WORDS` | 数组 | 命令行按空格分割的数组 |
| `COMP_CWORD` | 数字 | 当前光标所在的单词索引（从 0 开始）|
| `COMP_LINE` | 字符串 | 完整的命令行 |
| `COMP_POINT` | 数字 | 光标位置 |

**示例**:

```bash
# 用户输入
yuangs ai --mo

# Bash 提供的环境变量
COMP_WORDS=(yuangs ai --mo)    # 数组: [yuangs, ai, --mo]
COMP_CWORD=2                     # 当前在第 3 个单词（索引 2）
COMP_LINE="yuangs ai --mo"        # 完整命令行
COMP_POINT=14                    # 光标在位置 14
cur="--mo"                       # 当前单词（推导得出）
prev="ai"                        # 前一个单词（推导得出）
```

### 2.3 Zsh 补全机制

Zsh 使用 `_command` 命名约定：

```bash
# 定义补全函数（_ 前缀表示补全函数）
_yuangs() {
    # 补全逻辑
}

# 注册补全
#compdef _yuangs yuangs
```

**Zsh 提供的环境变量**:

| 变量名 | 类型 | 说明 |
|---------|------|------|
| `CURRENT` | 数字 | 当前光标位置 |
| `words` | 数组 | 命令行单词数组 |
| `_compadd` | 函数 | 添加补全建议 |
| `_describe` | 函数 | 显示命令描述 |

### 2.4 补全函数的基本结构

**Bash 补全函数模板**:

```bash
_yuangs_completion() {
    local cur prev words cword
    
    # 初始化补全
    _init_completion || return
    
    # 获取当前输入的单词
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    # 根据位置决定补全策略
    if [[ $COMP_CWORD -eq 1 ]]; then
        # 补全命令名
        COMPREPLY=($(compgen -W "ai list macros ..." -- "$cur"))
    else
        # 补全子命令或参数
        case "${prev}" in
            ai)
                COMPREPLY=($(compgen -W "--model --exec" -- "$cur"))
                ;;
            *)
                ;;
        esac
    fi
}

# 注册补全
complete -F _yuangs_completion yuangs
```

---

## 3. yuangs 补全架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                   Shell 层                       │
│  ┌──────────┐          ┌──────────┐              │
│  │  Bash    │          │   Zsh    │              │
│  └────┬─────┘          └────┬─────┘              │
│       │                     │                     │
└───────┼─────────────────────┼─────────────────────┘
        │                     │
        └──────────┬──────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              补全脚本（生成时写入）               │
│  ┌──────────────────────────────────────────┐      │
│  │ ~/.bash_completion.d/yuangs-completion.bash  │      │
│  │ 或 ~/.zfunctions/_yuangs               │      │
│  └──────────────┬─────────────────────────────┘      │
└─────────────────┼───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              yuangs CLI 层                       │
│  ┌──────────────────────────────────────────┐      │
│  │  cli.ts                                │      │
│  │  ├── completion 命令                   │      │
│  │  ├── _complete_subcommand 命令          │      │
│  │  └── _describe 命令                   │      │
│  └──────────────┬───────────────────────────┘      │
└─────────────────┼───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│          completion.ts 核心模块                    │
│  ┌──────────────────────────────────────────┐      │
│  │  getAllCommands()                      │      │
│  │    ├── 从 Commander 获取命令            │      │
│  │    ├── 加载自定义应用                  │      │
│  │    └── 加载 Macros                   │      │
│  └──────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────┐      │
│  │  getCommandSubcommands()               │      │
│  │    ├── 获取子命令                    │      │
│  │    └── 获取参数和选项                │      │
│  └──────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────┐      │
│  │  generateBashCompletion()              │      │
│  │  generateZshCompletion()               │      │
│  └──────────────────────────────────────────┘      │
└─────────────────┼───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│               配置和数据层                          │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────┐│
│  │ Commander   │  │  apps.json   │  │ macros   ││
│  │  命令注册  │  │  自定义应用  │  │ 快捷指令  ││
│  └─────────────┘  └──────────────┘  └─────────┘│
└─────────────────────────────────────────────────────────┘
```

### 3.2 设计原则

1. **静态 + 动态混合**
   - 命令名：静态生成（快速）
   - 子命令：动态调用（灵活）

2. **自动生成**
   - 从 Commander 实例自动提取命令
   - 无需手动维护命令列表

3. **可扩展**
   - 新增命令自动纳入补全
   - 支持自定义应用和 Macros

4. **跨平台**
   - 同时支持 Bash 和 Zsh
   - 自动检测当前 Shell 类型

---

## 4. 核心实现详解

### 4.1 completion.ts 模块

#### 4.1.1 获取所有命令

```typescript
export function getAllCommands(program: Command): string[] {
    const commands: string[] = [];
    
    // 1. 从 Commander 获取已注册的命令
    program.commands.forEach(cmd => {
        if (cmd.name()) {
            commands.push(cmd.name());
        }
        // 添加命令别名
        if (cmd.aliases()) {
            commands.push(...cmd.aliases());
        }
    });
    
    // 2. 加载自定义应用
    try {
        const apps = loadAppsConfig();
        Object.keys(apps).forEach(app => {
            if (!commands.includes(app)) {
                commands.push(app);
            }
        });
    } catch {
        // 配置加载失败时静默处理
    }
    
    // 3. 加载 Macro 快捷指令
    try {
        const macros = getMacros();
        Object.keys(macros).forEach(macro => {
            if (!commands.includes(macro)) {
                commands.push(macro);
            }
        });
    } catch {
        // 宏加载失败时静默处理
    }
    
    // 4. 去重并排序
    return [...new Set(commands)].sort();
}
```

**输出示例**:

```bash
[
  "ai", "dict", "find-big", "list", "macros",
  "ny", "pong", "shici", "tn"
]
```

#### 4.1.2 获取子命令和参数

```typescript
export function getCommandSubcommands(program: Command, commandName: string): string[] {
    const command = program.commands.find(cmd => cmd.name() === commandName);
    if (!command) return [];
    
    const subcommands: string[] = [];
    
    // 获取子命令
    command.commands.forEach(cmd => {
        if (cmd.name()) {
            subcommands.push(cmd.name());
        }
    });
    
    // 获取命令选项（如 --model, -e 等）
    command.options.forEach(opt => {
        opt.flags.split(/[, ]+/).forEach(flag => {
            if (flag.startsWith('--')) {
                subcommands.push(flag);
            } else if (flag.startsWith('-')) {
                subcommands.push(flag);
            }
        });
    });
    
    return [...new Set(subcommands)].sort();
}
```

**输入**: `getCommandSubcommands(program, 'ai')`

**输出**:

```bash
[
  "-e", "-f", "-l", "-m", "-p", "-w",
  "--exec", "--model", "--verbose", "--with-content"
]
```

#### 4.1.3 生成 Bash 补全脚本

```typescript
export function generateBashCompletion(program: Command): string {
    const commands = getAllCommands(program);
    
    return `#!/bin/bash
# yuangs bash completion

_yuangs_completion() {
    local cur prev words cword
    _init_completion || return
    
    # 补全命令名（第一个单词）
    if [[ \${COMP_CWORD} -eq 1 ]]; then
        COMPREPLY=($(compgen -W '${commands.join(' ')}' -- "\${cur}"))
        return
    fi
    
    # 补全子命令和参数（第二个及以后的单词）
    local cmd="\${words[1]}"
    case "\${cmd}" in
        ${commands.map(cmd => `
        ${cmd})
            case "\${prev}" in
                -m|--model)
                    COMPREPLY=($(compgen -W "gemini-2.5-flash-lite gemini-2.5-pro" -- "\${cur}"))
                    ;;
                *)
                    COMPREPLY=($(compgen -W "$(yuangs _complete_subcommand ${cmd})" -- "\${cur}"))
                    ;;
            esac
            ;;
        `).join('\n')}
        
        *)
            ;;
    esac
}

complete -F _yuangs_completion yuangs
`;
}
```

**生成的脚本片段**:

```bash
yuangs_completion() {
    local cur prev words cword
    _init_completion || return
    
    # 补全命令名
    if [[ ${COMP_CWORD} -eq 1 ]]; then
        COMPREPLY=($(compgen -W 'ai dict list macros pong shici' -- "${cur}"))
        return
    fi
    
    # 补全子命令
    local cmd="${words[1]}"
    case "${cmd}" in
        ai)
            case "${prev}" in
                -m|--model)
                    COMPREPLY=($(compgen -W "gemini-2.5-flash-lite gemini-2.5-pro" -- "${cur}"))
                    ;;
                *)
                    COMPREPLY=($(compgen -W "$(yuangs _complete_subcommand ai)" -- "${cur}"))
                    ;;
            esac
            ;;
        
        *)
            ;;
    esac
}

complete -F _yuangs_completion yuangs
```

#### 4.1.4 生成 Zsh 补全脚本

```typescript
export function generateZshCompletion(program: Command): string {
    const commands = getAllCommands(program);
    
    return `#compdef yuangs
# yuangs zsh completion

_yuangs() {
    local -a commands
    commands=(
${commands.map(cmd => `        '${cmd}:$(yuangs _describe ${cmd})'`).join('\n')}
    )
    
    if (( CURRENT == 2 )); then
        _describe 'command' commands
    else
        local cmd="\${words[2]}"
        case "\${cmd}" in
${commands.map(cmd => `
            ${cmd})
                _values 'options' $(yuangs _complete_subcommand ${cmd})
                ;;
        `).join('\n')}
            *)
                ;;
        esac
    fi
}

_yuangs
`;
}
```

### 4.2 CLI 命令注册

在 `src/cli.ts` 中注册三个命令：

#### 4.2.1 completion 命令

```typescript
program
    .command('completion [shell]')
    .description('生成并安装 Shell 补全脚本')
    .action(async (shell) => {
        const shellType = shell || process.env.SHELL?.split('/').pop() || 'bash';
        
        if (!['bash', 'zsh'].includes(shellType)) {
            console.log(chalk.red('错误: 不支持的 shell 类型'));
            console.log(chalk.gray('支持的类型: bash, zsh'));
            process.exit(1);
        }
        
        console.log(chalk.cyan(`\n正在为 ${shellType} 安装 yuangs 补全...\n`));
        
        let success = false;
        if (shellType === 'bash') {
            success = await installBashCompletion(program);
        } else if (shellType === 'zsh') {
            success = await installZshCompletion(program);
        }
        
        if (success) {
            console.log(chalk.green('✓ 补全安装成功！\n'));
            console.log(chalk.yellow('请重新加载 shell 配置:'));
            console.log(chalk.gray(`  ${shellType === 'bash' ? 'source ~/.bashrc' : 'source ~/.zshrc'}\n`));
        } else {
            console.log(chalk.red('✗ 补全安装失败\n'));
            process.exit(1);
        }
    });
```

#### 4.2.2 _complete_subcommand 命令（内部）

```typescript
program
    .command('_complete_subcommand <command>')
    .description('(内部命令) 获取子命令或参数')
    .action((command) => {
        const subcommands = getCommandSubcommands(program, command);
        console.log(subcommands.join(' '));
    });
```

这个命令用于动态获取子命令列表。

#### 4.2.3 _describe 命令（内部）

```typescript
program
    .command('_describe <command>')
    .description('(内部命令) 获取命令描述')
    .action((command) => {
        const description = getCommandDescription(program, command);
        console.log(description);
    });
```

### 4.3 安装补全脚本

#### 4.3.1 Bash 安装

```typescript
export async function installBashCompletion(program: Command): Promise<boolean> {
    const bashrcPath = path.join(process.env.HOME || '', '.bashrc');
    const bashCompletionDir = path.join(process.env.HOME || '', '.bash_completion.d');
    
    try {
        // 1. 创建目录
        if (!fs.existsSync(bashCompletionDir)) {
            fs.mkdirSync(bashCompletionDir, { recursive: true });
        }
        
        // 2. 写入补全脚本
        const completionPath = path.join(bashCompletionDir, 'yuangs-completion.bash');
        const completionScript = generateBashCompletion(program);
        
        fs.writeFileSync(completionPath, completionScript, { mode: 0o644 });
        
        // 3. 在 .bashrc 中添加 source 命令
        const sourceLine = `# yuangs completion
if [ -f ~/.bash_completion.d/yuangs-completion.bash ]; then
    source ~/.bash_completion.d/yuangs-completion.bash
fi
`;
        
        let bashrc = '';
        if (fs.existsSync(bashrcPath)) {
            bashrc = fs.readFileSync(bashrcPath, 'utf-8');
        }
        
        if (!bashrc.includes('yuangs-completion.bash')) {
            fs.appendFileSync(bashrcPath, `\n${sourceLine}`);
        }
        
        return true;
    } catch (error) {
        console.error('安装 Bash 补全失败:', error);
        return false;
    }
}
```

**文件位置**: `~/.bash_completion.d/yuangs-completion.bash`

**配置追加到**: `~/.bashrc`

#### 4.3.2 Zsh 安装

```typescript
export async function installZshCompletion(program: Command): Promise<boolean> {
    const zshrcPath = path.join(process.env.HOME || '', '.zshrc');
    const zfuncDir = path.join(process.env.HOME || '', '.zfunctions');
    
    try {
        // 1. 创建目录
        if (!fs.existsSync(zfuncDir)) {
            fs.mkdirSync(zfuncDir, { recursive: true });
        }
        
        // 2. 写入补全脚本
        const completionPath = path.join(zfuncDir, '_yuangs');
        const completionScript = generateZshCompletion(program);
        
        fs.writeFileSync(completionPath, completionScript, { mode: 0o644 });
        
        // 3. 在 .zshrc 中添加 fpath
        let zshrc = '';
        if (fs.existsSync(zshrcPath)) {
            zshrc = fs.readFileSync(zshrcPath, 'utf-8');
        }
        
        const fpathLine = 'fpath=(~/.zfunctions $fpath)';
        const autoloadLine = 'autoload -U compinit && compinit';
        
        if (!zshrc.includes('fpath=')) {
            fs.appendFileSync(zshrcPath, `\n${fpathLine}`);
        }
        
        if (!zshrc.includes('autoload -U compinit')) {
            fs.appendFileSync(zshrcPath, `\n${autoloadLine}`);
        }
        
        return true;
    } catch (error) {
        console.error('安装 Zsh 补全失败:', error);
        return false;
    }
}
```

**文件位置**: `~/.zfunctions/_yuangs`

**配置追加到**: `~/.zshrc`

---

## 5. 完整流程图

### 5.1 安装流程

```
用户执行: yuangs completion bash
          ↓
cli.ts 调用 installBashCompletion(program)
          ↓
installBashCompletion() 执行:
  ├─ 1. 创建 ~/.bash_completion.d/ 目录
  ├─ 2. generateBashCompletion(program)
  │      ├─ getAllCommands(program)
  │      │   ├─ 从 Commander 获取: [ai, list, ...]
  │      │   ├─ 从 apps.json 加载: [shici, dict, ...]
  │      │   └─ 从 macros 加载: [deploy, test, ...]
  │      ├─ 去重并排序
  │      └─ 生成 Bash 脚本字符串
  ├─ 3. 写入脚本到 ~/.bash_completion.d/yuangs-completion.bash
  ├─ 4. 在 ~/.bashrc 添加 source 命令
  └─ 5. 提示用户执行 source ~/.bashrc
          ↓
用户执行: source ~/.bashrc
          ↓
Shell 加载补全脚本，注册 _yuangs_completion 函数
          ↓
完成！补全功能可用
```

### 5.2 补全触发流程（命令名补全）

```
用户输入: yuangs ma<Tab>
          ↓
Shell 检测 Tab 键
          ↓
Shell 查找已注册的补全函数
          ↓
调用 _yuangs_completion()
          ↓
Bash 设置环境变量:
  COMP_WORDS=(yuangs ma)
  COMP_CWORD=1
  cur="ma"
  prev="yuangs"
          ↓
判断: COMP_CWORD == 1? → 是
          ↓
执行命令名补全逻辑:
  COMPREPLY=($(compgen -W 'ai dict list macros ...' -- "ma"))
          ↓
compgen 过滤:
  输入: "ma"
  候选: ai dict list macros ...
  匹配: macros
          ↓
Shell 显示补全建议:
  yuangs macros
          ↓
用户按 Tab 接受
          ↓
补全完成: yuangs macros
```

### 5.3 补全触发流程（子命令补全）

```
用户输入: yuangs ai --mo<Tab>
          ↓
Shell 调用 _yuangs_completion()
          ↓
Bash 设置环境变量:
  COMP_WORDS=(yuangs ai --mo)
  COMP_CWORD=2
  cur="--mo"
  prev="ai"
          ↓
判断: COMP_CWORD == 1? → 否
          ↓
进入子命令补全逻辑:
  local cmd="ai"
  case "$cmd" in
      ai)
          case "$prev" in
              -m|--model)
                  # 特殊处理 model 参数
                  COMPREPLY=(gemini-2.5-flash-lite gemini-2.5-pro)
                  ;;
              *)
                  # 调用 yuangs 命令动态获取
                  COMPREPLY=($(yuangs _complete_subcommand ai))
                  ;;
          esac
          ;;
  esac
          ↓
yuangs _complete_subcommand ai 被执行
          ↓
getCommandSubcommands(program, 'ai') 返回:
  [
    "--exec", "--model", "--verbose", "--with-content",
    "-e", "-f", "-l", "-m", "-p", "-w"
  ]
          ↓
Shell 在补全脚本中执行:
  COMPREPLY=($(compgen -W "--exec --model ..." -- "--mo"))
          ↓
compgen 过滤:
  输入: "--mo"
  候选: --exec --model --verbose ...
  匹配: --model
          ↓
Shell 显示补全建议:
  yuangs ai --model
          ↓
补全完成
```

---

## 6. 关键技术细节

### 6.1 静态补全 vs 动态补全

#### 静态补全（命令名）

```bash
# 在生成补全脚本时硬编码
COMPREPLY=($(compgen -W 'ai list macros ...' -- "$cur"))
```

**优点**:
- ⚡ 快速：不需要启动 Node.js 进程
- 🪶 轻量：纯 Shell 脚本

**缺点**:
- ❌ 需要重新安装才能更新命令列表

#### 动态补全（子命令）

```bash
# 运行时调用 yuangs 命令
COMPREPLY=($(compgen -W "$(yuangs _complete_subcommand $cmd)" -- "$cur"))
```

**优点**:
- ✅ 灵活：始终获取最新子命令
- ✅ 可扩展：支持配置文件变化

**缺点**:
- ⏱️ 较慢：需要启动 Node.js 进程

#### 混合策略

yuangs 采用了混合策略：
- **命令名**：静态补全（快速）
- **子命令**：动态补全（灵活）

### 6.2 compgen 函数

`compgen` 是 Bash 内置的补全生成工具：

```bash
compgen [选项] 单词列表 [-- 前缀]
```

**常用选项**:

| 选项 | 说明 |
|------|------|
| `-W` | 指定单词列表 |
| `-P` | 指定路径前缀 |
| `-d` | 使用目录作为单词源 |

**示例**:

```bash
# 基本用法
compgen -W "apple banana cherry" -- "ba"
# 输出: banana

# 模拟补全
COMPREPLY=($(compgen -W "ai list macros" -- "$cur"))
```

### 6.3 文件位置和 XDG 规范

#### Bash 补全文件位置

**XDG Base Directory 规范**:

```bash
~/.bash_completion.d/  # Bash 补全目录
```

**优点**:
- 符合 Linux 标准
- 自动被 Bash 加载
- 不污染主配置文件

#### Zsh 补全文件位置

```bash
~/.zfunctions/_command_name
```

**fpath 变量**:

```bash
fpath=(~/.zfunctions $fpath)
```

**autoload 命令**:

```bash
autoload -U compinit && compinit
```

加载 Zsh 补全系统。

### 6.4 补全脚本生成时机

| 策略 | 生成时机 | 优点 | 缺点 |
|------|---------|------|------|
| **安装时生成** | `yuangs completion bash` | 快速、不频繁调用 | 配置变化需重新安装 |
| **运行时生成** | 每次按 Tab | 始终最新 | 补全响应慢 |
| **混合** | 命令名静态、子命令动态 | 兼顾性能和灵活性 | 实现复杂 |

yuangs 采用**混合策略**。

---

## 7. 测试与验证

### 7.1 手动测试 Bash 补全

```bash
# 模拟 Bash 环境
export COMP_WORDS=(yuangs ma)
export COMP_CWORD=1
export cur="ma"

# 执行补全逻辑
commands="ai list macros shici dict pong"
COMPREPLY=($(compgen -W "$commands" -- "$cur"))

echo "补全建议: ${COMPREPLY[@]}"
# 输出: 补全建议: macros
```

### 7.2 测试子命令补全

```bash
# 模拟
export COMP_WORDS=(yuangs ai --mo)
export COMP_CWORD=2
export prev="ai"
export cur="--mo"

# 调用 yuangs 命令
subcmds=$(yuangs _complete_subcommand ai)

# 过滤
COMPREPLY=($(compgen -W "$subcmds" -- "$cur"))

echo "补全建议: ${COMPREPLY[@]}"
# 输出: 补全建议: --model
```

### 7.3 实际使用测试

```bash
# 安装补全
yuangs completion bash
source ~/.bashrc

# 测试命令名补全
yuangs ma<Tab>           # 应补全为: yuangs macros
yuangs shi<Tab>          # 应补全为: yuangs shici

# 测试参数补全
yuangs ai --mo<Tab>      # 应补全为: yuangs ai --model
yuangs ai -<Tab>         # 应显示所有短选项

# 测试自定义应用补全
yuangs di<Tab>           # 应补全为: yuangs dict（如果配置了）

# 测试 Macro 补全
yuangs dep<Tab>          # 应补全为: yuangs deploy（如果配置了）
```

---

## 8. 常见问题

### Q1: 补全不生效怎么办？

**A**: 检查以下几点：

```bash
# 1. 确认补全脚本已安装
ls ~/.bash_completion.d/yuangs-completion.bash

# 2. 确认配置文件已添加
grep yuangs-completion ~/.bashrc

# 3. 重新加载配置
source ~/.bashrc

# 4. 检查补全函数已注册
complete -p | grep yuangs
```

### Q2: 如何查看生成的补全脚本？

**A**:

```bash
# Bash
cat ~/.bash_completion.d/yuangs-completion.bash

# Zsh
cat ~/.zfunctions/_yuangs
```

### Q3: 如何临时禁用补全？

**A**:

```bash
# Bash
complete -r yuangs

# 重新启用
source ~/.bash_completion.d/yuangs-completion.bash
```

### Q4: 如何调试补全脚本？

**A**:

```bash
# Bash: 启用调试
set -x
yuangs ma<Tab>    # 会显示补全脚本的执行过程
set +x            # 关闭调试

# 手动测试补全函数
_yuangs_completion    # 直接调用补全函数
echo "${COMPREPLY[@]}"  # 查看补全建议
```

### Q5: 如何添加自定义补全规则？

**A**: 修改 `src/core/completion.ts` 中的生成函数：

```typescript
export function generateBashCompletion(program: Command): string {
    // 在生成的脚本中添加自定义逻辑
    return `#!/bin/bash
_yuangs_completion() {
    # 自定义补全逻辑
    case "\${cmd}" in
        my-custom-cmd)
            COMPREPLY=($(compgen -W "option1 option2" -- "\${cur}"))
            ;;
    esac
}
...
`;
}
```

然后重新安装补全：

```bash
yuangs completion bash
source ~/.bashrc
```

---

## 总结

yuangs 的 Tab 补全功能通过以下方式实现：

1. **Shell 补全机制**: 利用 Bash/Zsh 的补全 API
2. **自动生成脚本**: 从 Commander 实例提取命令信息
3. **混合策略**: 静态补全命令名 + 动态补全子命令
4. **多源数据**: Commander + 配置文件 + Macros
5. **一键安装**: `yuangs completion` 命令自动配置

**核心优势**:
- ⚡ 快速响应（静态补全）
- 🎯 精准匹配（compgen）
- 🔌 可扩展（自动纳入新命令）
- 🌐 跨平台（Bash + Zsh）

---

**相关文件**:
- `src/core/completion.ts` - 补全核心模块
- `src/cli.ts` - 命令注册
- `~/.bash_completion.d/yuangs-completion.bash` - Bash 补全脚本
- `~/.zfunctions/_yuangs` - Zsh 补全脚本

**参考文档**:
- [Bash 官方补全文档](https://www.gnu.org/software/bash/manual/html_node/Programmable-Completion-Builtins.html)
- [Zsh 补全指南](http://zsh.sourceforge.net/Doc/Release/User/Completion.html)
