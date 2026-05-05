# Tab 补全功能

yuangs 支持 Shell Tab 命令补全，覆盖所有子命令、配置项和应用快捷方式。

## 安装

```bash
# Bash
yuangs completion >> ~/.bashrc

# Zsh
yuangs completion >> ~/.zshrc

# Fish
yuangs completion fish > ~/.config/fish/completions/yuangs.fish
```

## 支持范围

| 类型 | 示例 |
|------|------|
| 子命令 | `ai`, `git`, `config`, `registry`, `router` |
| 配置项 | `set model`, `get accountType`, `list` |
| 应用快捷方式 | `shici`, `dict`, `pong` |
| Git 分支 | `git checkout <branch>` |
| 文件路径 | `@<file>` 补全 |

## 实现

底层基于 `src/core/completion/` 模块：
- `builtin.ts` — 内置命令补全表
- `resolver.ts` — 动态解析（分支、文件路径）
- `cache.ts` — 补全结果缓存
- `index.ts` — 入口，生成 Shell 脚本

## 自定义

在配置文件中添加 `apps` 条目即可自动加入补全候选：

```json
{ "apps": { "myapp": "https://example.com" } }
```
