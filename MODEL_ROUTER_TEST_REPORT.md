# ModelRouter 策略引擎测试报告

## 1. 测试概览
- **测试时间**: 2026-01-27
- **测试目标**: 验证 ModelRouter 向“策略引擎”重构后的逻辑正确性、稳定性和性能。
- **测试范围**: 包含策略注册、Gate 过滤、多维度评分逻辑、统计信息回传以及 CLI 命令。
- **结论**: ✅ **通过全部测试项目**。

## 2. 测试环境
- **运行环境**: macOS / Node.js v22
- **依赖适配器**: Google Gemini (2.5), Qwen CLI (0.7.2), Codebuddy CLI (2.40.1)

## 3. 详细测试案例与结果

| 测试编号 | 项目名称 | 预期行为 | 实际结果 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| T01 | 策略注册验证 | 所有 4 种策略（Balanced, Cost-saving, Latency-critical, Quality-first）应正确加载。 | 已注册数量: 4 | ✅ 通过 |
| T02 | Balanced 逻辑 | 综合权衡任务匹配、延迟、成本。 | 成功分析评分权重，Gemini 与 Qwen 分数最高（0.88）。 | ✅ 通过 |
| T03 | Cost Saving 逻辑 | 优先选择低成本模型。 | 选定模型: qwen (成本等级 2)。 | ✅ 通过 |
| T04 | Latency Critical 逻辑 | 优先选择响应最快的模型。 | 选定模型: qwen (平均 1000ms)。 | ✅ 通过 |
| T05 | Quality First 逻辑 | 代码任务优先选择专家模型。 | 选定模型: codebuddy (具备 code-expert 能力)。 | ✅ 通过 |
| T06 | Gate 硬约束过滤 | 大上下文任务自动排除小容量模型。 | 请示 100k 上下文，小容量模型被有效隔离，仅留 Gemini/Codebuddy。 | ✅ 通过 |
| T07 | 统计信息联动 | 执行任务后 stats 自动更新，影响后续评分。 | 初始执行: 0，执行后: 1。 | ✅ 通过 |

## 4. CLI 命令覆盖测试
- `yuangs router policy list`: **成功**。正确列出策略并标记当前生效项。
- `yuangs router policy set <name>`: **成功**。配置持久化正常。
- `yuangs router stats`: **成功**。展示各模型最新状态。

## 5. 发现的问题与修复
- **问题**: 初始版本中，如果输出已经是纯 JSON，解析逻辑会跳过 `response` 字段提取。
  - **修复**: 修改了 `GoogleAdapter` 中的解析逻辑，强制对所有输出尝试 JSON 字段提取。
- **问题**: 自研测试脚本中统计信息对象引用导致比较逻辑失效。
  - **修复**: 修正测试脚本，采用值比较。

## 6. 后续建议
- 引入 **Failure Domain** 概念，增强多 Provider 情况下的跨域故障回退稳定性。
- 增加 **ε-greedy** 采样机制，在生产环境中主动探索表现提升的新模型。

---
*报告生成人: Antigravity*
