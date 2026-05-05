# 优化日志

历史优化报告已归档至 Git 提交记录中。如需查看：

```bash
git log --oneline -- docs/ | grep -i 'optim\|review\|fix\|capab\|model\|govern\|impl\|progress\|eval\|audit\|agent'
git checkout backup/docs-before-trim -- docs/architecture/archived/  # 恢复完整文件
```

## 历史主题

| 主题 | 关键词 | 相关提交 |
|------|--------|----------|
| Capability Pipeline | pipeline, capability | 修复能力管线、降级策略 |
| Model Router | model router, adapter | 多模型适配、策略路由 |
| Governance / ReAct Loop | governance, react | 治理优先循环、沙箱 |
| 整体优化 | optimization, P0, P1 | 性能、稳定性、用户体验 |
| Code Review | review, fix | 审查修复、代码质量 |
| AI 交互 | AI, context | 交互模式、上下文管理 |

> 详细报告可在 `backup/docs-before-trim` 分支查看。
