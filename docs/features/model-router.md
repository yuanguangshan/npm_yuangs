# 多模型路由系统

yuangs 的 AI 模型自适应选择与路由。

## 命令

```bash
yuangs router list            # 查看所有可用模型
yuangs router exec "任务"      # 自动选择最佳模型
yuangs router stats           # 使用统计
yuangs router test <model>    # 测试模型连通性
yuangs router config show     # 查看配置
yuangs router config enable/disable <model>
yuangs router config map <task> <model>
```

## 支持的适配器

| 适配器 | 依赖 | 说明 |
|--------|------|------|
| `qwen` | qwen CLI | 阿里通义千问 |
| `codebuddy` | CodeBuddy CLI | 代码专用模型 |
| `google-gemini` | gcloud CLI | Google Gemini |
| `yuangs` | yuangs 内置 | 默认代理 |

## 路由策略

- **任务类型映射**: code_generation → codebuddy, translation → qwen
- **自适应权重**: 根据历史表现动态调整（`src/core/modelRouter/AdaptiveWeights.ts`）
- **多指标监督**: 延迟、成本、准确率（`MultiMetricSupervisor.ts`）
- **上下文管理**: 自动管理 token 预算（`ContextManager.ts`）

## 架构

```
ModelRouter.ts
  └─ BaseAdapter (抽象基类)
       ├─ QwenAdapter
       ├─ CodebuddyAdapter
       ├─ GoogleAdapter
       └─ YuangsAdapter
  ├─ ModelSupervisor (监督)
  ├─ AdaptiveWeights (权重)
  └─ Config (配置)
```

详见源码：`src/core/modelRouter/`
