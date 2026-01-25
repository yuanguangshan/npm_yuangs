# yuangs SSH - 快速参考卡

## 🚀 快速开始

```bash
# 基本连接
yuangs ssh user@host

# 指定端口
yuangs ssh user@host:2222

# 使用私钥
yuangs ssh user@host -i ~/.ssh/id_rsa

# 使用密码 (不推荐)
yuangs ssh user@host --password yourpassword
```

## 📝 配置文件

`~/.yuangs/ssh_config.json`:
```json
{
  "hosts": {
    "dev": {
      "host": "dev.example.com",
      "username": "developer",
      "privateKey": "/Users/you/.ssh/id_rsa"
    }
  }
}
```

使用: `yuangs ssh dev`

## 🛡️ 治理功能

### 自动拦截的危险命令
- `rm -rf /` - 删除根目录
- `rm -rf /path` - 递归删除
- `dd if=... of=/dev/...` - 写入设备
- `mkfs` - 格式化
- Fork bomb

### 拦截示例
```bash
$ rm -rf /

🚫 [GOVERNANCE BLOCK]
   Reason: Detected potentially destructive command
   Risk Level: R3
   Impact: This command could cause irreversible system damage
```

## 🔐 安全特性

- ✅ 所有命令经过 AI 治理
- ✅ 危险命令自动拦截
- ✅ sudo/su 提权管理
- ✅ 密码不进入 AI/日志
- ✅ SSH2 加密传输

## 📚 文档

- [README.md](./README.md) - 完整文档
- [QUICKSTART.md](./QUICKSTART.md) - 快速开始
- [EXAMPLES.md](./EXAMPLES.md) - 使用示例
- [TEST_REPORT.md](./TEST_REPORT.md) - 测试报告

## 🧪 测试

```bash
# 运行测试脚本
./test_ssh.sh

# 运行演示
./demo_ssh.sh
```

## ⌨️ 常用命令

```bash
# 查看帮助
yuangs ssh --help

# 退出连接
exit
# 或按 Ctrl+C
```

## 🐛 故障排查

### 连接失败
```bash
# 检查主机可达性
ping host

# 检查端口
telnet host 22
```

### 认证失败
```bash
# 检查私钥权限
chmod 600 ~/.ssh/id_rsa

# 尝试密码认证
yuangs ssh user@host --password yourpassword
```

## 📊 状态

- **版本**: v3.46.0
- **状态**: P0 MVP 完成 ✅
- **测试**: 通过 ✅
- **生产就绪**: 测试环境可用 ⚠️

## 💡 提示

1. 优先使用私钥认证
2. 不要在命令行中使用密码
3. 使用配置文件管理多服务器
4. 定期查看文档更新

---

**快速帮助**: `yuangs ssh --help`
