# yuangs CLI

🎨 苑广山的个人命令行工具  
一个 **集工具启动器 + AI 助手 + 命令增强器** 于一体的 CLI。

> 设计理念：  
> **AI 提供思路，人类掌控执行。**  
> 快、顺手，但不过度“自动化”。

---

## 你可以用 yuangs 做什么？

- 🚀 一条命令快速打开常用 Web / PWA 应用
- 🤖 在终端里直接使用 AI 问答、分析、总结
- 🧠 让 AI **帮你写命令**，而不是直接替你乱跑命令
- 🧩 把常用的复杂操作保存为快捷指令（Macros）
- 🔗 用管道把真实命令输出交给 AI 解释

yuangs 更像是一个**“增强型命令行外脑”**，而不是黑箱自动执行器。

---

## 安装

```bash
npm install -g yuangs
```

安装完成后可直接使用：

```bash
yuangs help
```

---

## 基本使用命令

```bash
yuangs shici              # 打开古诗词 PWA
yuangs dict               # 打开英语词典
yuangs pong               # 打开 Pong 游戏
yuangs ai "你的问题"       # ✨ 向 AI 提问
yuangs list               # 列出所有应用/链接
yuangs help               # 显示帮助
```

---

## AI 功能（核心能力）

### ✅ 1️⃣ 直接提问（最安全、零副作用）

```bash
yuangs ai "李白是谁？"
```

- 仅进行问答
- 不生成系统命令
- 适合解释、学习、方案讨论

---

### ✅ 2️⃣ 指定模型

支持使用 `--model` / `-m`，也支持简写：

| 简写 | 实际模型 |
|----|----|
| `-p` | `gemini-pro-latest` |
| `-f` | `gemini-flash-latest` |
| `-l` | `gemini-flash-lite-latest` |
| `-w` | 智能读取文件内容（管道模式） |

```bash
yuangs ai "用 Python 写个 Hello World" -p
cat file.txt | yuangs -p "分析这个文件"
ls | yuangs -w "分析目录下的文件"
```

---

### ✅ 3️⃣ 交互模式（连续对话）

```bash
yuangs ai
```

在交互模式中你可以：

- 连续提问，不必重复输入命令
- `/clear`：清空当前对话上下文
- `/history`：查看本次会话历史
- `exit` / `quit`：退出
- `@`：显示当前目录文件列表并选择
- `# 目录路径`：读取指定目录下所有文件内容

适合 **长思路推理、一步步讨论问题**。

#### 文件引用功能（v1.3.67+）

**使用 `@` 快速选择文件**：

```bash
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
```

**使用 `#` 读取整个目录**：

```bash
你：# src/commands 分析这些命令的功能
✓ 已读取 3 个文件

# AI 会看到 src/commands 下所有文件的内容并进行分析
```

非常适合代码审查、项目分析等场景。

---

### ✅ 4️⃣ 命令生成模式（`-e`）

让 AI **帮你写 Linux / macOS 命令**，但由你决定是否执行。

```bash
yuangs ai -e "查看当前目录下大于 100M 的文件"
```

流程说明：

1. AI 生成命令  
   `find . -type f -size +100M`
2. 自动复制到剪贴板
3. 预填到输入行
4. **你确认后才会执行**

👉 这是 **“命令辅助”**，不是黑箱自动执行。

---

### ✅ 5️⃣ 管道模式（Pipe Mode）

把真实命令输出交给 AI 分析、解释、总结：

```bash
cat error.log | yuangs ai "解释这个报错"
ls -la | yuangs ai "帮我总结这些文件"
```

**省略 'ai' 关键字**（v1.3.66+）：

```bash
cat file.txt | yuangs "解释这个文件"
git diff | yuangs "review这个代码变更"
```

**智能文件内容读取**（v1.3.66+）：

```bash
ls | yuangs -w "分析这个目录"
ls *.ts | yuangs -w "解释这些文件的功能"
```

非常适合：
- 看不懂的日志
- 太长的输出
- CI / build 报错分析

---

### ✅ 6️⃣ 流式输出 + Markdown 渲染

- 默认流式输出（打字机效果）
- 自动渲染 Markdown
- 代码高亮 / 表格格式化

终端体验尽量对齐 ChatGPT 网页版。

---

### ✅ 7️⃣ Shell 交互式命令（v2.10.0+）

yuangs 现在是一个**智能 Shell 内核**，融合了 AI 对话和命令执行能力。

#### 🎯 智能模式检测

yuangs 会根据你的输入自动判断执行模式：

```bash
你：ls                # → 命令执行（fish-style，无前缀）
你：$ pwd              # → 命令执行（显式 $ 前缀）
你：! whoami          # → 命令执行（显式 ! 前缀）
你：@src/index.ts     # → 文件引用
你：#src             # → 目录引用
你：explain this code # → AI 对话
```

