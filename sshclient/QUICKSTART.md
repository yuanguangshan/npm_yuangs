# yuangs SSH 快速开始

## 5 分钟上手

### 1. 安装

确保你已经安装了 yuangs:

```bash
npm install -g yuangs
```

或者在本地开发:

```bash
cd /Users/ygs/ygs/npm_yuangs
npm run build
npm link
```

### 2. 第一次连接

最简单的方式:

```bash
yuangs ssh user@hostname
```

系统会自动尝试:
1. 使用 `~/.ssh/id_rsa` 私钥
2. 如果没有私钥,会提示输入密码

### 3. 体验治理功能

连接成功后,尝试执行一个危险命令:

```bash
$ rm -rf /tmp/test
```

你会看到:
- ✅ 安全命令: 直接执行
- ⚠️ 可疑命令: 显示风险提示
- 🚫 危险命令: 被拦截并显示原因

### 4. 测试 sudo

```bash
$ sudo systemctl restart nginx
```

系统会:
1. 评估 sudo 命令的风险
2. 如果允许,进入密码输入阶段
3. 密码输入不会被记录或分析
4. 成功后进入 ROOT 状态

### 5. 配置常用服务器

创建配置文件 `~/.yuangs/ssh_config.json`:

```json
{
  "hosts": {
    "dev": {
      "host": "dev.example.com",
      "username": "developer",
      "privateKey": "/Users/you/.ssh/id_rsa"
    },
    "prod": {
      "host": "prod.example.com",
      "username": "admin",
      "privateKey": "/Users/you/.ssh/prod_key"
    }
  }
}
```

然后直接使用:

```bash
yuangs ssh dev
yuangs ssh prod
```

## 常见问题

### Q: 如何退出 SSH 会话?

A: 按 `Ctrl+C` 或输入 `exit`

### Q: 支持哪些认证方式?

A: 
- 私钥认证 (推荐)
- 密码认证
- 支持 passphrase 保护的私钥

### Q: 治理规则可以自定义吗?

A: 当前版本使用内置规则,未来版本将支持自定义 Policy

### Q: 密码安全吗?

A: 
- ✅ 密码不会被 AI 分析
- ✅ 密码不会被记录到日志
- ✅ 密码不会出现在回放中
- ✅ 使用 SSH2 加密传输

### Q: 可以同时连接多个服务器吗?

A: 当前版本每次只能连接一个,未来将支持多标签

## 下一步

- 查看 [完整文档](./README.md)
- 了解 [实施计划](./IMPLEMENTATION_PLAN.md)
- 阅读 [详细设计](./todo.md)

## 反馈

如有问题或建议,请提交 Issue!
