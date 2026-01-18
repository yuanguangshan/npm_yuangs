基于最新的代码库（v2.15.0），`yuangs` 已经演变成一个具备 Agent 能力的智能终端工具。

以下是核心命令、特殊语法及功能的完整列表说明：

### 1. 核心 CLI 命令 (Entry Points)
这些是在终端直接运行的命令。

| 命令格式 | 功能简述 | 详细说明 |
| :--- | :--- | :--- |
| **`yuangs ai "[问题]"`** | **AI 问答/聊天** | 启动交互式 AI 聊天界面。如果带参数则直接回答。支持流式 Markdown 渲染。 |
| **`yuangs ai -e "[需求]"`** | **Shell 命令生成** | 根据自然语言生成 Linux 命令。AI 会分析当前 OS 环境，生成最安全的命令，**需用户确认后执行**。 |
| **`yuangs ai -w`** | **带上下文问答** | (With Content) 读取管道输入(`stdin`)或当前目录文件作为上下文发送给 AI。 |
| **`yuangs history`** | **命令历史** | 查看 AI 生成并执行过的命令历史。使用 `-l` 可快速执行上一条命令。 |
| **`yuangs list`** | **应用列表** | 列出配置文件中定义的常用 Web 应用快捷方式。 |
| **`yuangs shici`** | **快捷应用** | (示例) 直接打开配置中名为 `shici` 的 Web 应用。 |

---

### 2. 特殊语法与上下文指令 (Magic Syntax)
这些指令可以在 `yuangs ai` 的交互模式中使用，也可以作为 CLI 参数传递。

| 语法格式 | 功能类别 | 核心逻辑与用途 |
| :--- | :--- | :--- |
| **`@filename`** | **文件引用** | 读取文件全量内容作为 AI 上下文。行为：**只读**。 |
| **`@file:10-20`** | **行号引用** | **精准读取**。只读取指定行号范围的内容作为上下文，用于 Code Review 或定位 Bug。 |
| **`@!script.sh`** | **执行并捕获** | **立即执行**脚本，并将 **[源码 + 标准输出 + 标准错误]** 组合打包发给 AI。用于排查报错。 |
| **`#directory`** | **目录引用** | 递归扫描目录结构及文件列表（不含内容）作为上下文。用于架构分析。 |
| **`:exec <cmd>`** | **原子执行** | **完全绕过 AI**。直接调用系统 Shell 执行命令，不生成建议，不进入上下文。用于确定的脚本执行。 |

---

### 3. 交互式管理命令 (Interactive Management)
只能在 `yuangs ai` 进入交互模式后使用的命令。

| 命令 | 功能 | 说明 |
| :--- | :--- | :--- |
| **`:ls`** | **列出上下文** | 显示当前缓冲区中已加载的文件、目录或执行日志列表。 |
| **`:cat [N]`** | **查看内容** | 查看缓冲区中第 N 个项目的具体内容。不带参数则查看全部。 |
| **`:clear`** | **清空上下文** | 清空内存和磁盘缓存(`.ai/context.json`)中的所有上下文。 |
| **`/clear`** | **清空历史** | 清空当前的对话历史记录（Memory）。 |
| **`:plugins`** | **插件列表** | 查看已加载的 Shell 补全插件。 |

---

### 4. 宏与配置 (Macros & Config)
用于个性化定制工具行为。

| 命令 | 功能 | 说明 |
| :--- | :--- | :--- |
| **`yuangs save <name>`** | **保存宏** | 将输入的命令保存为快捷指令。使用 `-l` 可直接保存上一条 AI 生成的命令。 |
| **`yuangs run <name>`** | **运行宏** | 执行已保存的快捷指令。 |
| **`yuangs macros`** | **查看宏** | 列出所有已保存的快捷指令。 |
| **`yuangs config set <k> <v>`** | **修改配置** | 设置全局配置，如 `defaultModel` (模型) 或 `aiProxyUrl` (接口地址)。 |
| **`yuangs config list`** | **查看配置** | 显示当前的配置文件内容。 |

---

### 5. 高级能力与调试 (Capabilities)
用于调试 Capability System 和 Agent 行为。

| 命令 | 功能 | 说明 |
| :--- | :--- | :--- |
| **`yuangs capabilities match`** | **模型匹配测试** | 测试给定的能力需求（如 `reasoning`）会匹配到哪个 AI 模型。 |
| **`yuangs capabilities history`** | **执行记录** | 查看 Agent 的决策历史、Token 消耗和执行结果。 |
| **`yuangs capabilities replay`** | **回放执行** | 根据 ID 重新运行某次历史执行（用于调试 Prompt 或模型行为）。 |
| **`yuangs capabilities list`** | **能力列表** | 列出系统支持的所有原子能力（如 `code_generation`, `long_context`）。 |

