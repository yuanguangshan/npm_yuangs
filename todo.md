> 📅 Updated by Yuangs Git Analysis at 2026/1/28 18:41
> 🎯 基于当前实现情况重新规划，简化为可执行的阶段性计划

---

## 📊 当前进度评估

**已实现功能（约40%）:**
- ✅ GitService - 完整的 Git 操作封装
- ✅ git plan - 双 AI 协作规划
- ✅ git review - 多级别代码审查
- ✅ git auto - 全自动工作流
- ✅ TodoManager - 任务管理与进度追踪
- ✅ ContextGatherer - 项目上下文采集
- ✅ CodeReviewer - AI 代码审查器

**待实现功能:**
- ❌ 能力分级系统（Capability + Degradation）
- ❌ Commit 语义解析（GitCommitParser）
- ❌ 审计元数据（ContextMeta）
- ❌ 安全扫描（SecurityScanner）
- ❌ 语义 Diff（SemanticDiffEngine）
- ❌ 演进分析（HotspotAnalyzer）

---

## 🎯 重新规划的阶段性计划

### P0 阶段（2-3周）- 基础能力建设
**目标：** 建立智能行为的基础框架，为所有后续功能提供能力等级和降级支持

#### 1. 能力分级模型
- [ ] `src/core/capability/CapabilityLevel.ts`
  - [ ] 定义 CapabilityLevel 枚举（SEMANTIC / STRUCTURAL / LINE / TEXT / NONE）
  - [ ] 实现能力单调性校验（确保 INTENT → NONE 递减）
  - [ ] 定义 MinCapability 接口

- [ ] `src/core/capability/DegradationPolicy.ts`
  - [ ] 实现 DegradationPolicy 接口
  - [ ] 定义 DecisionInput（time/memory/confidence）
  - [ ] 实现基于阈值的降级逻辑
  - [ ] 内置默认阈值表（TIME_LIMIT=30s, CONF_THRESHOLD=0.7）
  - [ ] 实现 fallbackChain 严格递减校验

- [ ] `src/core/capability/CostProfile.ts`
  - [ ] 实现 languageComplexity 计算
  - [ ] 内置语言权重表（C++/Go/TS/Python）
  - [ ] 简化版：基于文件扩展名估算

#### 2. 审计元数据
- [ ] `src/core/context/ContextMeta.ts`
  - [ ] 实现 ContextMeta Schema
  - [ ] confidence (0-1) 字段
  - [ ] confidenceReason 字段
  - [ ] provenance (source/ref/timeRange) 字段
  - [ ] clipped (reason/droppedItems) 字段（可选）
  - [ ] 实现 toAuditLog() 方法

- [ ] 重构 `src/core/git/ContextGatherer.ts`
  - [ ] 返回类型增加 ContextMeta
  - [ ] 为每个 context 输出添加基础置信度
  - [ ] 记录裁剪原因（如果超过 50KB）

#### 3. 基础安全扫描
- [ ] `src/core/security/SecurityScanner.ts`
  - [ ] 实现敏感信息正则扫描
  - [ ] 检测模式：API keys, email, phone, tokens
  - [ ] 实现 redact() 方法（替换为 ***）
  - [ ] 支持配置白名单（通过环境变量）

- [ ] 集成到 `git review` 命令
  - [ ] 审查前自动扫描敏感信息
  - [ ] 发现敏感信息时给出警告
  - [ ] 提供自动脱敏选项

#### 4. 集成测试
- [ ] 更新 `git plan` 命令
  - [ ] 使用 CapabilityLevel 标记生成的任务
  - [ ] 为每个任务添加 fallbackChain

- [ ] 更新 `git review` 命令
  - [ ] 输出审查结果的 confidence
  - [ ] 超时或失败时触发降级

---

### P1 阶段（3-4周）- 语义理解增强
**目标：** 提升 Git 上下文的语义理解能力，改进规划质量

