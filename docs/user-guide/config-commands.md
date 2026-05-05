# 配置命令指南

## 基本命令

```bash
yuangs config              # 查看所有配置
yuangs config get <key>    # 获取单个配置
yuangs config set <key> <value>  # 设置配置
yuangs config list         # 列出所有配置
yuangs config reset        # 恢复默认
yuangs config setup        # 交互式设置
```

## 模型管理

```bash
yuangs config model                    # 查看当前默认模型
yuangs config model list               # 列出所有可用模型
yuangs config model set <model-name>   # 设置默认模型
```

## 配置存储

| 格式 | 路径 |
|------|------|
| JSON | `~/.yuangs/config.json` |
| YAML | `~/.yuangs/config.yaml` |

## 通用配置项

| 键 | 说明 |
|----|------|
| `defaultModel` | 默认 AI 模型 |
| `aiProxyUrl` | AI 代理地址 |
| `accountType` | 账户类型（free / pro） |
| `pipeline` | 管线模式（on / off） |

详见 [configuration.md](configuration.md)。