#### ✨ Tab 补全功能

##### 文件 / 目录补全
```bash
你：@src/<Tab>
# 显示：
@src/commands/
@src/core/
@src/agent/
@src/cli.ts

你：#src/<Tab>
# 显示：
#src/commands/
#src/core/
#src/agent/
```

##### 命令补全（PATH 自动扫描 + Shell 内置命令）

**内置命令列表**（v2.11.0+）：
- `cd`, `pwd`, `ls`, `mkdir`, `rmdir`, `rm`, `cp`, `mv`, `cat`
- `echo`, `grep`, `find`, `head`, `tail`, `less`, `more`
- `chmod`, `chown`, `touch`, `ln`, `df`, `du`, `free`
- `ps`, `top`, `kill`, `killall`, `bg`, `fg`, `jobs`
- `export`, `unset`, `env`, `alias`, `unalias`
- `history`, `type`, `which`, `whereis`, `man`
- `sleep`, `wait`, `date`, `cal`, `uptime`, `uname`
- `tar`, `gzip`, `gunzip`, `zip`, `unzip`
- `curl`, `wget`, `ssh`, `scp`, `rsync`

```bash
你：gi<Tab>
# 显示：
git
gio
ginstall-info

你：c<Tab>
# 显示：
cd, cp, cat, chmod, chown, cal, curl, ccr, claude, codebuddy...

你：l<Tab>
# 显示：
ls, less, ln, litellm, litellm-proxy, ldattach, ldconfig, ldconfig.real, locale-gen, logrotate...
```

##### 参数补全（git 等）
```bash
你：git <Tab>
# 显示子命令：
add, branch, checkout, commit, diff, log, merge, pull, push, status...

你：git checkout <Tab>
# 显示分支：
main, develop, feature/xxx...
```

##### 文件行号补全
```bash
你：@src/index.ts:<Tab>
# 显示：
@src/index.ts:1
@src/index.ts:10
@src/index.ts:20
@src/index.ts:50
@src/index.ts:100
```

##### 项目感知（Monorepo 优先级）
补全时会优先显示项目结构：
```
src/
packages/
apps/
lib/
components/
```

#### 🚀 命令执行

##### fish-style 无前缀（推荐）
```bash
你：ls -la
你：git status
你：npm run dev
```
直接输入命令，无需任何前缀，yuangs 自动识别并执行。

##### 显式前缀
```bash
你：$ pwd            # 显示当前目录
你：! whoami         # 显示当前用户
```

##### 失败处理
```bash
你：ls_not_exist
# 输出：
[Command Error]: Command failed: ls_not_exist
[command exited with code 127]
```
失败时不崩溃，直接返回提示。

#### 👻 Ghost Text（幽灵建议）

输入时自动显示灰色建议，按 Tab 或 → 接受：

```bash
你：git ch
# 灰色显示：git ch eckout
你：<Tab>
# 变成：
你：git checkout

你：npm r
# 灰色显示：npm r un dev
你：<Tab>
# 变成：
你：npm run dev
```

支持的场景：
- `git ch` → `checkout`
- `git st` → `atus`
- `git co` → `mmit`
- `npm r` → `un dev`
- `npm b` → `uild`

#### 📜 命令历史

```bash
你：↑           # 向上浏览历史命令
你：↓           # 向下浏览历史命令
你：Ctrl+R       # 反向搜索历史
```

#### 🔌 插件系统

创建自定义补全插件：

```bash
# 创建插件目录
mkdir -p .shell/plugins
```

##### 插件接口
```ts
// .shell/plugins/docker.ts
module.exports = {
    command: 'docker',
    complete(args, context) {
        // args: ['docker', 'ps', ...]
        // context: { cwd, projectRoot }
        if (args.length <= 1) {
            return ['ps', 'run', 'build', 'exec'];
        }
        if (args[1] === 'run') {
            return ['-d', '-p', '--rm', '--name'];
        }
        return [];
    }
};
```

##### 使用插件
```bash
你：docker <Tab>
# 显示：
ps, run, build, exec

你：docker run <Tab>
# 显示：
-d, -p, --rm, --name
```

##### 查看已加载插件
```bash
你：:plugins
已加载的插件:
  - docker
  - kubectl
```

#### 📋 内置命令

| 命令 | 功能 |
|----|----|
| `:ls` | 列出当前上下文 |
| `:clear` | 清空上下文（含持久化） |
| `:plugins` | 列出已加载的 Shell 插件 |
| `/clear` | 清空对话历史 |
| `/history` | 查看本次会话历史 |
| `exit` / `quit` / `bye` | 退出交互模式 |

#### 💡 使用场景示例

##### 场景 1：快速查看 git 状态
```bash
你：git st<Tab>
# 自动补全为：
你：git status

[执行结果：显示 git 状态]
```

