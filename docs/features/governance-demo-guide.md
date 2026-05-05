# 治理系统 Demo 指南

Code Change Governance 系统的快速演示流程。

## 完整工作流

```bash
# 1. 创建 patch
cat > /tmp/demo.patch << 'EOF'
diff --git a/src/example.ts b/src/example.ts
--- a/src/example.ts
+++ b/src/example.ts
@@ -1,3 +1,3 @@
 function example() {
-  console.log("old message");
+  console.log("updated message");
   return true;
 }
EOF

# 2. 提交审查
yuangs diff-edit propose /tmp/demo.patch --rationale "Update logging"

# 3. 查看待处理动作
yuangs diff-edit list

# 4. 审批（需确认 YES）
yuangs diff-edit approve <action-id>

# 5. 执行（自动快照 + 回滚保护）
yuangs diff-edit exec <action-id>

# 6. 查看状态
yuangs diff-edit status <action-id>
```

## 状态机

```
DRAFT → PROPOSED → APPROVED → EXECUTED
                    ↓
               [风险评级 + 人工确认]
                    ↓
               [快照 → 应用 → 验证 → 提交]
```

## 安全特性

| 特性 | 说明 |
|------|------|
| 快照回滚 | 执行前创建快照，失败自动恢复 |
| 原子写入 | 临时文件 + rename，防止数据损坏 |
| 状态机保护 | 非法转换被阻止 |
| 能力令牌 | HMAC-SHA256 签名，最小权限 |
| 风险评级 | LOW / MEDIUM / HIGH，基于行数和文件数 |

## 失败恢复

执行失败时自动回滚到快照：

```
[PROPOSED] → [APPROVED] → exec失败 → 回滚 → [REJECTED]
```

系统启动时审计，发现不一致状态需要人工介入。
