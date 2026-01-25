# yuangs SSH 智能终端

## 概述

yuangs SSH 是一个具备 AI 治理能力的 SSH 客户端,实现了"带 AI 审计的零信任堡垒机"。

## 核心特性

### ✅ 已实现 (P0 MVP)

1. **SSH 连接管理**
   - 支持密码和私钥认证
   - PTY (伪终端) 模式
   - 窗口尺寸自适应
   - 信号处理 (Ctrl+C 等)

2. **命令治理**
   - 所有命令经过治理层审查
   - 危险命令自动拦截
   - sudo/su 提权状态机
   - 密码流保护 (不进入 AI/审计)

3. **安全特性**
   - 命令边界识别
   - 实时风险评估
   - 治理决策可视化

### 🔄 进行中

- 审计日志 (.yuangs.cast 格式)
- 回放引擎
- 因果锚点 (Causal Anchor)
- 策略学习 (Policy Learning)

### 📋 待实现

- Governance Dashboard (治理仪表盘)
- Human Override (人类介入点)
- 探索性放行 (Exploratory Allow)
- 勇气管理 (Courage Management)

## 使用方法

### 基本连接

```bash
# 使用用户名@主机格式
yuangs ssh user@hostname

# 指定端口
yuangs ssh user@hostname:2222
yuangs ssh user@hostname -p 2222

# 使用私钥
yuangs ssh user@hostname -i ~/.ssh/id_rsa

# 使用密码 (不推荐)
yuangs ssh user@hostname --password yourpassword
```

### 配置文件

创建 `~/.yuangs/ssh_config.json`:

```json
{
  "hosts": {
    "myserver": {
      "host": "192.168.1.100",
      "port": 22,
      "username": "admin",
      "privateKey": "/Users/you/.ssh/id_rsa"
    },
    "prod-web": {
      "host": "prod-web-01.example.com",
      "port": 22,
      "username": "deploy",
      "privateKey": "/Users/you/.ssh/deploy_key"
    }
  }
}
```

然后可以直接使用:

```bash
yuangs ssh myserver
yuangs ssh prod-web
```

## 治理功能

### 危险命令拦截

以下命令会被自动拦截:

- `rm -rf /` - 删除根目录
- `dd if=... of=/dev/...` - 写入设备
- `mkfs` - 格式化
- Fork bomb 等

示例:

```bash
$ yuangs ssh user@host

[ssh] connected to host

$ rm -rf /

🚫 [GOVERNANCE BLOCK]
   Reason: Detected potentially destructive command
   Risk Level: R3
   Impact: This command could cause irreversible system damage
```

### sudo/su 提权管理

提权状态机:

```
USER → AWAITING_APPROVAL → PENDING_PWD → ROOT
```

- **USER**: 普通用户状态
- **AWAITING_APPROVAL**: 等待治理审批
- **PENDING_PWD**: 密码输入阶段 (不记录)
- **ROOT**: 已获得 Root 权限

密码保护:
- 密码输入阶段不进入 AI 分析
- 密码不会被记录到审计日志
- 密码不会出现在回放中

## 架构设计

### 核心组件

```
┌─────────────────────────────────────────┐
│          User / Terminal                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         InputBuffer                     │
│  (命令边界探测)                          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    SSHGovernedExecutor                  │
│  (治理拦截器)                            │
│  - sudo/su 状态机                        │
│  - 密码流保护                            │
│  - 风险评估                              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       GovernanceService                 │
│  (治理服务)                              │
│  - 危险命令检测                          │
│  - 策略评估                              │
│  - 风险披露                              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         SSHSession                      │
│  (PTY 代理)                              │
│  - SSH 连接管理                          │
│  - 窗口管理                              │
│  - 信号处理                              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       Remote Server                     │
└─────────────────────────────────────────┘
```

### 数据流

```
字符输入 → InputBuffer → 命令识别
                            │
                            ▼
                    完整命令?
                    │       │
                   否       是
                    │       │
                    ▼       ▼
                直接透传  治理评估
                    │       │
                    │       ▼
                    │   允许/拒绝
                    │       │
                    └───────┴→ SSH Session → 远程执行
```

## 安全保证

### 密码零泄露

✅ 密码永不进入:
- AI Planner
- Governance Policy
- Audit Log
- Replay 数据

### AI 明确知道

✅ AI 能感知:
- 什么时候在申请提权
- 什么时候已经是 Root
- 什么时候提权失败

### 可审计性

✅ 所有操作:
- 100% 可审计
- 100% 可拒绝
- 100% 可回放 (密码除外)

## 开发路线图

### 阶段 P0: MVP ✅
- [x] SSH 连接管理
- [x] 命令边界识别
- [x] 基础治理拦截
- [x] sudo/su 状态机
- [x] 密码流保护

### 阶段 P1: 交互式 UI
- [ ] xterm.js 集成
- [ ] AI 侧边栏
- [ ] 本地/远程上下文同步

### 阶段 P2: 治理升级
- [ ] 审计日志 (.yuangs.cast)
- [ ] 回放引擎
- [ ] 因果锚点
- [ ] 策略学习

### 阶段 P3: 技能迁移
- [ ] Skill Library 远程执行
- [ ] 环境差异检测
- [ ] 自动依赖安装

## 技术栈

- **SSH 协议**: ssh2
- **语言**: TypeScript
- **CLI 框架**: Commander.js
- **未来 UI**: xterm.js (计划中)

## 参考资料

- [实施计划](./IMPLEMENTATION_PLAN.md)
- [详细设计](./todo.md)
- [Terminus](https://github.com/Eugeny/tabby) - 现代终端参考
- [asciinema](https://asciinema.org/) - 录像格式参考

## 贡献

欢迎提交 Issue 和 Pull Request!

## 许可证

ISC