#### 1. Commit 语义解析
- [ ] `src/core/git/GitCommitParser.ts`
  - [ ] 实现 L1 解析（Conventional Commits）
    - [ ] 解析 type/scope/breaking
    - [ ] 置信度 0.9~1.0
  - [ ] 实现 L2 解析（关键词匹配）
    - [ ] fix/bug/error → bugfix
    - [ ] add/new/feat → feature
    - [ ] update/change/refactor → refactor
    - [ ] remove/delete → refactor
    - [ ] 基于 diff 特征辅助判断
    - [ ] 置信度 0.5~0.8
  - [ ] 实现 L3 回退（UnknownIntent）
    - [ ] 仅保留文件变更事实
    - [ ] 置信度 ≤0.4
  - [ ] 实现 InferenceTrace 记录

- [ ] `src/core/git/MergeIntentEngine.ts`
  - [ ] 简化版：检测 Merge Commit
  - [ ] 检查子提交意图一致性
  - [ ] 输出：ConsistentMerge / ConflictingMerge
  - [ ] 实现基础 RiskyMergeDetector
    - [ ] 冲突文件数 > 5
    - [ ] 核心模块变更（hardcoded 列表）

- [ ] 集成到 `git plan`
  - [ ] 使用 GitCommitParser 解析最近 10 次提交
  - [ ] 在上下文中包含 commit intent 信息
  - [ ] 识别 Breaking Changes

#### 2. 语义 Diff（简化版）
- [ ] `src/core/git/SemanticDiffEngine.ts`
  - [ ] 仅实现 Regex 层（暂不实现 AST）
  - [ ] 检测函数签名变化：`function\s+\w+\s*\(`
  - [ ] 检测 class/interface 定义：`class\s+\w+|interface\s+\w+`
  - [ ] 检测 import/export 语句
  - [ ] 所有 Regex 匹配标注为 Uncertain
  - [ ] 实现 DiffSummary（modifiedAPIs/changedSignatures）

- [ ] 文本相似度计算
  - [ ] 实现 Jaccard 相似度
  - [ ] 实现编辑距离（简化版，限制长度）
  - [ ] 用于识别重命名/移动的代码

- [ ] 集成到 `git review`
  - [ ] 输出 API 变更摘要
  - [ ] 标注 Breaking Changes
  - [ ] 提供影响范围评估

#### 3. Pipeline 错误处理
- [ ] `src/core/git/PipelineError.ts`
  - [ ] 定义 PipelineError 类型
  - [ ] 错误级别：SOFT（可忽略）/ HARD（必须终止）
  - [ ] 实现 IGNORE 策略
  - [ ] 审计日志记录（无论是否忽略）

- [ ] 集成到 `git auto`
  - [ ] SOFT 错误不中断流程
  - [ ] 记录到进度报告
  - [ ] 用户可配置严格模式

---

### P2 阶段（6-8周，可选）- 高级分析功能
**目标：** 提供项目演进洞察，但仅在 P0/P1 完成并验证价值后考虑

#### 1. 演进分析（简化版）
- [ ] `src/core/git/HistoryAnalyzer.ts`
  - [ ] 统计提交频率（按周/月）
  - [ ] 统计代码行数变化
  - [ ] 统计活跃文件列表
  - [ ] 简单的 churn 计算（修改次数）

- [ ] `src/core/git/HotspotCalculator.ts`
  - [ ] 实现基础 Hotspot 指标
    - [ ] freq - 提交次数
    - [ ] recency - 最近修改时间
  - [ ] 暂不实现 churn 和 fanOutDelta
  - [ ] 输出 Top 10 热点文件

- [ ] 新增命令 `yuangs git hotspot`
  - [ ] 显示热点文件
  - [ ] 显示提交趋势
  - [ ] 可视化选项（可选）

#### 2. 高级 Diff（可选）
- [ ] 考虑引入 TypeScript AST 解析（仅 TS 项目）
- [ ] 或者考虑使用 tree-sitter（多语言支持）
- [ ] 实现 ChangeRegion Detection
- [ ] 动态性能阈值（仅在实测数据充足后）

