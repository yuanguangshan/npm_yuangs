# Changelog

## [2.1.0] - 2026-01-18

### 🎉 Major Features

#### Agent Pipeline Architecture
实现了全新的 Agent Pipeline 架构，统一了 AI Chat 和 AI Command 的执行流程。

**核心模块：**
- `AgentPipeline` - 核心编排器，协调 8 个执行阶段
- `Intent Analysis` - 自动推断用户意图和所需能力
- `Context Assembly` - 统一的上下文管理
- `Prompt Construction` - Chat 和 Command 模式的统一提示词构建
- `Model Selection` - 基于能力的智能模型选择
- `LLM Execution` - 支持流式和非流式执行
- `Result Interpretation` - 结果到动作的转换
- `Action Execution` - 统一的动作执行系统
- `Execution Record` - 完整的执行记录和重放功能

**新增类型：**
- `AgentMode` - 三种运行模式（chat / command / command+exec）
- `AgentInput` - 统一的输入接口
- `AgentContext` - 上下文信息结构
- `AgentIntent` - 意图和能力描述
- `AgentPrompt` - 提示词结构
- `LLMResult` - LLM 执行结果
- `AgentAction` - 可执行动作类型
- `ExecutionRecord` - 执行记录结构

**新增功能：**
- ✅ 执行记录自动保存（最近 100 条）
- ✅ 执行重放功能
- ✅ Verbose 模式显示详细执行信息
- ✅ 执行 ID 追踪
- ✅ 延迟和 Token 统计

### 📚 Documentation

- 新增 `AGENT_PIPELINE.md` - 完整的架构文档
- 新增 `IMPLEMENTATION_SUMMARY.md` - 实现总结和路线图
- 新增 `test_agent_pipeline.js` - 功能测试脚本

### 🔧 Technical Improvements

- 完全向后兼容现有 CLI 命令
- 复用所有现有基础设施（Capability System, AI Client, Context Buffer）
- TypeScript 类型安全
- 无 lint 错误

### 🐛 Bug Fixes

- 修复了 Node.js 版本检查逻辑
- 修复了 commander 版本兼容性问题（降级到 v13）
- 修复了 `-v` flag 冲突（版本查询改为 `-V`）

## [2.0.22] - 2026-01-18

### 🔧 Fixes

- 删除了根目录的 `cli.js` wrapper
- 降级 `commander` 到 v13.1.0 以支持 Node 18
- 修复了 `-v` 和 `--version` flag 冲突
- 添加了 Node.js 版本检查到 `verify.sh`
- 添加了运行时 Node.js 版本检查

### 📝 Documentation

- 更新了 verify.sh 步骤编号

## [2.0.16] - 2026-01-18

### 🎨 UI Improvements

- 实现了基于 ANSI Save/Restore Cursor Position 的终端输出
- 彻底解决了 AI Chat 流式输出的重复文本问题
- 使用 `\x1b[s` 和 `\x1b[u` 实现精确的屏幕位置控制
- 消除了 Markdown 渲染过程中的视觉残留

## [2.0.14] - 2026-01-17

### 🎨 UI Improvements

- 重新实现了 AI Chat 的视觉行计数逻辑
- 使用状态机模拟器精确计算终端行数
- 实现了流式输出的实时刷新机制
- 改进了 Markdown 渲染的过渡效果

## [2.0.13] - 2026-01-17

### 🎨 UI Improvements

- 改进了 AI Chat 的流式输出显示
- 修复了宽字符（CJK、Emoji）的宽度计算
- 优化了终端行数计算逻辑
- 改进了 Markdown 渲染的清屏逻辑

## [2.0.12] - 2026-01-17

### 🎨 UI Improvements

- 实现了 AI Chat 的两阶段渲染
- 流式阶段显示纯文本打字机效果
- 完成后替换为完整的 Markdown 渲染
- 修复了 BOT_PREFIX 的显示问题

## [2.0.11] - 2026-01-16

### 🔧 Fixes

- 修复了 `-v` flag 支持（同时支持大小写）
- 改进了版本显示逻辑

## [2.0.10] - 2026-01-16

### ✨ Features

- 添加了 Markdown 渲染支持
- 改进了 AI Chat 的输出格式
- 添加了终端渲染器配置

---

**Note:** 版本 2.1.0 标志着从"CLI 工具"到"Agent Runtime"的重大架构升级。