##### 场景 2：引用代码文件 + AI 分析
```bash
你：@src/index.ts:<Tab>
# 补全为：
你：@src/index.ts:42

# AI 看到第 42 行内容

你：解释这段代码的功能
# AI 分析代码...
```

##### 场景 3：查看项目结构 + npm 启动
```bash
你：#src/<Tab>
# 浏览目录结构...

你：npm ru<Tab>
# 补全为：
你：npm run dev

[执行：启动开发服务器]
```

##### 场景 4：混合使用（命令 + AI）
```bash
你：ls -la
[显示文件列表]

你：分析上面的文件结构
[AI 分析项目结构...]
```

#### 🎓 工作流程示例

```bash
# 1. 进入交互模式
yuangs ai

# 2. 查看项目结构
你：ls
[文件列表]

# 3. 添加文件上下文
你：@src/index.ts
✅ 已加入文件上下文: src/index.ts

# 4. 让 AI 分析
你：这个文件主要做什么？
[AI 分析...]

# 5. 运行测试
你：npm test
[运行测试...]

# 6. 根据结果让 AI 解释错误
你：上面的错误是什么意思？
[AI 解释...]

# 7. 退出
你：exit
```

---

## 快捷指令（Macros）

把常用但冗长的命令保存为一个名字。

### 创建快捷指令

```bash
yuangs save deploy
# 输入：
# npm run build && git add . && git commit -m "deploy" && git push
```

### 执行快捷指令

```bash
yuangs run deploy
```

### 查看所有指令

```bash
yuangs macros
```

✅ 非常适合：
- 发布流程
- 项目初始化
- 重复性高但不想记的命令

---

## 配置管理

```bash
yuangs config defaultModel Assistant
yuangs config accountType pro
```

常用配置项：

- `defaultModel`：默认 AI 模型
- `aiProxyUrl`：自定义 AI 接口
- `accountType`：`free` / `pro`

---

## 内置应用列表

```text
shici  → https://wealth.want.biz/shici/index.html
dict   → https://wealth.want.biz/pages/dict.html
pong   → https://wealth.want.biz/pages/pong.html
```

---

## 自定义应用（v1.3.24+）

无需改代码，只需配置文件。

### 示例 `.yuangs.json`

```json
{
  "github": "https://github.com",
  "calendar": "https://calendar.google.com",
  "mail": "https://mail.google.com"
}
```

然后直接使用：

```bash
yuangs github
yuangs calendar
yuangs mail
```

支持 JSON / YAML，多级优先级（项目级 / 用户级）。

---

## 近期主要更新

### v1.3.67 (2026-01-17)

- ✅ 新增 `@` 符号：快速选择当前目录文件
- ✅ 新增 `#` 符号：读取指定目录下所有文件内容
- ✅ 交互模式增强：支持文件和目录引用

### v1.3.66 (2026-01-17)

- ✅ 管道模式省略 `ai` 关键字：`cat file | yuangs "question"`
- ✅ 智能文件内容读取：新增 `-w` 参数自动读取文件内容
- ✅ 完整的管道模式选项支持：`-p`, `-f`, `-l`, `-e`, `-w`

### v1.3.38 (2026-01-16)

- ✅ 快捷指令系统（save / run / macros）
- ✅ 管道模式（Pipe）
- ✅ AI 流式输出 + Markdown 渲染
- ✅ `config` 命令
- ✅ 命令生成模式增强（剪贴板 + 预填）


### v1.3.22 (2025-11-30)
- **新增** AI 命令支持 `-p` `-f` `-l` 简写，快速选择gemini默认模型

### v1.3.6 (2025-11-29)

- **新增** AI 命令交互模式：直接输入 `yuangs ai` 即可进入一问一答模式，无需每次输入问题，quit 或 exit 可退出。
- **新增** AI 命令模型参数 `-m` 简写：支持 `-m <模型名称>` 代替 `--model <模型名称>`。
- **新增** `help` 命令显示仓库地址：方便用户直接访问项目仓库。
- **优化** AI 请求错误提示：在处理 AI 请求出错时，提供更清晰的错误信息。

### v1.1.x (之前版本，主要更新点)

- **新增** `ai` 命令：集成 AI 问答功能 (`yuangs ai "你的问题"`)。
- **新增** `help` 命令显示当前版本号：方便用户了解工具版本。
- **优化** AI 请求加载动画：在请求过程中显示加载动画和已耗时秒数，并在请求结束后显示总耗时。
---

## 自动发布（CI/CD）

- push 到 `main`：
  - 自动 bump patch 版本
  - 自动打 tag
  - 自动 `npm publish --provenance`

✅ 日常开发只需关注代码本身。

---

## 开发与构建

```bash
npm install
npm run dev -- ai "你好"
npm run build
```

---

## 维护者


@yuanguangshan
