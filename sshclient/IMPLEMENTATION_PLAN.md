# yuangs SSH 智能终端 - 实施计划

## 项目愿景
将 yuangs 从本地 CLI 工具演进为具备 AI 治理能力的 SSH 智能终端,实现"带 AI 审计的零信任堡垒机"。

## 核心架构层级

### ✅ L0-L1: 执行安全层 (已完成)
- WASM/VFS 隔离
- 不可越权、不可越狱、不可偷传

### 🔄 L2: 因果可追溯层 (进行中)
**目标**: 所有 SSH 操作 100% 可审计、可拒绝、可回放

#### 核心组件:
1. **SSHSession** - PTY 代理
2. **InputBuffer** - 命令边界探测
3. **GovernedExecutor** - 治理拦截器
4. **Recorder** - 录像机 (.yuangs.cast 格式)
5. **ReplayEngine** - 回放引擎

### 🔄 L3: 经验学习层 (进行中)
**目标**: 从 GOOD/BAD 标记自动生成治理策略

#### 核心组件:
1. **CausalAnchor** - 因果锚点
2. **ReviewAgent** - 复盘分析
3. **PolicyCompiler** - 策略编译器

### 🔄 L4: 防止因果僵死层 (进行中)
**目标**: 系统不会被恐惧锁死

#### 核心机制:
1. **Policy Half-life** - 指数衰减
2. **Risk Band** - 风险区间 (CRITICAL/CAUTION/EXPLORABLE/STALE)
3. **Exploratory Allow** - 探索性放行 + 回弹

### 📋 L5: 勇气管理层 (待实现)
**目标**: AI 具备"免疫系统"般的动态平衡能力

#### 核心能力:
1. 记忆激活 (Initial Penalty)
2. 记忆衰减 (Decay)
3. 受控探索 (Exploration)
4. 失败回弹 (Rebound)

### 📋 L6: 人类可感知层 (待实现)
**目标**: 通过可视化让人类理解并校准 AI 心理状态

#### 核心界面:
1. **Governance Dashboard** - 治理仪表盘
   - HeaderVitalSigns - 勇气指数/风险预算
   - RiskHeatmap - 风险力场热力图
   - CausalEventStream - 因果事件流
   - ProjectionLab - What-If 模拟器

2. **Human Override** - 人类介入点
   - FORCE_ALLOW - 临时越权
   - FORCE_DENY - 即刻冻结
   - ADJUST_DECAY - 调整衰减速度

### ⏸️ L7: 价值系统层 (暂不实现)
**目标**: 多目标效用博弈 (稳定性/成本/速度/风险)

⚠️ 此层涉及决策责任、组织价值、人类授权边界,需谨慎进入

---

## 实施阶段

### 🎯 阶段 P0: MVP - AI 代理转发 (当前阶段)

#### 目标
实现一个简单的 `yuangs ssh user@host`,AI 能感知远程环境并给出建议

#### 核心任务
1. ✅ 引入 SSH2 协议栈
2. ✅ 虚拟终端 (PTY) 集成
3. ✅ 治理拦截器挂钩
4. ⏳ 命令边界识别与拦截
5. ⏳ 基础审计日志

#### 技术栈
- `ssh2` - SSH 协议实现
- `node-pty` - 伪终端
- 现有 GovernanceService

#### 验收标准
- [ ] 能够建立 SSH 连接
- [ ] 所有命令经过治理层
- [ ] 能拦截危险命令 (如 `rm -rf /`)
- [ ] 基础审计日志记录

---

### 🎯 阶段 P1: 交互式 UI

#### 目标
集成 xterm.js,实现基础的终端打字和颜色显示

#### 核心任务
1. xterm.js 渲染引擎集成
2. AI 侧边栏/浮窗设计
3. 本地/远程上下文同步
4. 特殊命令处理 (sudo/su)

#### 技术栈
- `xterm.js` - 终端渲染
- `xterm-addon-fit` - 自适应
- `xterm-addon-web-links` - 链接支持

---

### 🎯 阶段 P2: 治理升级

#### 目标
实现针对 SSH 命令的拦截、审计和 Policy 校验

#### 核心任务
1. sudo/su 提权状态机
2. 密码流保护 (SensitiveStreamInterceptor)
3. 远程意图仿真 (Remote Dry Run)
4. 会话审计与重放 (.yuangs.cast)

#### 关键设计
- **提权状态机**: USER → AWAITING_APPROVAL → PENDING_PWD → ROOT
- **密码脱敏**: 密码输入阶段不进入 AI/审计
- **因果锚点**: 每个命令关联 reasoning_id

---

### 🎯 阶段 P3: 技能跨端迁移

#### 目标
让本地学习到的代码技能可以在远程服务器上一键应用

#### 核心任务
1. Skill Library 远程执行
2. 环境差异检测
3. 自动依赖安装
4. 执行结果验证

---

## 当前优先级 (按紧急程度排序)

### 🔴 必须做 (不做会出事)

1. **Governance 可视化** (L6 第一块)
   - 状态: 未做 | 优先级: 最高
   - 原因: 人类无法看见系统的"心理状态"

2. **Human Override** (人类介入点)
   - 状态: 未做 | 优先级: 最高
   - 原因: 系统"想歪"时无法干预

3. **SSH 行为分级白名单**
   - 状态: 半完成 | 优先级: 高
   - 原因: 操作语义分级不够细

### 🟡 应该做 (不做会被限制扩展)

4. **探索失败的软惩罚**
   - 状态: 未做 | 优先级: 中高
   - 原因: 防止 AI "学不会疼"

5. **影子执行 (Dry Run / Shadow Exec)**
   - 状态: 未完全 | 优先级: 中
   - 原因: 风险判断从"猜"升级为"算"

### ⚪ 可以做,但现在别急 (高风险)

6. **价值权重 (L7)**
   - 状态: 明确未进入 | 现在不建议
   - 原因: 系统会"选边站",需承担责任

7. **多 Agent 协商**
   - 状态: 概念阶段 | 现在不要碰
   - 原因: 会引爆复杂度

---

## 下一步行动 (最安全路径)

### 如果只做 3 件事:

1. ✅ **Governance Dashboard** (能看见)
2. ✅ **Human Override** (能管住)
3. ✅ **SSH 行为 + 环境分级** (不误伤)

完成这三件后,才真正拥有这套系统,而不是被它牵着走。

---

## 技术债务与风险

### 已知风险
1. **延迟与流截断**: SSH 是流式协议,AI 需要完整上下文
   - 解决方案: 旁路监控 + 关键节点同步拦截

2. **Policy Drift**: 多个 BAD 规则叠加导致过度保守
   - 解决方案: 权重衰减 + 探索性放行

3. **远程上下文同步**: AI 不知道远程机器状态
   - 解决方案: Shadow Sync + RemoteContextStore

### 技术选型
- ✅ SSH2 vs OpenSSH: 选择 ssh2 (Node.js 原生)
- ✅ PTY: node-pty
- ✅ 录像格式: NDJSON (兼容 asciinema)
- ✅ 前端: React + TailwindCSS

---

## 参考资料

- [Terminus](https://github.com/Eugeny/tabby) - 现代终端参考
- [asciinema](https://asciinema.org/) - 录像格式参考
- [xterm.js](https://xtermjs.org/) - 终端渲染引擎

---

## 更新日志

- 2026-01-25: 创建实施计划文档
- 待补充...
