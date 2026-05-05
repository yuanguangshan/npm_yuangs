# 配置指南

`yuangs` 支持 **JSON** 和 **YAML** 两种配置文件格式。配置文件位于项目根目录或用户主目录。

## 文件格式

### JSON

```json
{
  "shici": "https://wealth.want.biz/shici/index.html",
  "dict": "https://wealth.want.biz/pages/dict.html",
  "pong": "https://wealth.want.biz/pages/pong.html",
  "github": "https://github.com",
  "calendar": "https://calendar.google.com",
  "mail": "https://mail.google.com",
  "aiProxyUrl": "https://aiproxy.want.biz/v1/chat/completions",
  "defaultModel": "Assistant",
  "accountType": "free"
}
```

完整示例：[yuangs.config.example.json](yuangs.config.example.json)

### YAML

```yaml
shici: "https://wealth.want.biz/shici/index.html"
dict: "https://wealth.want.biz/pages/dict.html"
pong: "https://wealth.want.biz/pages/pong.html"
github: "https://github.com"
calendar: "https://calendar.google.com"
mail: "https://mail.google.com"

# AI Configuration
aiProxyUrl: "https://aiproxy.want.biz/v1/chat/completions"
defaultModel: "Assistant"
accountType: "free"
```

完整示例：[yuangs.config.example.yaml](yuangs.config.example.yaml)

## 配置项说明

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `shici` | string | - | 诗词页面 URL |
| `dict` | string | - | 词典页面 URL |
| `pong` | string | - | Pong 游戏页面 URL |
| `github` | string | - | GitHub 快捷链接 |
| `calendar` | string | - | 日历快捷链接 |
| `mail` | string | - | 邮件快捷链接 |
| `aiProxyUrl` | string | - | AI 代理 API 地址 |
| `defaultModel` | string | - | 默认 AI 模型 |
| `accountType` | string | `free` | 账户类型（`free` / `pro`） |

## 使用 `config` 命令

```bash
# 查看当前配置
yuangs config

# 设置配置项
yuangs config set aiProxyUrl "https://your-proxy/v1/chat/completions"

# 获取单个配置项
yuangs config get defaultModel
```

详见 [config-commands.md](config-commands.md)。