#### 3. Milestone 系统（可选，延后评估）
- [ ] 仅在以下条件满足时考虑：
  - [ ] 项目历史 > 6 个月
  - [ ] 提交数 > 100 次
  - [ ] 有明确的需求场景

- [ ] 如果实现，优先级：
  - [ ] commitDensity - 提交密度
  - [ ] 简单的 trend 信号（上升/下降）
  - [ ] 暂不实现 apiVolatility 和 consolidationOpportunity

---

## 🚫 明确不实现的功能（过度设计）

以下功能在当前阶段**不推荐**实现，原因如分析报告所述：

### 1. 完整的 Threat Model
- ❌ STRIDE 威胁模型文档
- ❌ 复杂的访问控制（ACL）
- ❌ 多级脱敏配置
- **替代方案：** 基础正则扫描 + 简单白名单

### 2. 动态性能阈值
- ❌ rolling p95 × 1.2 动态阈值
- ❌ 实时性能监控
- **替代方案：** 固定阈值（后期根据实测数据调整）

### 3. AST 级别解析
- ❌ 完整的多语言 AST 解析
- ❌ 复杂的语义分析
- **替代方案：** Regex + 文本相似度

### 4. 完整的 Milestone 系统
- ❌ commitDensity/apiVolatility/hotspotOverlap
- ❌ 复杂的信号检测算法
- **替代方案：** 简单的历史统计（P2 阶段考虑）

---

## 📋 实施检查清单

### P0 完成标准
- [ ] 所有新模块包含完整的 TypeScript 类型定义
- [ ] 所有模块有单元测试覆盖率 ≥ 80%
- [ ] `git plan` 输出包含 CapabilityLevel 信息
- [ ] `git review` 包含安全扫描结果
- [ ] ContextGatherer 输出包含 ContextMeta

### P1 完成标准
- [ ] GitCommitParser 能正确识别 80% 的 commit intent
- [ ] SemanticDiffEngine 能检测 70% 的 API 变更
- [ ] PipelineError 正确处理 SOFT/HARD 错误
- [ ] 集成测试覆盖完整工作流

### P2 完成标准（如果实施）
- [ ] Hotspot 命令能正确输出热点文件
- [ ] 历史分析数据可视化（可选）
- [ ] 性能可接受（分析 1000+ 提交 < 10s）

---

## 💡 实施建议

### 开发策略
1. **每个 P0 模块独立测试**
   - CapabilityLevel: 单元测试
   - DegradationPolicy: 集成测试
   - ContextMeta: 类型检查
   - SecurityScanner: 正则测试集

2. **增量式集成**
   - 先实现核心接口
   - 在 `git plan` 中验证
   - 再扩展到其他命令

3. **持续简化**
   - 每个模块实现最小可行版本
   - 避免过度抽象
   - 实际使用中优化

### 风险管理
- **风险 1：P0 实现超时**
  - 缓解方案：进一步简化 DegradationPolicy（硬编码决策）

- **风险 2：SecurityScanner 性能问题**
  - 缓解方案：仅扫描新增文件，支持异步扫描

- **风险 3：GitCommitParser 准确率低**
  - 缓解方案：提供人工标注接口，允许用户修正

---

## 🎯 成功指标

### P0 阶段
- 实现时间：2-3 周
- 测试覆盖率：≥ 80%
- 集成测试：通过
- 用户反馈：无明显问题

### P1 阶段
- Commit intent 识别率：≥ 80%
- API 变更检测率：≥ 70%
- 用户体验：显著提升（通过对比测试）

### 整体目标
- 完成 P0 + P1 后，`git plan` 质量提升 30%+
- `git review` 增加 API 变更检测
- 整体开发效率提升 20%+

---

## 📝 备注

- 本计划基于当前约 40% 的完成度制定
- P0 为必须实现，P1 强烈推荐，P2 可选
- 每个 Phase 完成后进行复盘，调整后续计划
- 保留原有架构，增量式演进，不进行破坏性重构
- 所有新功能默认保守，失败时降级到基础行为
