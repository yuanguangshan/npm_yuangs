# Capability Pipeline

版本 2.1.0 引入的 Agent Pipeline 架构。

## Pipeline 阶段

```
User Input → Intent Analysis → Context Assembly → Prompt Construction
    → Model Selection → LLM Execution → Result Interpretation → Action Execution
```

## 命令

```bash
yuangs config set pipeline on     # 启用管线模式
yuangs config set pipeline off    # 关闭
```

## 配置

在配置文件中添加：

```json
{ "pipeline": { "enabled": true, "stages": ["analyze", "context", "prompt", "select", "execute"] } }
```

## 源码

- `src/agent/AgentRuntime.ts` — 运行时
- `src/agent/executor.ts` — 执行器
- `src/agent/modelRouterIntegration.ts` — 模型集成