### 总结：心智模型

1.  **AI 辅助**：用 `yuangs ai`，你需要思考，AI 给你建议。
2.  **上下文注入**：用 `@` (读文件) 和 `#` (读目录) 显式告诉 AI 读什么。
3.  **故障排查**：用 `@!` 让 AI 看着代码跑一遍，分析报错。
4.  **纯执行**：用 `:exec` 把它当普通终端用，AI 靠边站。
5.  **技能进化**：你用得越多，Agent 会通过 `skills.ts` 记住你的高频操作模式。

基于代码实现（`handleAtomicExec` 函数中使用了 `child_process.spawn` 并开启了 `shell: true`），`:exec` 的支持范围非常广泛。

**一句话总结：**:exec <cmd> **支持当前操作系统 Shell 能运行的所有命令**。

它不是由 `yuangs` 内部实现的有限指令集，而是直接将命令“透传”给底层的系统 Shell（如 `/bin/sh`, `/bin/zsh`, `cmd.exe`）。

以下是细分的支持列表和说明：

### 1. 系统二进制程序 (System Binaries)
只要在你的系统 `$PATH` 环境变量里的工具，都可以运行。
*   **文件操作**: `ls`, `cat`, `grep`, `find`, `rm`, `cp`, `mv`, `chmod`, `chown`
*   **网络工具**: `curl`, `wget`, `ping`, `ssh`, `telnet`, `nslookup`
*   **系统监控**: `ps`, `top`, `df`, `du`, `free`

### 2. 开发语言与包管理器 (Dev Tools)
*   **语言运行时**: `node`, `python`, `python3`, `ruby`, `go`, `java`
*   **包管理/构建**: `npm`, `yarn`, `pnpm`, `cargo`, `maven`, `gradle`, `pip`
*   **版本控制**: `git status`, `git pull`, `git log`

### 3. 脚本文件 (Scripts)
支持执行本地脚本，且支持相对路径和绝对路径。
*   **Shell 脚本**: `:exec ./scripts/deploy.sh`
*   **Python 脚本**: `:exec python src/main.py`
*   **Makefile**: `:exec make build`

### 4. 复杂的 Shell 语法 (Advanced Syntax)
由于开启了 `shell: true`，你可以使用 Shell 的原生特性：
*   **管道 (Pipes)**: `:exec cat error.log | grep "Error" | wc -l`
*   **重定向 (Redirection)**: `:exec echo "hello" > test.txt`
*   **逻辑运算符**: `:exec npm install && npm run build`
*   **后台运行**: `:exec nohup node server.js &`

### 5. 交互式终端应用 (TUI Apps)
由于配置了 `stdio: 'inherit'`，`yuangs` 会将输入输出流完全接管给子进程，因此支持全屏交互程序（这在很多 CLI 包装器中通常不支持）：
*   **编辑器**: `:exec vim config.json`, `:exec nano .env`
*   **监控**: `:exec htop`
*   **REPL**: `:exec python`, `:exec node` (进入交互式编程环境)

---

### ⚠️ 限制与注意事项 (Limitations)

虽然支持广泛，但由于它是作为**子进程 (Child Process)** 运行的，有以下物理限制：

1.  **`cd` 命令无效 (上下文隔离)**
    *   **现象**: `:exec cd ..` 执行后，你会发现目录并没有改变。
    *   **原因**: `cd` 只会改变子 Shell 的目录，子 Shell 执行完退出后，`yuangs` 主进程的目录保持不变。
    *   **解决**: 只能在 `:exec` 内部临时改变，例如 `:exec cd src && ls`。

2.  **环境变量导出不持久**
    *   **现象**: `:exec export KEY=value`
    *   **原因**: 环境变量只在子 Shell 生命周期内有效，不会影响 `yuangs` 后续的命令。

3.  **Shell 别名 (Aliases)**
    *   **现象**: 你在 `.zshrc` 里定义的 `alias ll='ls -l'` 可能无法使用。
    *   **原因**: Node.js 调用的通常是非交互式 (non-interactive) Shell，默认不加载用户配置文件（如 `.bashrc` 或 `.zshrc`），除非显式指定（如 `bash -i -c ...`）。

### 场景对比

| 命令 | 行为 | 适用场景 |
| :--- | :--- | :--- |
| **`ls -la`** (直接输入) | 触发 `yuangs ai` 流程，AI 可能会解释这个命令，或把它当作 Prompt。 | 当你需要 AI 解释命令含义时。 |
| **`ai -e "ls -la"`** | AI 思考后生成 `ls -la`，并询问你是否执行。 | 当你不确定具体命令怎么写时。 |
| **`:exec ls -la`** | **立即、直接、无脑执行**。不经过 AI，不产生 Prompt Token。 | 当你非常确定命令是安全的，只想把它当终端用时。 |