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

```bash
yuangs ai "用 Python 写个 Hello World" --model gemini-pro-latest
```

### 交互模式（v1.1.x）

直接输入不带问题的 `ai` 命令，会进入交互式问答模式：

```bash
yuangs ai
# 进入后直接输入问题，每次回车提问一次，按 Ctrl+C 退出
```

## 应用列表
以下是 CLI 中可以通过相应命令直接打开的应用程序链接：

古诗词 PWA: https://wealth.want.biz/shici/index.html

英语词典: https://wealth.want.biz/pages/dict.html

Pong 游戏: https://wealth.want.biz/pages/pong.html

## 近期主要更新日志

### v1.3.6 (2025-11-29)

*   **新增** AI 命令交互模式：直接输入 `yuangs ai` 即可进入一问一答模式，无需每次输入问题，quit或exit可退出。
*   **新增** AI 命令模型参数 `-m` 简写：支持 `-m <模型名称>` 代替 `--model <模型名称>`。
*   **新增** `help` 命令显示仓库地址：方便用户直接访问项目仓库。
*   **优化** AI 请求错误提示：在处理 AI 请求出错时，提供更清晰的错误信息。

### v1.1.x (之前版本，主要更新点)

*   **新增** `ai` 命令：集成 AI 问答功能 (`yuangs ai "你的问题"`)。
*   **新增** `help` 命令显示当前版本号：方便用户了解工具版本。
*   **优化** AI 请求加载动画：在请求过程中显示加载动画和已耗时秒数，并在请求结束后显示总耗时。

## 维护者

@yuanguangshan