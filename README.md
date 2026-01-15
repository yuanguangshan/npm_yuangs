# yuangs CLI

🎨 苑广山的个人命令行工具

## 安装

```bash
npm install -g yuangs
```

## 使用命令

```bash
yuangs shici             # 打开古诗词 PWA
yuangs dict              # 打开英语词典
yuangs pong              # 打开 Pong 游戏
yuangs ai "你的问题"      # ✨ 向 AI 提问 (v1.1.0 新增)
yuangs list              # 列出所有链接
yuangs help              # 显示帮助
```

## AI 功能示例 (v1.1.2)

直接提问：

```bash
yuangs ai "李白是谁？"
```

指定模型：

支持使用 `--model` 或 `-m` 指定模型，也支持以下简写：
- `-p`: `gemini-pro-latest` (Pro 版)
- `-f`: `gemini-flash-latest` (Flash 版)
- `-l`: `gemini-flash-lite-latest` (Lite 版)

```bash
yuangs ai "用 Python 写个 Hello World" -p
# 等同于 --model gemini-pro-latest
```

### 交互模式（v1.1.x）

直接输入不带问题的 `ai` 命令，会进入交互式问答模式：

```bash
yuangs ai
```

在交互模式中，你可以：
- 直接输入问题进行对话
- 输入 `/clear` 清空对话历史
- 输入 `/history` 查看对话历史
### 命令生成模式（v1.3.32）

使用 `-e` 参数让 AI 为你生成 Linux 命令：

```bash
yuangs ai -e "查看当前目录下大于100M的文件"
# 输出: > find . -type f -size +100M
```

## 应用列表

以下是 CLI 中可以通过相应命令直接打开的应用程序链接：

古诗词 PWA: https://wealth.want.biz/shici/index.html

英语词典: https://wealth.want.biz/pages/dict.html

Pong 游戏: https://wealth.want.biz/pages/pong.html

## 配置自定义应用 (v1.3.24)

从 v1.3.24 版本开始，您可以自定义应用列表，而无需修改源代码。

### 配置文件格式

创建一个 JSON 或 YAML 配置文件，支持以下格式之一：

1. `yuangs.config.json` - 项目级别的 JSON 配置文件
2. `.yuangs.json` - 项目级或用户主目录的 JSON 隐藏配置文件
3. `yuangs.config.yaml` - 项目级别的 YAML 配置文件
4. `yuangs.config.yml` - 项目级别的 YAML 配置文件
5. `.yuangs.yaml` - 项目级或用户主目录的 YAML 隐藏配置文件
6. `.yuangs.yml` - 项目级或用户主目录的 YAML 隐藏配置文件
7. `~/.yuangs.json` - 全局用户 JSON 配置文件
8. `~/.yuangs.yaml` - 全局用户 YAML 配置文件
9. `~/.yuangs.yml` - 全局用户 YAML 配置文件

配置文件示例：

```json
{
  "shici": "https://wealth.want.biz/shici/index.html",
  "dict": "https://wealth.want.biz/pages/dict.html",
  "pong": "https://wealth.want.biz/pages/pong.html",
  "github": "https://github.com",
  "calendar": "https://calendar.google.com",
  "mail": "https://mail.google.com"
}
```

### 配置文件优先级

配置文件按以下优先级顺序查找（高到低）：

1. 当前工作目录下的 `yuangs.config.json`
2. 当前工作目录下的 `.yuangs.json`
3. 用户主目录下的 `.yuangs.json`
4. 项目目录下的 `yuangs.config.json`
5. 项目目录下的 `.yuangs.json`
6. 如果没有配置文件，则使用默认应用列表

### 使用自定义应用

创建配置文件后，您可以使用任何定义的应用名称作为命令：

```bash
yuangs github      # 打开 GitHub
yuangs calendar    # 打开日历
yuangs mail        # 打开邮箱
```

使用 `yuangs list` 命令查看当前加载的所有应用。

## 近期主要更新日志

### v1.3.32 (2026-01-16)
- **新增** AI 命令生成模式：使用 `yuangs ai -e <描述>` 快速生成 Linux 命令。
- **优化** AI 接口升级：全面迁移至 OpenAI 兼容接口，提升稳定性。

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

## 自动发布（CI/CD）

本项目使用 GitHub Actions 实现了自动发布流程：

- 每次向 `main` 分支 `git push`：
  - 自动执行 `npm version patch`，提升补丁版本号（例如 `1.1.5 -> 1.1.6`）；
  - 自动生成对应的 Git tag（如 `v1.1.6`）并推送回仓库；
  - 自动运行 `npm publish --provenance` 发布到 npm。

这样日常开发只需要专注写代码和推送到 `main`，发布和版本管理都由 CI 自动完成。
本地开发前务必先：`git pull`，确保本地代码与远程仓库一致。

## 维护者

@yuanguangshan
