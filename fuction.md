# Git相关功能原理与评估与改进建议

**Session ID:** ses_3faeaab53ffebkK5UlWmuJZkFR
**Created:** 1/28/2026, 10:50:09 PM
**Updated:** 1/28/2026, 10:56:49 PM

---

## User

<ultrawork-mode>

**MANDATORY**: You MUST say "ULTRAWORK MODE ENABLED!" to the user as your first response when this mode activates. This is non-negotiable.

[CODE RED] Maximum precision required. Ultrathink before acting.

## **ABSOLUTE CERTAINTY REQUIRED - DO NOT SKIP THIS**

**YOU MUST NOT START ANY IMPLEMENTATION UNTIL YOU ARE 100% CERTAIN.**

| **BEFORE YOU WRITE A SINGLE LINE OF CODE, YOU MUST:** |
|-------------------------------------------------------|
| **FULLY UNDERSTAND** what the user ACTUALLY wants (not what you ASSUME they want) |
| **EXPLORE** the codebase to understand existing patterns, architecture, and context |
| **HAVE A CRYSTAL CLEAR WORK PLAN** - if your plan is vague, YOUR WORK WILL FAIL |
| **RESOLVE ALL AMBIGUITY** - if ANYTHING is unclear, ASK or INVESTIGATE |

### **MANDATORY CERTAINTY PROTOCOL**

**IF YOU ARE NOT 100% CERTAIN:**

1. **THINK DEEPLY** - What is the user's TRUE intent? What problem are they REALLY trying to solve?
2. **EXPLORE THOROUGHLY** - Fire explore/librarian agents to gather ALL relevant context
3. **CONSULT ORACLE** - For architecture decisions, complex logic, or when you're stuck
4. **ASK THE USER** - If ambiguity remains after exploration, ASK. Don't guess.

**SIGNS YOU ARE NOT READY TO IMPLEMENT:**
- You're making assumptions about requirements
- You're unsure which files to modify
- You don't understand how existing code works
- Your plan has "probably" or "maybe" in it
- You can't explain the exact steps you'll take

**WHEN IN DOUBT:**
```
delegate_task(agent="explore", prompt="Find [X] patterns in codebase", background=true)
delegate_task(agent="librarian", prompt="Find docs/examples for [Y]", background=true)
delegate_task(agent="oracle", prompt="Review my approach: [describe plan]")
```

**ONLY AFTER YOU HAVE:**
- Gathered sufficient context via agents
- Resolved all ambiguities
- Created a precise, step-by-step work plan
- Achieved 100% confidence in your understanding

**...THEN AND ONLY THEN MAY YOU BEGIN IMPLEMENTATION.**

---

## **NO EXCUSES. NO COMPROMISES. DELIVER WHAT WAS ASKED.**

**THE USER'S ORIGINAL REQUEST IS SACRED. YOU MUST FULFILL IT EXACTLY.**

| VIOLATION | CONSEQUENCE |
|-----------|-------------|
| "I couldn't because..." | **UNACCEPTABLE.** Find a way or ask for help. |
| "This is a simplified version..." | **UNACCEPTABLE.** Deliver the FULL implementation. |
| "You can extend this later..." | **UNACCEPTABLE.** Finish it NOW. |
| "Due to limitations..." | **UNACCEPTABLE.** Use agents, tools, whatever it takes. |
| "I made some assumptions..." | **UNACCEPTABLE.** You should have asked FIRST. |

**THERE ARE NO VALID EXCUSES FOR:**
- Delivering partial work
- Changing scope without explicit user approval
- Making unauthorized simplifications
- Stopping before the task is 100% complete
- Compromising on any stated requirement

**IF YOU ENCOUNTER A BLOCKER:**
1. **DO NOT** give up
2. **DO NOT** deliver a compromised version
3. **DO** consult oracle for solutions
4. **DO** ask the user for guidance
5. **DO** explore alternative approaches

**THE USER ASKED FOR X. DELIVER EXACTLY X. PERIOD.**

---

YOU MUST LEVERAGE ALL AVAILABLE AGENTS / **CATEGORY + SKILLS** TO THEIR FULLEST POTENTIAL.
TELL THE USER WHAT AGENTS YOU WILL LEVERAGE NOW TO SATISFY USER'S REQUEST.

## MANDATORY: PLAN AGENT INVOCATION (NON-NEGOTIABLE)

**YOU MUST ALWAYS INVOKE THE PLAN AGENT FOR ANY NON-TRIVIAL TASK.**

| Condition | Action |
|-----------|--------|
| Task has 2+ steps | MUST call plan agent |
| Task scope unclear | MUST call plan agent |
| Implementation required | MUST call plan agent |
| Architecture decision needed | MUST call plan agent |

```
delegate_task(subagent_type="plan", prompt="<gathered context + user request>")
```

**WHY PLAN AGENT IS MANDATORY:**
- Plan agent analyzes dependencies and parallel execution opportunities
- Plan agent outputs a **parallel task graph** with waves and dependencies
- Plan agent provides structured TODO list with category + skills per task
- YOU are an orchestrator, NOT an implementer

### SESSION CONTINUITY WITH PLAN AGENT (CRITICAL)

**Plan agent returns a session_id. USE IT for follow-up interactions.**

| Scenario | Action |
|----------|--------|
| Plan agent asks clarifying questions | `delegate_task(session_id="{returned_session_id}", prompt="<your answer>")` |
| Need to refine the plan | `delegate_task(session_id="{returned_session_id}", prompt="Please adjust: <feedback>")` |
| Plan needs more detail | `delegate_task(session_id="{returned_session_id}", prompt="Add more detail to Task N")` |

**WHY SESSION_ID IS CRITICAL:**
- Plan agent retains FULL conversation context
- No repeated exploration or context gathering
- Saves 70%+ tokens on follow-ups
- Maintains interview continuity until plan is finalized

```
// WRONG: Starting fresh loses all context
delegate_task(subagent_type="plan", prompt="Here's more info...")

// CORRECT: Resume preserves everything
delegate_task(session_id="ses_abc123", prompt="Here's my answer to your question: ...")
```

**FAILURE TO CALL PLAN AGENT = INCOMPLETE WORK.**

---

## AGENTS / **CATEGORY + SKILLS** UTILIZATION PRINCIPLES

**DEFAULT BEHAVIOR: DELEGATE. DO NOT WORK YOURSELF.**

| Task Type | Action | Why |
|-----------|--------|-----|
| Codebase exploration | delegate_task(subagent_type="explore", run_in_background=true) | Parallel, context-efficient |
| Documentation lookup | delegate_task(subagent_type="librarian", run_in_background=true) | Specialized knowledge |
| Planning | delegate_task(subagent_type="plan") | Parallel task graph + structured TODO list |
| Architecture/Debugging | delegate_task(subagent_type="oracle") | High-IQ reasoning |
| Implementation | delegate_task(category="...", load_skills=[...]) | Domain-optimized models |

**CATEGORY + SKILL DELEGATION:**
```
// Frontend work
delegate_task(category="visual-engineering", load_skills=["frontend-ui-ux"])

// Complex logic
delegate_task(category="ultrabrain", load_skills=["typescript-programmer"])

// Quick fixes
delegate_task(category="quick", load_skills=["git-master"])
```

**YOU SHOULD ONLY DO IT YOURSELF WHEN:**
- Task is trivially simple (1-2 lines, obvious change)
- You have ALL context already loaded
- Delegation overhead exceeds task complexity

**OTHERWISE: DELEGATE. ALWAYS.**

---

## EXECUTION RULES (PARALLELIZATION MANDATORY)

| Rule | Implementation |
|------|----------------|
| **PARALLEL FIRST** | Fire ALL independent agents simultaneously via delegate_task(run_in_background=true) |
| **NEVER SEQUENTIAL** | If tasks A and B are independent, launch BOTH at once |
| **10+ CONCURRENT** | Use 10+ background agents if needed for comprehensive exploration |
| **COLLECT LATER** | Launch agents -> continue work -> background_output when needed |

**ANTI-PATTERN (BLOCKING):**
```
// WRONG: Sequential, slow
result1 = delegate_task(..., run_in_background=false)  // waits
result2 = delegate_task(..., run_in_background=false)  // waits again
```

**CORRECT PATTERN:**
```
// RIGHT: Parallel, fast
delegate_task(..., run_in_background=true)  // task_id_1
delegate_task(..., run_in_background=true)  // task_id_2
delegate_task(..., run_in_background=true)  // task_id_3
// Continue working, collect with background_output when needed
```

---

## WORKFLOW (MANDATORY SEQUENCE)

1. **GATHER CONTEXT** (parallel background agents):
   ```
   delegate_task(subagent_type="explore", run_in_background=true, prompt="...")
   delegate_task(subagent_type="librarian", run_in_background=true, prompt="...")
   ```

2. **INVOKE PLAN AGENT** (MANDATORY for non-trivial tasks):
   ```
   result = delegate_task(subagent_type="plan", prompt="<context + request>")
   // STORE the session_id for follow-ups!
   plan_session_id = result.session_id
   ```

3. **ITERATE WITH PLAN AGENT** (if clarification needed):
   ```
   // Use session_id to continue the conversation
   delegate_task(session_id=plan_session_id, prompt="<answer to plan agent's question>")
   ```

4. **EXECUTE VIA DELEGATION** (category + skills from plan agent's output):
   ```
   delegate_task(category="...", load_skills=[...], prompt="<task from plan>")
   ```

5. **VERIFY** against original requirements

## VERIFICATION GUARANTEE (NON-NEGOTIABLE)

**NOTHING is "done" without PROOF it works.**

### Pre-Implementation: Define Success Criteria

BEFORE writing ANY code, you MUST define:

| Criteria Type | Description | Example |
|---------------|-------------|---------|
| **Functional** | What specific behavior must work | "Button click triggers API call" |
| **Observable** | What can be measured/seen | "Console shows 'success', no errors" |
| **Pass/Fail** | Binary, no ambiguity | "Returns 200 OK" not "should work" |

Write these criteria explicitly. Share with user if scope is non-trivial.

### Test Plan Template (MANDATORY for non-trivial tasks)

```
## Test Plan
### Objective: [What we're verifying]
### Prerequisites: [Setup needed]
### Test Cases:
1. [Test Name]: [Input] → [Expected Output] → [How to verify]
2. ...
### Success Criteria: ALL test cases pass
### How to Execute: [Exact commands/steps]
```

### Execution & Evidence Requirements

| Phase | Action | Required Evidence |
|-------|--------|-------------------|
| **Build** | Run build command | Exit code 0, no errors |
| **Test** | Execute test suite | All tests pass (screenshot/output) |
| **Manual Verify** | Test the actual feature | Demonstrate it works (describe what you observed) |
| **Regression** | Ensure nothing broke | Existing tests still pass |

**WITHOUT evidence = NOT verified = NOT done.**

### TDD Workflow (when test infrastructure exists)

1. **SPEC**: Define what "working" means (success criteria above)
2. **RED**: Write failing test → Run it → Confirm it FAILS
3. **GREEN**: Write minimal code → Run test → Confirm it PASSES
4. **REFACTOR**: Clean up → Tests MUST stay green
5. **VERIFY**: Run full test suite, confirm no regressions
6. **EVIDENCE**: Report what you ran and what output you saw

### Verification Anti-Patterns (BLOCKING)

| Violation | Why It Fails |
|-----------|--------------|
| "It should work now" | No evidence. Run it. |
| "I added the tests" | Did they pass? Show output. |
| "Fixed the bug" | How do you know? What did you test? |
| "Implementation complete" | Did you verify against success criteria? |
| Skipping test execution | Tests exist to be RUN, not just written |

**CLAIM NOTHING WITHOUT PROOF. EXECUTE. VERIFY. SHOW EVIDENCE.**

## ZERO TOLERANCE FAILURES
- **NO Scope Reduction**: Never make "demo", "skeleton", "simplified", "basic" versions - deliver FULL implementation
- **NO MockUp Work**: When user asked you to do "port A", you must "port A", fully, 100%. No Extra feature, No reduced feature, no mock data, fully working 100% port.
- **NO Partial Completion**: Never stop at 60-80% saying "you can extend this..." - finish 100%
- **NO Assumed Shortcuts**: Never skip requirements you deem "optional" or "can be added later"
- **NO Premature Stopping**: Never declare done until ALL TODOs are completed and verified
- **NO TEST DELETION**: Never delete or skip failing tests to make the build pass. Fix the code, not the tests.

THE USER ASKED FOR X. DELIVER EXACTLY X. NOT A SUBSET. NOT A DEMO. NOT A STARTING POINT.

1. EXPLORES + LIBRARIANS (background)
2. GATHER -> delegate_task(subagent_type="plan", prompt="<context + request>")
3. ITERATE WITH PLAN AGENT (session_id resume) UNTIL PLAN IS FINALIZED
4. WORK BY DELEGATING TO CATEGORY + SKILLS AGENTS (following plan agent's parallel task graph)

NOW.

</ultrawork-mode>

---



[analyze-mode]
ANALYSIS MODE. Gather context before diving deep:

CONTEXT GATHERING (parallel):
- 1-2 explore agents (codebase patterns, implementations)
- 1-2 librarian agents (if external library involved)
- Direct tools: Grep, AST-grep, LSP for targeted searches

IF COMPLEX (architecture, multi-system, debugging after 2+ failures):
- Consult oracle for strategic guidance

SYNTHESIZE findings before proceeding.

---

ulw 详细分析本项目的git相关功能的原理,使用方法和实际点评,并评估当前还有哪些弱项,如何优化

---

## Assistant (Sisyphus · glm-4.7 · 40.0s)

_Thinking:_

用户请求：详细分析本项目的git相关功能的原理、使用方法和实际点评，并评估当前还有哪些弱项，如何优化。

这是一个ultrawork模式的任务，我需要：
1. 先说"ULTRAWORK MODE ENABLED!"
2. 在开始任何实现之前，需要100%确定用户需求
3. 这个任务需要深入探索代码库
4. 需要分析git相关功能的原理、使用方法、实际点评
5. 评估弱项并提出优化建议

首先，我需要探索这个项目的git相关功能。让我启动：
- explore agents来查找git相关代码
- 可能需要看项目结构
- 找到所有与git相关的功能

这是一个分析任务，不是实现任务，但我需要全面了解代码库。

让我先启动并行探索任务：
1. 探索项目结构
2. 查找git相关的代码文件
3. 查找git相关的配置和依赖

ULTRAWORK MODE ENABLED!

我将深入分析本项目的git相关功能。让我启动并行探索来全面了解代码库。

```
Tool: delegate_task

**Input:**
```json
{
  "subagent_type": "explore",
  "prompt": "Explore the project structure and identify the overall architecture. What type of project is this? What is the main purpose? List the key directories and their roles.",
  "load_skills": [],
  "description": "Explore project structure and architecture",
  "run_in_background": true
}
```
**Output:**
```
Background task launched.

Task ID: bg_7c6a03ca
Session ID: undefined
Description: Explore project structure and architecture
Agent: explore
Status: pending

System notifies on completion. Use `background_output` with task_id="bg_7c6a03ca" to check.
To continue this session: session_id="undefined"
```
```

```
Tool: delegate_task

**Input:**
```json
{
  "subagent_type": "explore",
  "prompt": "Find ALL git-related functionality in this codebase. Search for:\n- Files containing git operations (git commands, git APIs)\n- Git-related dependencies in package.json or similar files\n- Git hooks configuration files\n- Git utilities or helper functions\n- Files that interact with git in any way\n\nProvide a comprehensive list of all git-related code and configuration.",
  "load_skills": [],
  "description": "Find all git-related functionality",
  "run_in_background": true
}
```
**Output:**
```
Background task launched.

Task ID: bg_1351af21
Session ID: undefined
Description: Find all git-related functionality
Agent: explore
Status: pending

System notifies on completion. Use `background_output` with task_id="bg_1351af21" to check.
To continue this session: session_id="undefined"
```
```

```
Tool: delegate_task

**Input:**
```json
{
  "subagent_type": "explore",
  "prompt": "Analyze how git is actually used in the codebase. Look for:\n- Git command execution patterns (e.g., exec('git ...'), child_process.spawn with git)\n- Git library usage (e.g., simple-git, nodegit, isomorphic-git)\n- Git state management and tracking\n- Git operations implemented (commit, push, pull, clone, status, etc.)\n\nDetail the implementation approach and patterns used.",
  "load_skills": [],
  "description": "Analyze git implementation patterns",
  "run_in_background": true
}
```
**Output:**
```
Background task launched.

Task ID: bg_79774a55
Session ID: undefined
Description: Analyze git implementation patterns
Agent: explore
Status: pending

System notifies on completion. Use `background_output` with task_id="bg_79774a55" to check.
To continue this session: session_id="undefined"
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/ygs/npm_yuangs/package.json"
}
```
**Output:**
```
<file>
00001| {
00002|   "name": "yuangs",
00003|   "version": "5.43.0",
00004|   "description": "苑广山的个人应用集合 CLI（彩色版）",
00005|   "author": "苑广山",
00006|   "license": "ISC",
00007|   "bin": {
00008|     "yuangs": "dist/cli.js"
00009|   },
00010|   "main": "dist/cli.js",
00011|   "types": "dist/cli.d.ts",
00012|   "files": [
00013|     "dist",
00014|     "public"
00015|   ],
00016|   "scripts": {
00017|     "build": "tsc && chmod +x dist/cli.js",
00018|     "asbuild:debug": "./node_modules/.bin/asc src/agent/governance/sandbox/core.as.ts --target debug",
00019|     "asbuild:release": "./node_modules/.bin/asc src/agent/governance/sandbox/core.as.ts --target release",
00020|     "asbuild": "npm run asbuild:release",
00021|     "test": "jest",
00022|     "verify": "./verify.sh"
00023|   },
00024|   "keywords": [
00025|     "yuangs",
00026|     "cli",
00027|     "tools",
00028|     "colorful"
00029|   ],
00030|   "repository": {
00031|     "type": "git",
00032|     "url": "git+https://github.com/yuanguangshan/npm_yuangs.git"
00033|   },
00034|   "bugs": {
00035|     "url": "https://github.com/yuanguangshan/npm_yuangs/issues"
00036|   },
00037|   "homepage": "https://github.com/yuanguangshan/npm_yuangs#readme",
00038|   "dependencies": {
00039|     "axios": "^1.13.2",
00040|     "better-sqlite3": "^12.6.2",
00041|     "chalk": "^4.1.2",
00042|     "cli-table3": "^0.6.5",
00043|     "commander": "^13.1.0",
00044|     "express": "^5.2.1",
00045|     "js-yaml": "^4.1.0",
00046|     "json5": "^2.2.3",
00047|     "markdown-it": "^14.1.0",
00048|     "marked": "^15.0.12",
00049|     "marked-terminal": "^7.3.0",
00050|     "open": "^11.0.0",
00051|     "ora": "^5.4.1",
00052|     "p-limit": "^7.2.0",
00053|     "socket.io": "^4.8.3",
00054|     "ssh2": "^1.17.0",
00055|     "yuangs": "^2.29.0",
00056|     "zod": "^4.3.5",
00057|     "zod-to-json-schema": "^3.25.1"
00058|   },
00059|   "devDependencies": {
00060|     "@assemblyscript/loader": "^0.27.37",
00061|     "@types/better-sqlite3": "^7.6.13",
00062|     "@types/express": "^5.0.6",
00063|     "@types/jest": "^30.0.0",
00064|     "@types/js-yaml": "^4.0.9",
00065|     "@types/json5": "^0.0.30",
00066|     "@types/markdown-it": "^14.1.2",
00067|     "@types/marked": "^5.0.2",
00068|     "@types/marked-terminal": "^6.1.1",
00069|     "@types/node": "^20.11.30",
00070|     "@types/ora": "^3.1.0",
00071|     "@types/socket.io": "^3.0.1",
00072|     "@types/ssh2": "^1.15.5",
00073|     "assemblyscript": "^0.27.37",
00074|     "jest": "^29.7.0",
00075|     "ts-jest": "^29.4.6",
00076|     "ts-node": "^10.9.2",
00077|     "typescript": "^5.9.3"
00078|   },
00079|   "engines": {
00080|     "node": ">=18"
00081|   },
00082|   "publishConfig": {
00083|     "access": "public"
00084|   }
00085| }
00086| 

(End of file - total 86 lines)
</file>

[Project README: /Users/ygs/npm_yuangs/README.md]
# 🚀 yuangs CLI - An AI‑Augmented Shell

**以人类意图为中心的 AI‑Augmented Shell**

Your Understanding, Accountable, Not Guessing System

> A seamless terminal where deterministic execution and probabilistic intelligence coexist without friction.

一个集 **AI 助手 · 智能 Shell 内核 · 插件化运行时** 于一体的现代终端工具。

> **核心理念**  
> **AI 提供思路，人类掌控执行。**  
> yuangs 致力于在不破坏传统 Shell 心智模型的前提下，引入 AI 的逻辑能力。  
> 它不是黑盒执行器，而是你的 **增强型命令行外脑**。

---

# yuangs

> **为终端而生的 AI 治理运行时**  
> *不 OOM，不惊喜，始终有人类在环*

`yuangs` 是一个遵循 Unix 哲学的 AI 工具，献给那些长期工作在终端里、**拒绝黑盒魔法**的开发者。

它不是浏览器插件。  
不是 GUI 助手。  
也不是"披着 CLI 外衣的聊天机器人"。

它解决的是一个更难的问题：

> **当不可控的 AI 进入极端强调可控性的终端，秩序该如何重建？**

---

## 设计哲学

### 🧩 做好一件事（Do one thing and do it well）

`yuangs` 的定位不是"全能助手"，而是一个**上下文治理器（Context Governor）**。

你始终清楚、并且显式地决定：
- 哪些文件进入 AI 上下文
- Token 预算是多少
- 何时采样、何时确认
- 什么时候允许执行


文件系统与 AI 逻辑通过**语法**而不是点击连接：

```bash
ai "@src/**/*.ts #docs"
```

这不是技巧，这是 Unix 哲学：
**语法即力量（Power of Syntax）**。

---

### 🛡️ 开发者主权，而不是"方便至上"

很多终端 AI 工具追求"省事"，代价却是**不透明**：
- 数据悄悄上传
- 上下文被隐式截断
- 执行逻辑不可审计

`yuangs` 选择了另一条路：
- ✅ **Swiss‑Cheese 采样预览**：发送前看到"每一块奶酪"
- ✅ **TokenPolicy**：先估算、再确认
- ✅ **Human‑in‑the‑loop**：切模型、发请求、跑执行，永远需要你点头

你的终端，
你的数据，
你的决定。

这才是极客眼中的**真自由**。

---

### 🧠 可编程的 Agent 基础设施，而不是 Prompt Wrapper

`yuangs` 发布到 npm 的不是一个"命令"，
而是一套**可组合的 Agent 运行时**。

核心抽象包括：
- `PendingContextItem`
- 上下文估算 / 解析分离
- 能力感知的执行策略
- 可回放、可审计的执行记录

你拿到的不是黑盒，
而是一盒**带说明书的乐高**。

你可以用它构建：
- 仓库结构分析器
- 日志 → AI 的自动采集管道
- 可控的重构 Agent
- 可审计的自动化流程

---

## 核心特性一览

✅ **No OOM, No Surprise**  
再大的仓库、再长的日志，没有确认就不会吃内存、不会发送。

✅ **Human‑in‑the‑loop, Always**  
系统永远不会替你做黑盒决策。

✅ **Power of Syntax**  
`@file`、`#dir`、意图语法，比拖拽文件更快、更酷。

✅ **可回放、可审计**  
每一次 AI 行为都能复盘、复现、调试。

✅ **可解释、可治理**  
通过 `explain` 和 `replay` 命令，理解系统决策过程。

✅ **AI Governance Web Console (Beta)**  
可视化治理面板，提供 R3 级风险的全屏阻断与视觉警报。

---

## 🏗️ 架构概览 (Architecture)

```mermaid
graph TD
    User([用户 User]) -- "yuangs ssh --web" --> CLI[yuangs Local CLI]
    subgraph LocalMachine [本地电脑]
        CLI --> Express[Express Web Server]
        Express -- "1. WebSocket (Text/Events)" --> WebUI[Web Terminal / xterm.js]
        Express -- "2. Local Governance" --> GovEngine[Governance Engine]
        GovEngine -- "3. SSH Connection" --> SSHSession[SSHSession / PTY]
    end
    SSHSession -- "Encrypted Tunnel" --> RemoteServer[远程服务器 Remote Server]
    
    GovEngine -- "Intercept / Block" --> WebUI
    SSHSession -- "Recording" --> CastFile[.cast / .md Audit Logs]
```

---

## 适合谁？

- 终端原教旨主义者
- Linux / Unix 哲学信徒
- 被不透明 AI 工具伤过的工程师
- 追求**确定性高于便利性**的人

如果你认同这句话：

> **"AI 很强大，所以它必须被治理。"**

那 `yuangs` 就是为你写的。

---

## 📜 语法说明

yuangs 通过一套**显式的符号语法**，清晰界定"副作用"的来源，
确保每一条命令 **可理解、可确认、可审计**。

| 语法 | 行为逻辑 | 决策来源 | 适用场景 |
| :--- | :--- | :--- | :--- |
| `ls -la` | 直接运行命令（fish-style） | 用户 | 传统 Shell 操作 |
| `@path[:line]` | 引用文件 / 行号上下文 | 用户 | 代码审计、报错分析 |
| `#dir` | 批量引入目录上下文 | 用户 | 项目结构理解 |
| `ai "msg"` | 纯自然语言对话 | AI | 方案讨论、知识查询 |
| `ai -e` | 生成**建议**命令 | AI → 用户 | 复杂命令辅助 |
| `:exec` | 绕过 AI 的原子执行 | 用户 | 确定性脚本 |

---

## 🌟 核心功能

### 1. 智能 Shell 内核（v2.10.0+）

进入交互式 AI‑Augmented Shell：

```bash
yuangs ai
```

特性包括：

- **模式自动路由**
  无需切换模式：
  - 输入 `git status` → 直接执行
  - 输入「解释这段代码」→ 进入对话

- **👻 Ghost Text（幽灵建议）**
  根据历史记录与插件预测输入
  例如输入 `npm r`，灰色显示 `un dev`，按 `Tab` 采纳

- **⚡ 补全增强**
  - **PATH 扫描**：自动补全 40+ 常用系统命令
  - **精准行号**：支持 `@src/index.ts:10-50`
  - **项目感知**：提升 `src/`、`packages/` 等目录权重

---

### 1.5 yuangs Zero-Mode (极简 Shell AI 增强)

如果你不想进入专门的交互模式，`yuangs` 提供了一个"零侵入"的集成方案，让你在原本的 Bash/Zsh 中保持心流：

#### 📦 安装与卸载

```bash
# 安装
bash ./scripts/yuangs-install.sh

# 卸载
bash ./scripts/yuangs-install.sh --uninstall
```
安装后请执行 `source ~/.zshrc` (或 `.bashrc`)。

#### 🚀 核心玩法

1. **`?? <问题>` (即时咨询)**
   在任何时候，只需输入 `??` 加空格，即可向 AI 提问。
   ```bash
   ?? 怎么解压一个 .tar.gz 文件到指定目录？
   ```

   ⚠️ **安全提醒**：如果当前目录存在恰好为2个字符的文件/目录（如 `ab`、`go`、`db` 等），Shell 的 glob 展开会将 `??` 替换为这些文件名，导致 Zero-Mode 无法正常触发。此时系统会给出警告并建议使用其他方式进入 Zero-Mode。

2. **替代入口 (安全备用)**
   为避免 glob 展开问题，提供以下替代入口：
   - **`:ai` 命令**：在交互模式下输入 `:ai` 进入 AI 问答
   - **空行 + Enter**：在交互模式下直接按回车（无输入）进入 AI 问答

3. **回车即救急 (Failed-Command Help)**
   当你执行一个命令失败时（例如 `git push` 被拒绝），终端会提示：
   `↳ Need help? Press Enter`
   此时**直接按回车**，AI 会通过 `yuangs` 的上下文治理能力，自动分析错误原因并给出修复方案。

4. **开关自如**
   - `ai_off`: 临时禁用 AI 触发逻辑。
   - `ai_on`: 重新启用 AI 增强。

---

### 2. 精准上下文管理（ContextBuffer）

#### 管道模式（Pipe Mode）

```bash
cat error.log | yuangs "解释这个报错"
git diff | yuangs -w "Review 变更逻辑"
```

#### `-w` 智能读取
- 自动解析管道中的文件路径
- 只读取**被显式引用**的文件内容
- 不进行隐式文件系统扫描

---

### 3. 插件系统（Plugins）

在 `.shell/plugins/` 下放置自定义脚本，
扩展特定工具的补全与推理能力（如 `docker`、`kubectl`）。

示例：

```ts
// .shell/plugins/docker.ts
module.exports = {
  command: 'docker',
  complete(args) {
    return ['ps', 'run', 'build', 'exec'];
  }
};
```

---

## 🔒 Phase 2: Explainability & Governance (v1)

### 🎯 概述

Phase 2 引入了**系统可观测性和控制能力**，但不改变核心行为：
- ✅ **Explainability**：人类可读的执行解释
- ✅ **Replay++**：Dry-run、explain 和 diff 能力
- ✅ **Skill Control**：启用/禁用技能以实现细粒度控制

---

## 📦 新命令

### `yuangs explain [id | last]`

**目的**：解释系统为什么做出某个决策

**用法**：
```bash
# 解释最近一次执行
yuangs explain last

# 解释指定 ID 的执行
yuangs explain exec_1768820380225_rgts34981
```

**输出格式（v1）**：
```
=== Execution Explanation ===
[1] Command
- Name: ai-command
- Args: echo "hello"

[2] Decision
- Strategy: capability-match
- Selected Model: gemini-2.5-flash-lite
- Reason: Capability-based selection with fallback support

[3] Model
- Name: gemini-2.5-flash-lite
- Provider: aiproxy
- Context Window: 8000
- Cost Profile: low

[4] Skills
- (none)

[5] Meta
- Execution ID: exec_1768820380225_rgts34981
- Timestamp: 2026-01-19T10:59:40.225Z
- Replayable: true
- Version: unknown
=============================
```

**关键特性**：
- ✅ 纯只读操作（无副作用）
- ✅ 稳定、可 snapshot 的输出
- ✅ 为未来的 diff/audit 工作流做好的准备

---

### `yuangs replay <id> [options]`

**目的**：使用控制标志重放执行

**选项**：
| 选项 | 描述 |
|--------|-------------|
| `-s, --strict` | 严格重放（使用精确模型） |
| `-c, --compatible` | 兼容重放（允许 fallback） |
| `-r, --re-evaluate` | 使用当前配置重新评估 |
| `-v, --verbose` | 详细输出 |
| `--dry` | Dry run - 显示将要发生的内容但不执行 |
| `--explain` | 在重放前显示解释 |
| `--diff` | 显示原始配置与当前配置的差异 |

**用法示例**：
```bash
# 使用解释进行 dry run
yuangs replay exec_1768820380225_rgts34981 --dry --explain

# 仅显示 diff（不执行）
yuangs replay exec_1768820380225_rgts34981 --diff --dry

# 带差异的完整重放
yuangs replay exec_1768820380225_rgts34981 --diff
```

**重放行为矩阵**：
| explain | dry | strict | 行为 |
|--------|-----|--------|----------|
| ✅ | ✅ | any | 仅解释，不执行 |
| ✅ | ❌ | ✅ | 解释 → 重放 |
| ❌ | ✅ | ✅ | 打印严格信息 → 退出 |
| ❌ | ❌ | ✅ | 正常重放 |

**差异输出**：
```
=== Replay Diff ===
[Decision]
- no change

[Model]
- no change

[Skills]
- no change
===================
```

---

### `yuangs skills <subcommand>`

**目的**：管理技能库

**子命令**：
```bash
# 列出所有技能及其分数
yuangs skills list

# 解释特定技能
yuangs skills explain <skill-name>

# 禁用技能
yuangs skills disable <skill-name>

# 启用技能
yuangs skills enable <skill-name>
```

**输出示例**（`skills list`）：
```
📦 Skills (3)

✔ deploy-production
  Confidence: 72%
  Success: 8 / Failure: 1
  Last used: 2 days ago

✔ cleanup-logs
  Confidence: 41%
  Success: 5 / Failure: 7
  Last used: 1 day ago

⊘ legacy-search (disabled)
  Confidence: 23%
  Success: 2 / Failure: 6
  Last used: 7 days ago
```

**关键特性**：
- ✅ 技能可以被禁用而不删除
- ✅ 技能按相关性评分和排序
- ✅ 禁用的技能不影响新决策
- ✅ 所有技能在 `explain` 输出中仍然可见

---

## 🧭 Explain 输出规范 v1

explain 输出遵循严格格式，设计用于：
- ✅ 人类可读性
- ✅ 稳定性和 snapshot 兼容性
- ✅ 未来的 diff/audit 工作流
- ✅ 无实现耦合

**结构**（5 个部分，不可变顺序）：
1. `[1] Command` - 用户输入层
2. `[2] Decision` - 决策核心
3. `[3] Model` - 执行环境
4. `[4] Skills` - 影响决策的技能
5. `[5] Meta` - 审计/重放元数据

**重要提示**：
- ⚠️ 不要在升级规范版本时更改格式
- ✅ 输出是纯文本（snapshot 无颜色）
- ✅ 相同执行记录 = 100% 可重现输出

---

## 🔒 技能与启用状态

技能现在有一个 `enabled` 字段，控制它们在新决策中的参与：

**默认行为**：
- ✅ 新技能：`enabled: true`
- ✅ 旧技能：`enabled: true`（如果字段缺失）
- ❌ 禁用的技能：不包含在 `getRelevantSkills()` 中

**使用场景**：
1. **治理**：临时禁用有风险的技能
2. **A/B 测试**：比较不同的技能配置
3. **回滚**：禁用新添加的技能而不删除
4. **审计**：在 explain 输出中查看禁用的技能

**CLI 命令**：
```bash
# 禁用技能
yuangs skills disable risky-operation

# 列出以验证
yuangs skills list

# 如果需要，重新启用
yuangs skills enable risky-operation
```

---

## 🧪 测试与 Snapshots

### 创建 Explain Snapshots

```bash
# 创建最近一次执行的 snapshot
yuangs replay exec_1768820380225_rgts34981 --explain --dry > snapshot.txt
```

Snapshots 可用于：
- ✅ 回归测试
- ✅ 输出格式验证
- ✅ 文档示例
- ✅ 审计线索

### 4. 终端录制与审计 (.cast)

Yuangs 采用标准的 [asciinema](https://asciinema.org/) 兼容格式进行会话录制。

**审计日志包含：**
- **行为流**：完整的终端输入/输出，支持 `replay`。
- **治理上下文**：记录哪些命令被拦截、哪些被批准。
- **AI 摘要**：自动为繁杂的操作记录生成可阅读的 Markdown 摘要。

---

## 💡 使用场景示例

### 场景 A：智能调试

```bash
@!build.sh
# 系统返回报错…

上面的错误是什么意思？
```

AI 将结合 **build.sh 内容 + 实际输出** 进行分析。

---

### 场景 B：命令生成

```bash
ai -e "查找当前目录下大于 100M 的文件"
```

AI 生成建议命令（如 `find . -type f -size +100M`），
**存入剪贴板，等待你确认执行。**

---

### 场景 C：项目审计

```bash
#src/
分析这些模块的功能
```

AI 在**显式授权**下读取目录内容并生成结构分析。

---

## 📝 实现说明

### Explain Output v1

**文件**：`src/core/explain.ts`

**关键设计**：
- 纯函数（无副作用）
- 无全局状态的外部依赖
- 使用现有的 `ExecutionRecord` 结构
- 稳定格式（版本化）

---

### Replay Diff

**文件**：`src/core/replayDiff.ts`

**关键设计**：
- 比较 Decision、Model 和 Skills 层
- 显示 added/removed/changed 技能
- 语义 diff（非 token 级别）
- 与 Explain v1 格式兼容

---

### Skills Control

**文件**：`src/agent/skills.ts`

**关键变更**：
- 向 `Skill` 接口添加 `enabled: boolean` 字段
- 导出 `computeSkillScore()` 供 CLI 使用
- `getRelevantSkills()` 过滤禁用的技能

---

## 📦 安装与配置

```bash
npm install -g yuangs
```

常用配置：

```bash
yuangs config defaultModel Assistant
yuangs config accountType pro
```

---

## 🗓️ 近期更新（Changelog）

- **v2.40.0** (2026‑01‑20)
  - **Governance Refactor**: 实现三阶段执行模型（Pre-Exec 验证 -> Exec 提交 -> Post-Exec 报告）
  - **语义级事实源**: 确保 `Git Result` 与 `Snapshot Verification` 物理分区，消除语义歧义
  - **鲁棒性修复**: 修复了 Git 统计解析及暂存区变更检测失效的 Bug
- **v2.29.0** (2026‑01‑20)
  - 新增 Explainability 功能（`explain` 命令）
  - 新增 Replay++ 支持（`--dry`, `--explain`, `--diff`）
  - 新增 Skills 管理命令（`skills list/explain/disable/enable`）
  - 引入 Explain Output Spec v1 规范
  - 实现 Replay Diff 功能
- **v2.11.0** (2026‑01‑18)
  - 新增 40+ Shell 内置命令支持（cd, pwd, ls, git 等）
- **v2.10.0** (2026‑01‑18)
  - 引入 Shell 交互内核、Ghost Text 与插件系统
- **v1.3.67** (2026‑01‑17)
  - 新增 `@` 文件选择与 `#` 目录读取功能

---

## ✅ Phase 2 完成清单

所有 Phase 2 目标已完成：

- [x] Explainability（ExecutionRecord 级别）
- [x] Replay dry / explain / strict
- [x] Skill scoring & enable 标志
- [x] 所有三个功能的 CLI 集成
- [x] Replay diff 实现
- [x] Skills enabled 过滤
- [x] Explain v1 规范
- [x] Snapshot 测试能力

**下一阶段**：Phase 3 - 高级治理与项目级智能

---

## 📚 更多信息

- **设计原理**: [docs/implementation_principles.md](docs/implementation_principles.md)
- **场景示例**: [docs/scenarios.md](docs/scenarios.md)
- **执行语义**: [docs/semantics.md](docs/semantics.md)
- **非目标**: [docs/non-goals.md](docs/non-goals.md)
- **威胁模型**: [docs/threat_model.md](docs/threat_model.md)
- **变更日志**: [docs/CHANGELOG.md](docs/CHANGELOG.md)
- **Shell 补全**: [docs/tab_completion_guide.md](docs/tab_completion_guide.md)
- **上下文优化**: [docs/context_optimization_analysis.md](docs/context_optimization_analysis.md)
- **代理管道**: [docs/AGENT_PIPELINE.md](docs/AGENT_PIPELINE.md)
- **上下文管理**: [docs/context_management.md](docs/context_management.md)

---

## ⚖️ 维护者

**@yuanguangshan**

> **AI 提供思路，人类掌控执行。**
> 这不是妥协，而是对工程理性的尊重。

---

## 状态

`yuangs` 正在积极演进中。
核心治理模型已稳定；接口仍在优化中。

欢迎贡献、想法和有原则的批评。

> **"AI 除非被明确要求，否则不应该比输入看起来更聪明。"**

---

## 🔐 Code Change Governance System

The governance system provides safe, auditable code changes with human oversight. All features follow constitutional principles and have been fully verified.

### Key Features

- ✅ **Three-Phase Model**: 物理分区 Pre-Exec (验证), Exec (提交), Post-Exec (审计)
- ✅ **Proposal-First**: All changes start as proposals, no execution without review
- ✅ **Human-in-the-Loop**: Explicit approval with diff preview and risk assessment
- ✅ **Snapshot Safety**: Automatic rollback on failure
- ✅ **Strict Truth Sources**: 明确区分 Patch Truth, Snapshot Truth 与 Git Truth
- ✅ **Audit Trail**: Complete lifecycle tracking for every action

### Demo Summary

| Demo # | Feature | Status |
--------|---------|--------|
| 1 | Diff creation | ✅ Working |
| 2 | Proposal | ✅ Working |
| 3 | List actions | ✅ Working |
| 4 | Approval with review | ✅ Working |
| 5 | Execution with snapshot | ✅ Working |
| 6 | Failure and rollback | ✅ Working |
| 7 | Action status | ✅ Working |
| 8 | Full workflow | ✅ Working |
| 9 | State invariants | ✅ Working |
| 10 | Capability tokens | ✅ Working |
| 11 | Crash recovery | ✅ Working |
| 12 | Persistence audit | ✅ Working |
| 13 | Risk assessment | ✅ Working |

### Quick Start

```bash
# Propose a code change
yuangs diff-edit propose /path/to/patch.patch --rationale "Your rationale"

# List pending actions
yuangs diff-edit list

# Review and approve
yuangs diff-edit approve <action-id>

# Execute with safety
yuangs diff-edit exec <action-id>
```

### Documentation

- 📖 **Complete Demo Guide**: [DEMO.md](DEMO.md) - Detailed runnable examples for all features
- ✅ **Verification Report**: [VERIFICATION_REPORT.md](VERIFICATION_REPORT.md) - Implementation status confirmation

### Available Commands

```bash
yuangs diff-edit propose <file>     # Submit a diff for review
yuangs diff-edit list               # View all actions
yuangs diff-edit approve <id>       # Review and approve
yuangs diff-edit exec <id>          # Execute approved action
yuangs diff-edit status <id>        # Check action status
```

---

diff-edit使本项目有了质的变化。^-^

// test change

```
```

---

## Assistant (Sisyphus · glm-4.7 · 8.1s)

_Thinking:_

好的，我现在需要收集探索任务的结果来了解git相关功能。让我检查每个探索任务的输出。

```
Tool: background_output

**Input:**
```json
{
  "task_id": "bg_7c6a03ca"
}
```
**Output:**
```
# Task Status

| Field | Value |
|-------|-------|
| Task ID | `bg_7c6a03ca` |
| Description | Explore project structure and architecture |
| Agent | explore |
| Status | **running** |
| Duration | 24s |
| Session ID | `ses_3faea4dd4ffekU8qllclxV1A91` |


> **Note**: No need to wait explicitly - the system will notify you when this task completes.
## Original Prompt

```
Explore the project structure and identify the overall architecture. What type of project is this? What is the main purpose? List the key directories and their roles.
```
```
```

```
Tool: background_output

**Input:**
```json
{
  "task_id": "bg_1351af21"
}
```
**Output:**
```
# Task Status

| Field | Value |
|-------|-------|
| Task ID | `bg_1351af21` |
| Description | Find all git-related functionality |
| Agent | explore |
| Status | **running** |
| Duration | 19s |
| Session ID | `ses_3faea3a00ffeIdnBcqTpQtmvEE` |


> **Note**: No need to wait explicitly - the system will notify you when this task completes.
## Original Prompt

```
Find ALL git-related functionality in this codebase. Search for:
- Files containing git operations (git commands, git APIs)
- Git-related dependencies in package.json or similar files
- Git hooks configuration files
- Git utilities or helper functions
- Files that interact with git in any way

Provide a comprehensive list of all git-related code and configuration.
```
```
```

```
Tool: background_output

**Input:**
```json
{
  "task_id": "bg_79774a55"
}
```
**Output:**
```
# Task Status

| Field | Value |
|-------|-------|
| Task ID | `bg_79774a55` |
| Description | Analyze git implementation patterns |
| Agent | explore |
| Status | **running** |
| Duration | 8s |
| Session ID | `ses_3faea105fffey4XFkJad2PWwsm` |


> **Note**: No need to wait explicitly - the system will notify you when this task completes.
## Original Prompt

```
Analyze how git is actually used in the codebase. Look for:
- Git command execution patterns (e.g., exec('git ...'), child_process.spawn with git)
- Git library usage (e.g., simple-git, nodegit, isomorphic-git)
- Git state management and tracking
- Git operations implemented (commit, push, pull, clone, status, etc.)

Detail the implementation approach and patterns used.
```
```
```

---

## Assistant (Sisyphus · glm-4.7 · 6.1s)

_Thinking:_

任务还在运行中。让我等一下，然后再获取结果。同时，我可以先查看一些可能的git相关文件。

```
Tool: glob

**Input:**
```json
{
  "pattern": "**/*git*.{ts,js,json}"
}
```
**Output:**
```
Found 6 file(s)

./dist/commands/gitCommands.d.ts
./dist/commands/gitCommands.js
./dist/commands/gitContext.d.ts
./dist/commands/gitContext.js
./src/commands/gitCommands.ts
./src/commands/gitContext.ts
```
```

```
Tool: glob

**Input:**
```json
{
  "pattern": "**/src/**/git*"
}
```
**Output:**
```
Found 2 file(s)

./src/commands/gitCommands.ts
./src/commands/gitContext.ts
```
```

---

## Assistant (Sisyphus · glm-4.7 · 5.9s)

_Thinking:_

很好，找到了git相关的文件。让我读取这些文件来了解git功能的实现。

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/ygs/npm_yuangs/src/commands/gitCommands.ts"
}
```
**Output:**
```
<file>
00001| import { Command } from 'commander';
00002| import { registerCommitCommand } from './git/commit';
00003| import { registerReviewCommand } from './git/review';
00004| import { registerStatusCommand } from './git/status';
00005| import { registerBranchCommand } from './git/branch';
00006| import { registerPlanCommand } from './git/plan';
00007| import { registerExecCommand } from './git/exec';
00008| import { registerAutoCommand } from './git/auto';
00009| 
00010| /**
00011|  * 注册 Git 相关命令
00012|  */
00013| export function registerGitCommands(program: Command) {
00014|     const gitCmd = program
00015|         .command('git')
00016|         .description('Git 集成工具 - 智能提交、代码审查、分支管理、自动化工作流')
00017|         .action((options: any, cmd: any) => {
00018|             if (cmd.args.length === 0) {
00019|                 cmd.help();
00020|             }
00021|         });
00022| 
00023|     registerCommitCommand(gitCmd);
00024|     registerReviewCommand(gitCmd);
00025|     registerStatusCommand(gitCmd);
00026|     registerBranchCommand(gitCmd);
00027|     registerPlanCommand(gitCmd);
00028|     registerExecCommand(gitCmd);
00029|     registerAutoCommand(gitCmd);
00030| }
00031| 

(End of file - total 31 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/ygs/npm_yuangs/src/commands/gitContext.ts"
}
```
**Output:**
```
<file>
00001| import { exec } from 'child_process';
00002| import { promisify } from 'util';
00003| 
00004| const execAsync = promisify(exec);
00005| 
00006| async function run(cmd: string): Promise<string | null> {
00007|     try {
00008|         const { stdout } = await execAsync(cmd, { maxBuffer: 1024 * 1024 });
00009|         return stdout.trim() || null;
00010|     } catch {
00011|         return null;
00012|     }
00013| }
00014| 
00015| export async function getGitContext() {
00016|     const staged = await run('git diff --staged');
00017|     const unstaged = await run('git diff');
00018| 
00019|     if (!staged && !unstaged) return null;
00020| 
00021|     let result = `以下是 Git 变更内容：\n`;
00022| 
00023|     if (staged) {
00024|         result += `\n【已暂存】\n\`\`\`diff\n${staged}\n\`\`\`\n`;
00025|     }
00026| 
00027|     if (unstaged) {
00028|         result += `\n【未暂存】\n\`\`\`diff\n${unstaged}\n\`\`\`\n`;
00029|     }
00030| 
00031|     return result;
00032| }
00033| 

(End of file - total 33 lines)
</file>
```
```

---

## Assistant (Sisyphus · glm-4.7 · 2.9s)

_Thinking:_

很好，现在我看到了主入口文件和gitContext。让我继续查看git目录下的具体实现文件。

```
Tool: glob

**Input:**
```json
{
  "pattern": "src/commands/git/*.ts"
}
```
**Output:**
```
Found 10 file(s)

./src/commands/git/review.ts
./src/commands/git/auto.ts
./src/commands/git/exec.ts
./src/commands/git/errors.ts
./src/commands/git/utils.ts
./src/commands/git/constants.ts
./src/commands/git/plan.ts
./src/commands/git/branch.ts
./src/commands/git/status.ts
./src/commands/git/commit.ts
```
```

---

## Assistant (Sisyphus · glm-4.7 · 41.8s)

_Thinking:_

好的，找到了所有git相关的实现文件。让我逐一读取这些文件来全面了解git功能的实现。

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/ygs/npm_yuangs/src/commands/git/commit.ts"
}
```
**Output:**
```
<file>
00001| import { Command } from 'commander';
00002| import chalk from 'chalk';
00003| import ora from 'ora';
00004| import { GitService } from '../../core/git/GitService';
00005| import { CommitMessageGenerator } from '../../core/git/CommitMessageGenerator';
00006| import { getRouter } from '../../core/modelRouter';
00007| 
00008| export function registerCommitCommand(gitCmd: Command) {
00009|     // git commit - 智能生成 commit message
00010|     gitCmd
00011|         .command('commit')
00012|         .description('智能生成 commit message 并提交')
00013|         .option('-a, --all', '暂存所有变更')
00014|         .option('-d, --detailed', '生成详细的 commit message')
00015|         .option('-t, --type <type>', '指定 commit 类型 (feat/fix/docs/etc)')
00016|         .option('-s, --scope <scope>', '指定影响范围')
00017|         .option('--dry-run', '只生成 message,不实际提交')
00018|         .option('--no-ai', '不使用 AI,使用规则生成')
00019|         .action(async (options) => {
00020|             const spinner = ora('初始化 Git 服务...').start();
00021| 
00022|             try {
00023|                 const gitService = new GitService();
00024| 
00025|                 // 检查是否在 Git 仓库中
00026|                 if (!(await gitService.isGitRepository())) {
00027|                     spinner.fail('当前目录不是 Git 仓库');
00028|                     return;
00029|                 }
00030| 
00031|                 // 检查是否有变更
00032|                 const diff = await gitService.getDiff();
00033|                 if (!diff.staged && !diff.unstaged) {
00034|                     spinner.fail('没有可提交的变更');
00035|                     return;
00036|                 }
00037| 
00038|                 // 如果需要暂存所有变更
00039|                 if (options.all) {
00040|                     spinner.text = '暂存所有变更...';
00041|                     await gitService.stageAll();
00042|                 }
00043| 
00044|                 // 检查是否有已暂存的变更
00045|                 const stagedDiff = await gitService.getDiff();
00046|                 if (!stagedDiff.staged) {
00047|                     spinner.fail('没有已暂存的变更,请先使用 git add 或 --all 选项');
00048|                     return;
00049|                 }
00050| 
00051|                 spinner.text = '生成 commit message...';
00052| 
00053|                 const router = options.ai !== false ? getRouter() : undefined;
00054|                 const generator = new CommitMessageGenerator(gitService, router);
00055| 
00056|                 const result = await generator.generate({
00057|                     detailed: options.detailed,
00058|                     type: options.type,
00059|                     scope: options.scope,
00060|                 });
00061| 
00062|                 spinner.succeed('Commit message 生成完成');
00063| 
00064|                 // 显示生成的 message
00065|                 console.log(chalk.bold.cyan('\n📝 生成的 Commit Message:\n'));
00066|                 console.log(chalk.white(result.full));
00067|                 console.log(chalk.gray(`\n变更统计: ${result.summary.filesChanged} 个文件, +${result.summary.insertions}/-${result.summary.deletions} 行\n`));
00068| 
00069|                 if (options.dryRun) {
00070|                     console.log(chalk.yellow('🔍 Dry run 模式,未实际提交'));
00071|                     return;
00072|                 }
00073| 
00074|                 // 执行提交
00075|                 const commitSpinner = ora('提交变更...').start();
00076|                 try {
00077|                     await gitService.commit(result.full);
00078|                     commitSpinner.succeed(chalk.green('✅ 提交成功!'));
00079| 
00080|                     // 显示提交信息
00081|                     const hash = await gitService.getCurrentCommitHash();
00082|                     console.log(chalk.gray(`Commit: ${hash.substring(0, 7)}`));
00083|                 } catch (error: any) {
00084|                     commitSpinner.fail(`提交失败: ${error.message}`);
00085|                 }
00086|             } catch (error: any) {
00087|                 spinner.fail(`错误: ${error.message}`);
00088|                 process.exit(1);
00089|             }
00090|         });
00091| }
00092| 

(End of file - total 92 lines)
</file>

[Project README: /Users/ygs/npm_yuangs/src/commands/git/README.md]
# Git 命令模块

本目录包含 Git 相关命令的实现。

## 文件结构

### 命令文件
- `auto.ts` - 自动化 Git 工作流
- `branch.ts` - 分支管理命令
- `commit.ts` - 提交相关命令
- `exec.ts` - 执行 Git 命令
- `plan.ts` - AI 驱动的开发规划
- `review.ts` - AI 代码审查
- `status.ts` - Git 状态查看

### 共享模块
- `constants.ts` - 常量配置
  - Diff 行数估算配置
  - 安全扫描配置
  - 能力等级显示映射
  
- `utils.ts` - 工具函数
  - `cleanLLMOutput()` - 清理 LLM 输出
  - `deduplicateFiles()` - 文件去重
  - `getCapabilityLevelDisplay()` - 能力等级显示
  
- `errors.ts` - 自定义错误类型
  - `GitError` - 基础 Git 错误
  - `NoChangesFoundError` - 未找到变更
  - `CommitNotFoundError` - Commit 不存在
  - `NoReviewContentError` - 无审查内容

## 设计原则

1. **关注点分离**: 命令逻辑、配置、工具函数、错误处理分离
2. **可维护性**: 常量集中管理，避免魔法数字
3. **可复用性**: 提取通用逻辑为工具函数
4. **类型安全**: 使用 TypeScript 和自定义错误类型
5. **可测试性**: 函数职责单一，易于测试

## 使用示例

### 使用常量
```typescript
import { DIFF_ESTIMATION, SECURITY_SCAN } from './constants';

const estimatedLines = fileCount * DIFF_ESTIMATION.LINES_PER_FILE_DEFAULT;
const limit = pLimit(SECURITY_SCAN.MAX_CONCURRENT);
```

### 使用工具函数
```typescript
import { cleanLLMOutput, deduplicateFiles, getCapabilityLevelDisplay } from './utils';

const cleaned = cleanLLMOutput(rawOutput);
const uniqueFiles = deduplicateFiles([...staged, ...unstaged]);
const displayName = getCapabilityLevelDisplay(level);
```

### 使用自定义错误
```typescript
import { NoChangesFoundError, isNoChangesFoundError } from './errors';

try {
  // ... 代码
} catch (error) {
  if (isNoChangesFoundError(error)) {
    console.log('未找到变更');
  }
}
```

## 最近更新

- 2026-01-28: 根据代码审查结论进行系统性优化
  - 创建 `constants.ts` 集中管理配置
  - 创建 `utils.ts` 提取通用逻辑
  - 创建 `errors.ts` 实现类型安全的错误处理
  - 优化 `plan.ts` 和 `review.ts`，降低复杂度

```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/ygs/npm_yuangs/src/commands/git/review.ts"
}
```
**Output:**
```
<file>
00001| import { Command } from 'commander';
00002| import chalk from 'chalk';
00003| import ora from 'ora';
00004| import fs from 'fs';
00005| import fsPromises from 'fs/promises';
00006| import path from 'path';
00007| import pLimit from 'p-limit';
00008| import { GitService } from '../../core/git/GitService';
00009| import { CodeReviewer, ReviewLevel, IssueSeverity } from '../../core/git/CodeReviewer';
00010| import { getRouter } from '../../core/modelRouter';
00011| import { SecurityScanner, SecurityIssueType } from '../../core/security/SecurityScanner';
00012| import { SECURITY_SCAN } from './constants';
00013| import { NoChangesFoundError, NoReviewContentError, isNoChangesFoundError, isNoReviewContentError } from './errors';
00014| 
00015| /**
00016|  * 处理 commit 审查逻辑
00017|  * 
00018|  * 将 commit 审查流程提取为独立函数，降低主函数复杂度
00019|  */
00020| async function handleCommitReview(
00021|     options: any,
00022|     gitService: GitService,
00023|     spinner: any
00024| ): Promise<void> {
00025|     spinner.text = '获取 commit 信息...';
00026|     const commitInfo = await gitService.getCommitInfo(options.commit);
00027| 
00028|     if (!commitInfo) {
00029|         spinner.fail(`未找到 commit: ${options.commit}`);
00030|         console.log(chalk.yellow('\n💡 提示：'));
00031|         console.log('  • 使用完整的 commit hash');
00032|         console.log('  • 或使用引用，如 HEAD~1, HEAD~2, etc.');
00033|         return;
00034|     }
00035| 
00036|     console.log(chalk.cyan(`\n📦 审查 Commit:`));
00037|     console.log(chalk.white(`  Hash: ${commitInfo.hash.substring(0, 7)}`));
00038|     console.log(chalk.white(`  Author: ${commitInfo.author}`));
00039|     console.log(chalk.white(`  Date: ${commitInfo.date}`));
00040|     console.log(chalk.white(`  Message: ${commitInfo.message}\n`));
00041| 
00042|     // 跳过安全扫描（commit 已提交，不需要）
00043|     // 注意：这是一个设计决策，假设已提交的代码已经过安全审查
00044|     // 如果需要对历史 commit 进行安全扫描，可以添加 --security 选项
00045|     spinner.text = '执行代码审查...';
00046|     const router = getRouter();
00047|     const reviewer = new CodeReviewer(gitService, router);
00048| 
00049|     const level = options.level as ReviewLevel;
00050| 
00051|     try {
00052|         const result = await reviewer.reviewCommit(options.commit, level);
00053| 
00054|         spinner.succeed('代码审查完成');
00055| 
00056|         console.log(chalk.bold.cyan('\n🔍 代码审查报告\n'));
00057|         const scoreColor = getScoreColor(result.score);
00058|         console.log(chalk.bold('评分: ') + scoreColor(result.score.toString()) + chalk.bold('/100'));
00059|         console.log(chalk.gray(`审查文件: ${result.filesReviewed} 个`));
00060|         console.log(chalk.gray(`置信度: ${(result.confidence * 100).toFixed(1)}%`));
00061| 
00062|         if (result.degradation?.applied) {
00063|             console.log(chalk.yellow(`降级: ${result.degradation.originalLevel} → ${result.degradation.targetLevel}`));
00064|             console.log(chalk.gray(`原因: ${result.degradation.reason}`));
00065|         }
00066| 
00067|         console.log();
00068| 
00069|         console.log(chalk.bold('📋 总体评价:'));
00070|         console.log(chalk.white(`  ${result.summary}\n`));
00071| 
00072|         if (result.issues.length > 0) {
00073|             console.log(chalk.bold.red(`⚠️  发现 ${result.issues.length} 个问题:\n`));
00074|             for (const issue of result.issues) {
00075|                 const icon = getSeverityIcon(issue.severity);
00076|                 const color = getSeverityColor(issue.severity);
00077|                 console.log(color(`  ${icon} [${issue.severity.toUpperCase()}] ${issue.file}${issue.line ? `:${issue.line}` : ''}`));
00078|                 console.log(color(`     ${issue.message}`));
00079|                 if (issue.suggestion) {
00080|                     console.log(chalk.gray(`     💡 ${issue.suggestion}`));
00081|                 }
00082|                 console.log();
00083|             }
00084|         } else {
00085|             console.log(chalk.green('✅ 未发现明显问题\n'));
00086|         }
00087| 
00088|         if (result.strengths.length > 0) {
00089|             console.log(chalk.bold.green('👍 优点:\n'));
00090|             for (const strength of result.strengths) {
00091|                 console.log(chalk.green(`  ✓ ${strength}`));
00092|             }
00093|             console.log();
00094|         }
00095| 
00096|         if (result.recommendations.length > 0) {
00097|             console.log(chalk.bold.yellow('💡 建议:\n'));
00098|             for (const rec of result.recommendations) {
00099|                 console.log(chalk.yellow(`  • ${rec}`));
00100|             }
00101|             console.log();
00102|         }
00103| 
00104|         // 保存审查结果
00105|         if (options.save !== false) {
00106|             await saveCommitReviewToFile(result, level, options, gitService, commitInfo);
00107|         }
00108|     } catch (error: any) {
00109|         if (isNoChangesFoundError(error)) {
00110|             spinner.fail('该 commit 没有代码变更');
00111|         } else {
00112|             throw error;
00113|         }
00114|     }
00115| }
00116| 
00117| 
00118| export function registerReviewCommand(gitCmd: Command) {
00119|     // git review - AI 代码审查
00120|     gitCmd
00121|         .command('review')
00122|         .description('AI 代码审查')
00123|         .option('-l, --level <level>', '审查级别 (quick/standard/deep)', 'standard')
00124|         .option('-f, --file <file>', '审查特定文件')
00125|         .option('-u, --unstaged', '审查未暂存的变更')
00126|         .option('-c, --commit <commit>', '审查指定的 commit (hash 或引用，如 HEAD~1)')
00127|         .option('--no-ai', '禁用 AI (将显示变更摘要)')
00128|         .option('--no-save', '不保存审查结果到 git_reviews.md')
00129|         .option('--force', '忽略安全警告继续执行')
00130|         .option('--no-security', '跳过安全扫描')
00131|         .action(async (options) => {
00132|             if (options.ai === false) {
00133|                 const gitService = new GitService();
00134|                 const diff = await gitService.getDiff();
00135|                 const files = options.unstaged ? diff.files.unstaged : diff.files.staged;
00136| 
00137|                 console.log(chalk.yellow('\nℹ️  AI 代码审查已禁用。'));
00138|                 console.log(chalk.white(`本次涉及变更文件数: ${files.length} 个`));
00139|                 console.log(chalk.gray('💡 建议使用 "git diff" 或 IDE 插件进行人工审查。'));
00140|                 return;
00141|             }
00142| 
00143|             const spinner = ora('初始化代码审查...').start();
00144| 
00145|             try {
00146|                 const gitService = new GitService();
00147| 
00148|                 if (!(await gitService.isGitRepository())) {
00149|                     spinner.fail('当前目录不是 Git 仓库');
00150|                     return;
00151|                 }
00152| 
00153|                 // 处理 commit 审查模式
00154|                 if (options.commit) {
00155|                     await handleCommitReview(options, gitService, spinner);
00156|                     return;
00157|                 }
00158| 
00159|                 const securityScanner = new SecurityScanner();
00160|                 const diff = await gitService.getDiff();
00161|                 const files = options.unstaged ? diff.files.unstaged : diff.files.staged;
00162| 
00163|                 // 安全扫描（如果未禁用）
00164|                 if (options.security !== false) {
00165|                     spinner.text = '执行安全扫描...';
00166|                     const scanResult = await performSecurityScan(gitService, securityScanner, files, options);
00167| 
00168|                     if (scanResult.hasIssues && !scanResult.shouldContinue) {
00169|                         spinner.stop();
00170|                         return;
00171|                     }
00172|                     spinner.succeed('安全扫描完成');
00173|                 }
00174| 
00175|                 spinner.text = '加载 AI 模型配置...';
00176|                 const router = getRouter();
00177|                 const reviewer = new CodeReviewer(gitService, router);
00178| 
00179|                 const level = options.level as ReviewLevel;
00180|                 spinner.text = `执行 ${level} 级别代码审查...`;
00181| 
00182|                 let result;
00183|                 if (options.file) {
00184|                     result = await reviewer.reviewFile(options.file, level);
00185|                 } else {
00186|                     result = await reviewer.review(level, !options.unstaged);
00187|                 }
00188| 
00189|                 spinner.succeed('代码审查完成');
00190| 
00191|                 console.log(chalk.bold.cyan('\n🔍 代码审查报告\n'));
00192|                 const scoreColor = getScoreColor(result.score);
00193|                 console.log(chalk.bold('评分: ') + scoreColor(result.score.toString()) + chalk.bold('/100'));
00194|                 console.log(chalk.gray(`审查文件: ${result.filesReviewed} 个`));
00195|                 console.log(chalk.gray(`置信度: ${(result.confidence * 100).toFixed(1)}%`));
00196| 
00197|                 if (result.degradation?.applied) {
00198|                     console.log(chalk.yellow(`降级: ${result.degradation.originalLevel} → ${result.degradation.targetLevel}`));
00199|                     console.log(chalk.gray(`原因: ${result.degradation.reason}`));
00200|                 }
00201| 
00202|                 console.log();
00203| 
00204|                 console.log(chalk.bold('📋 总体评价:'));
00205|                 console.log(chalk.white(`  ${result.summary}\n`));
00206| 
00207|                 if (result.issues.length > 0) {
00208|                     console.log(chalk.bold.red(`⚠️  发现 ${result.issues.length} 个问题:\n`));
00209|                     for (const issue of result.issues) {
00210|                         const icon = getSeverityIcon(issue.severity);
00211|                         const color = getSeverityColor(issue.severity);
00212|                         console.log(color(`  ${icon} [${issue.severity.toUpperCase()}] ${issue.file}${issue.line ? `:${issue.line}` : ''}`));
00213|                         console.log(color(`     ${issue.message}`));
00214|                         if (issue.suggestion) {
00215|                             console.log(chalk.gray(`     💡 ${issue.suggestion}`));
00216|                         }
00217|                         console.log();
00218|                     }
00219|                 } else {
00220|                     console.log(chalk.green('✅ 未发现明显问题\n'));
00221|                 }
00222| 
00223|                 if (result.strengths.length > 0) {
00224|                     console.log(chalk.bold.green('👍 优点:\n'));
00225|                     for (const strength of result.strengths) {
00226|                         console.log(chalk.green(`  ✓ ${strength}`));
00227|                     }
00228|                     console.log();
00229|                 }
00230| 
00231|                 if (result.recommendations.length > 0) {
00232|                     console.log(chalk.bold.yellow('💡 建议:\n'));
00233|                     for (const rec of result.recommendations) {
00234|                         console.log(chalk.yellow(`  • ${rec}`));
00235|                     }
00236|                     console.log();
00237|                 }
00238| 
00239|                 // 保存审查结果到 git_reviews.md
00240|                 if (options.save !== false) {
00241|                     await saveReviewToFile(result, level, options, gitService);
00242|                 }
00243|             } catch (error: any) {
00244|                 if (error.message.includes('requires model configuration') || error.message.includes('not configured')) {
00245|                     spinner.fail('当前未配置 AI 模型，无法执行代码审查');
00246|                     console.log(chalk.yellow('请运行 "yuangs config" 配置 AI 模型，或使用其他命令。'));
00247|                 } else if (error.message.includes('Deep review is not recommended')) {
00248|                     spinner.fail('代码变更较多，跳过 deep 审查');
00249|                     console.log(chalk.yellow('💡 建议：'));
00250|                     console.log('  • 使用 --level standard');
00251|                     console.log('  • 或指定 --file 进行重点审查');
00252|                 } else if (isNoReviewContentError(error)) {
00253|                     const gitService = new GitService();
00254|                     const diff = await gitService.getDiff();
00255| 
00256|                     if (!options.unstaged && diff.files.unstaged.length > 0) {
00257|                         spinner.warn('当前没有已暂存 (staged) 的文件变更');
00258|                         console.log(chalk.cyan('\n💡 建议：'));
00259|                         console.log(`  • 运行 ${chalk.green('git add <file>')} 将文件加入暂存区`);
00260|                         console.log(`  • 或运行 ${chalk.green('yuangs git review --unstaged')} 直接审查未暂存的变更`);
00261|                     } else {
00262|                         spinner.fail('没有检测到任何代码变更');
00263|                     }
00264|                 } else {
00265|                     spinner.fail(`错误: ${error.message}`);
00266|                 }
00267|                 process.exit(1);
00268|             }
00269|         });
00270| }
00271| 
00272| // 辅助函数
00273| function getScoreColor(score: number) {
00274|     if (score >= 90) return chalk.green;
00275|     if (score >= 70) return chalk.yellow;
00276|     return chalk.red;
00277| }
00278| 
00279| function getSeverityIcon(severity: IssueSeverity): string {
00280|     const icons = {
00281|         [IssueSeverity.INFO]: 'ℹ️',
00282|         [IssueSeverity.WARNING]: '⚠️',
00283|         [IssueSeverity.ERROR]: '❌',
00284|         [IssueSeverity.CRITICAL]: '🚨',
00285|     };
00286|     return icons[severity] || '•';
00287| }
00288| 
00289| function getSeverityColor(severity: IssueSeverity) {
00290|     const colors = {
00291|         [IssueSeverity.INFO]: chalk.blue,
00292|         [IssueSeverity.WARNING]: chalk.yellow,
00293|         [IssueSeverity.ERROR]: chalk.red,
00294|         [IssueSeverity.CRITICAL]: chalk.bgRed.white,
00295|     };
00296|     return colors[severity] || chalk.white;
00297| }
00298| 
00299| /**
00300|  * 保存审查结果到 git_reviews.md
00301|  */
00302| async function saveReviewToFile(
00303|     result: any,
00304|     level: ReviewLevel,
00305|     options: any,
00306|     gitService: GitService
00307| ): Promise<void> {
00308|     const filePath = path.join(process.cwd(), 'git_reviews.md');
00309|     const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
00310| 
00311|     try {
00312|         // 获取分支信息
00313|         const branchInfo = await gitService.getBranchInfo();
00314|         const currentCommit = await gitService.getCurrentCommitHash().catch(() => 'N/A');
00315| 
00316|         // 构建 Markdown 内容
00317|         const markdownContent = formatReviewAsMarkdown({
00318|             timestamp,
00319|             level,
00320|             branch: branchInfo.current,
00321|             commit: currentCommit.substring(0, 7),
00322|             staged: !options.unstaged,
00323|             files: options.file || `${result.filesReviewed} 个文件`,
00324|             score: result.score,
00325|             summary: result.summary,
00326|             issues: result.issues,
00327|             strengths: result.strengths,
00328|             recommendations: result.recommendations
00329|         });
00330| 
00331|         // 读取现有文件内容（如果存在）
00332|         let existingContent = '';
00333|         try {
00334|             existingContent = fs.readFileSync(filePath, 'utf-8');
00335|         } catch (e) {
00336|             // 文件不存在，创建新文件
00337|             existingContent = `> 📝 Git Code Review History\n> Generated by Yuangs CLI\n\n`;
00338|         }
00339| 
00340|         // 添加新的审查记录
00341|         const separator = '\n---\n\n';
00342|         const newContent = existingContent + separator + markdownContent;
00343| 
00344|         // 写入文件
00345|         fs.writeFileSync(filePath, newContent);
00346| 
00347|         console.log(chalk.gray(`\n💾 审查结果已保存到: ${path.relative(process.cwd(), filePath)}`));
00348|     } catch (error: any) {
00349|         console.warn(chalk.yellow(`\n⚠️  保存审查结果失败: ${error.message}`));
00350|     }
00351| }
00352| 
00353| /**
00354|  * 格式化审查结果为 Markdown
00355|  */
00356| function formatReviewAsMarkdown(review: {
00357|     timestamp: string;
00358|     level: ReviewLevel;
00359|     branch?: string;
00360|     commit?: string;
00361|     staged?: boolean;
00362|     files: string;
00363|     score: number;
00364|     summary: string;
00365|     issues: any[];
00366|     strengths: string[];
00367|     recommendations: string[];
00368| }): string {
00369|     const scoreEmoji = review.score >= 90 ? '🌟' : review.score >= 70 ? '👍' : '⚠️';
00370| 
00371|     let md = `## 📋 Code Review - ${review.timestamp}\n\n`;
00372| 
00373|     // 元数据
00374|     md += `**📊 评分:** ${scoreEmoji} ${review.score}/100  \n`;
00375|     md += `**🔧 级别:** ${review.level.toUpperCase()}  \n`;
00376| 
00377|     if (review.branch) {
00378|         md += `**🌿 分支:** \`${review.branch}\`  \n`;
00379|     }
00380| 
00381|     if (review.commit) {
00382|         md += `**💾 提交:** \`${review.commit}\`  \n`;
00383|     }
00384| 
00385|     if (review.staged !== undefined) {
00386|         md += `**📂 范围:** ${review.staged ? '暂存区' : '未暂存'} (${review.files})  \n\n`;
00387|     } else {
00388|         md += `**📂 范围:** ${review.files}  \n\n`;
00389|     }
00390| 
00391|     // 总体评价
00392|     md += `### 📝 总体评价\n\n${review.summary}\n\n`;
00393| 
00394|     // 问题列表
00395|     if (review.issues.length > 0) {
00396|         md += `### ⚠️ 发现的问题 (${review.issues.length})\n\n`;
00397|         review.issues.forEach((issue: any, index) => {
00398|             const severityEmoji: Record<string, string> = {
00399|                 [IssueSeverity.INFO]: 'ℹ️',
00400|                 [IssueSeverity.WARNING]: '⚠️',
00401|                 [IssueSeverity.ERROR]: '❌',
00402|                 [IssueSeverity.CRITICAL]: '🚨',
00403|             };
00404|             const emoji = severityEmoji[issue.severity] || '•';
00405| 
00406|             md += `#### ${index + 1}. [${issue.severity?.toUpperCase() || 'UNKNOWN'}] ${issue.file}${issue.line ? `:${issue.line}` : ''}\n\n`;
00407|             md += `${issue.message}\n\n`;
00408|             if (issue.suggestion) {
00409|                 md += `**💡 建议:** ${issue.suggestion}\n\n`;
00410|             }
00411|             if (issue.snippet) {
00412|                 md += `<details>\n<summary>代码片段</summary>\n\n\`\`\`\n${issue.snippet}\n\`\`\`\n\n</details>\n\n`;
00413|             }
00414|         });
00415|     } else {
00416|         md += `### ✅ 未发现明显问题\n\n`;
00417|     }
00418| 
00419|     // 优点
00420|     if (review.strengths.length > 0) {
00421|         md += `### 👍 优点\n\n`;
00422|         review.strengths.forEach(strength => {
00423|             md += `- ✅ ${strength}\n`;
00424|         });
00425|         md += '\n';
00426|     }
00427| 
00428|     // 建议
00429|     if (review.recommendations.length > 0) {
00430|         md += `### 💡 建议\n\n`;
00431|         review.recommendations.forEach(rec => {
00432|             md += `- ${rec}\n`;
00433|         });
00434|         md += '\n';
00435|     }
00436| 
00437|     // 添加一个跳转链接
00438|     md += `[↑ 返回顶部](#)\n\n`;
00439| 
00440|     return md;
00441| }
00442| 
00443| /**
00444|  * 执行安全扫描
00445|  */
00446| async function performSecurityScan(
00447|     gitService: GitService,
00448|     securityScanner: SecurityScanner,
00449|     files: string[],
00450|     options: any
00451| ): Promise<{ hasIssues: boolean; shouldContinue: boolean }> {
00452|     const repoRoot = await gitService.getRepoRoot();
00453|     const filesToScan = new Map<string, string>();
00454| 
00455|     // 限制扫描文件数量和并发数，避免性能问题
00456|     const limit = pLimit(SECURITY_SCAN.MAX_CONCURRENT);
00457|     const filesToProcess = files.slice(0, SECURITY_SCAN.MAX_SCAN_FILES);
00458| 
00459|     if (files.length > SECURITY_SCAN.MAX_SCAN_FILES) {
00460|         console.log(chalk.yellow(`\nℹ️  文件数量过多，仅扫描前 ${SECURITY_SCAN.MAX_SCAN_FILES} 个文件\n`));
00461|     }
00462| 
00463|     // 使用并发限制异步扫描文件
00464|     const scanPromises = filesToProcess.map(file =>
00465|         limit(async () => {
00466|             const filePath = path.join(repoRoot, file);
00467|             try {
00468|                 const stats = await fsPromises.stat(filePath);
00469|                 if (!stats.isFile()) return null;
00470| 
00471|                 // 限制文件大小，避免扫描大文件
00472|                 if (stats.size > SECURITY_SCAN.MAX_FILE_SIZE) {
00473|                     console.log(chalk.yellow(`⚠️  跳过大文件: ${file} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`));
00474|                     return null;
00475|                 }
00476| 
00477|                 const content = await fsPromises.readFile(filePath, 'utf8');
00478|                 const scanResult = securityScanner.scanAndRedact(content, file);
00479| 
00480|                 if (scanResult.issues.length > 0) {
00481|                     return { file, issues: scanResult.issues };
00482|                 }
00483|                 return null;
00484|             } catch (error: any) {
00485|                 console.warn(chalk.yellow(`Warning: 无法读取文件 ${file}: ${error.message}`));
00486|                 return null;
00487|             }
00488|         })
00489|     );
00490| 
00491|     const results = await Promise.all(scanPromises);
00492| 
00493|     for (const result of results) {
00494|         if (result && result.issues.length > 0) {
00495|             filesToScan.set(result.file, '');
00496|             console.log(chalk.yellow(`⚠️  发现 ${result.issues.length} 个安全问题在 ${result.file}`));
00497|             for (const issue of result.issues) {
00498|                 console.log(chalk.red(`  ${issue.type}: ${issue.description} (line ${issue.line})`));
00499|             }
00500|         }
00501|     }
00502| 
00503|     if (filesToScan.size > 0) {
00504|         console.log(chalk.yellow('\n⚠️  警告：检测到可能的敏感信息！'));
00505|         console.log(chalk.yellow('建议：'));
00506|         console.log(chalk.yellow('  • 移除硬编码的密钥、密码、令牌等敏感信息'));
00507|         console.log(chalk.yellow('  • 使用环境变量或配置文件管理敏感数据'));
00508|         console.log(chalk.yellow('  • 考虑添加到 .gitignore 中\n'));
00509| 
00510|         // 检查是否强制继续
00511|         const shouldContinue = options.force || process.env.YUANGS_AUTO_CONTINUE === 'true';
00512|         if (!shouldContinue) {
00513|             console.log(chalk.cyan('💡 使用 --force 选项可跳过此警告继续执行'));
00514|             console.log(chalk.cyan('💡 或设置环境变量 YUANGS_AUTO_CONTINUE=true\n'));
00515|             return { hasIssues: true, shouldContinue: false };
00516|         } else {
00517|             console.log(chalk.yellow('⚠️  已强制继续，请注意安全风险\n'));
00518|             return { hasIssues: true, shouldContinue: true };
00519|         }
00520|     }
00521| 
00522|     return { hasIssues: false, shouldContinue: true };
00523| }
00524| 
00525| /**
00526|  * 保存 commit 审查结果到 git_reviews.md
00527|  */
00528| async function saveCommitReviewToFile(
00529|     result: any,
00530|     level: ReviewLevel,
00531|     options: any,
00532|     gitService: GitService,
00533|     commitInfo: any
00534| ): Promise<void> {
00535|     const filePath = path.join(process.cwd(), 'git_reviews.md');
00536|     const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
00537| 
00538|     try {
00539|         // 构建 Markdown 内容
00540|         const markdownContent = formatReviewAsMarkdown({
00541|             timestamp,
00542|             level,
00543|             commit: commitInfo.hash.substring(0, 7),
00544|             files: `${result.filesReviewed} 个文件`,
00545|             score: result.score,
00546|             summary: result.summary,
00547|             issues: result.issues,
00548|             strengths: result.strengths,
00549|             recommendations: result.recommendations
00550|         });
00551| 
00552|         // 读取现有文件内容（如果存在）
00553|         let existingContent = '';
00554|         try {
00555|             existingContent = fs.readFileSync(filePath, 'utf-8');
00556|         } catch (e) {
00557|             // 文件不存在，创建新文件
00558|             existingContent = `> 📝 Git Code Review History\n> Generated by Yuangs CLI\n\n`;
00559|         }
00560| 
00561|         // 添加新的审查记录
00562|         const separator = '\n---\n\n';
00563|         const newContent = existingContent + separator + markdownContent;
00564| 
00565|         // 写入文件
00566|         fs.writeFileSync(filePath, newContent);
00567| 
00568|         console.log(chalk.gray(`\n💾 审查结果已保存到: ${path.relative(process.cwd(), filePath)}`));
00569|     } catch (error: any) {
00570|         console.warn(chalk.yellow(`\n⚠️  保存审查结果失败: ${error.message}`));
00571|     }
00572| }
00573| 

(End of file - total 573 lines)
</file>

[Project README: /Users/ygs/npm_yuangs/src/commands/git/README.md]
# Git 命令模块

本目录包含 Git 相关命令的实现。

## 文件结构

### 命令文件
- `auto.ts` - 自动化 Git 工作流
- `branch.ts` - 分支管理命令
- `commit.ts` - 提交相关命令
- `exec.ts` - 执行 Git 命令
- `plan.ts` - AI 驱动的开发规划
- `review.ts` - AI 代码审查
- `status.ts` - Git 状态查看

### 共享模块
- `constants.ts` - 常量配置
  - Diff 行数估算配置
  - 安全扫描配置
  - 能力等级显示映射
  
- `utils.ts` - 工具函数
  - `cleanLLMOutput()` - 清理 LLM 输出
  - `deduplicateFiles()` - 文件去重
  - `getCapabilityLevelDisplay()` - 能力等级显示
  
- `errors.ts` - 自定义错误类型
  - `GitError` - 基础 Git 错误
  - `NoChangesFoundError` - 未找到变更
  - `CommitNotFoundError` - Commit 不存在
  - `NoReviewContentError` - 无审查内容

## 设计原则

1. **关注点分离**: 命令逻辑、配置、工具函数、错误处理分离
2. **可维护性**: 常量集中管理，避免魔法数字
3. **可复用性**: 提取通用逻辑为工具函数
4. **类型安全**: 使用 TypeScript 和自定义错误类型
5. **可测试性**: 函数职责单一，易于测试

## 使用示例

### 使用常量
```typescript
import { DIFF_ESTIMATION, SECURITY_SCAN } from './constants';

const estimatedLines = fileCount * DIFF_ESTIMATION.LINES_PER_FILE_DEFAULT;
const limit = pLimit(SECURITY_SCAN.MAX_CONCURRENT);
```

### 使用工具函数
```typescript
import { cleanLLMOutput, deduplicateFiles, getCapabilityLevelDisplay } from './utils';

const cleaned = cleanLLMOutput(rawOutput);
const uniqueFiles = deduplicateFiles([...staged, ...unstaged]);
const displayName = getCapabilityLevelDisplay(level);
```

### 使用自定义错误
```typescript
import { NoChangesFoundError, isNoChangesFoundError } from './errors';

try {
  // ... 代码
} catch (error) {
  if (isNoChangesFoundError(error)) {
    console.log('未找到变更');
  }
}
```

## 最近更新

- 2026-01-28: 根据代码审查结论进行系统性优化
  - 创建 `constants.ts` 集中管理配置
  - 创建 `utils.ts` 提取通用逻辑
  - 创建 `errors.ts` 实现类型安全的错误处理
  - 优化 `plan.ts` 和 `review.ts`，降低复杂度

```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/ygs/npm_yuangs/src/commands/git/status.ts"
}
```
**Output:**
```
<file>
00001| import { Command } from 'commander';
00002| import chalk from 'chalk';
00003| import { GitService } from '../../core/git/GitService';
00004| 
00005| export function registerStatusCommand(gitCmd: Command) {
00006|     // git status - 增强的状态显示
00007|     gitCmd
00008|         .command('status')
00009|         .description('显示增强的 Git 状态信息')
00010|         .action(async () => {
00011|             try {
00012|                 const gitService = new GitService();
00013| 
00014|                 if (!(await gitService.isGitRepository())) {
00015|                     console.log(chalk.red('当前目录不是 Git 仓库'));
00016|                     return;
00017|                 }
00018| 
00019|                 const [branchInfo, statusSummary, recentCommits] = await Promise.all([
00020|                     gitService.getBranchInfo(),
00021|                     gitService.getStatusSummary(),
00022|                     gitService.getRecentCommits(5),
00023|                 ]);
00024| 
00025|                 console.log(chalk.bold.cyan('\n📊 Git 状态\n'));
00026| 
00027|                 // 分支信息
00028|                 console.log(chalk.bold('🌿 分支:'));
00029|                 console.log(chalk.white(`  当前: ${branchInfo.current}`));
00030|                 if (branchInfo.upstream) {
00031|                     console.log(chalk.gray(`  上游: ${branchInfo.upstream}`));
00032|                     if (branchInfo.ahead > 0) {
00033|                         console.log(chalk.green(`  ↑ 领先 ${branchInfo.ahead} 个提交`));
00034|                     }
00035|                     if (branchInfo.behind > 0) {
00036|                         console.log(chalk.yellow(`  ↓ 落后 ${branchInfo.behind} 个提交`));
00037|                     }
00038|                 }
00039|                 console.log();
00040| 
00041|                 // 变更统计
00042|                 console.log(chalk.bold('📝 变更:'));
00043|                 if (statusSummary.modified > 0) {
00044|                     console.log(chalk.yellow(`  修改: ${statusSummary.modified} 个文件`));
00045|                 }
00046|                 if (statusSummary.added > 0) {
00047|                     console.log(chalk.green(`  新增: ${statusSummary.added} 个文件`));
00048|                 }
00049|                 if (statusSummary.deleted > 0) {
00050|                     console.log(chalk.red(`  删除: ${statusSummary.deleted} 个文件`));
00051|                 }
00052|                 if (statusSummary.untracked > 0) {
00053|                     console.log(chalk.gray(`  未跟踪: ${statusSummary.untracked} 个文件`));
00054|                 }
00055|                 if (Object.values(statusSummary).every(v => v === 0)) {
00056|                     console.log(chalk.green('  工作区干净'));
00057|                 }
00058|                 console.log();
00059| 
00060|                 // 最近提交
00061|                 if (recentCommits.length > 0) {
00062|                     console.log(chalk.bold('📜 最近提交:\n'));
00063|                     for (const commit of recentCommits) {
00064|                         console.log(chalk.gray(`  ${commit.hash.substring(0, 7)}`), chalk.white(commit.message));
00065|                         console.log(chalk.gray(`    ${commit.author} · ${new Date(commit.date).toLocaleString()}`));
00066|                     }
00067|                     console.log();
00068|                 }
00069|             } catch (error: any) {
00070|                 console.error(chalk.red(`错误: ${error.message}`));
00071|                 process.exit(1);
00072|             }
00073|         });
00074| }
00075| 

(End of file - total 75 lines)
</file>

[Project README: /Users/ygs/npm_yuangs/src/commands/git/README.md]
# Git 命令模块

本目录包含 Git 相关命令的实现。

## 文件结构

### 命令文件
- `auto.ts` - 自动化 Git 工作流
- `branch.ts` - 分支管理命令
- `commit.ts` - 提交相关命令
- `exec.ts` - 执行 Git 命令
- `plan.ts` - AI 驱动的开发规划
- `review.ts` - AI 代码审查
- `status.ts` - Git 状态查看

### 共享模块
- `constants.ts` - 常量配置
  - Diff 行数估算配置
  - 安全扫描配置
  - 能力等级显示映射
  
- `utils.ts` - 工具函数
  - `cleanLLMOutput()` - 清理 LLM 输出
  - `deduplicateFiles()` - 文件去重
  - `getCapabilityLevelDisplay()` - 能力等级显示
  
- `errors.ts` - 自定义错误类型
  - `GitError` - 基础 Git 错误
  - `NoChangesFoundError` - 未找到变更
  - `CommitNotFoundError` - Commit 不存在
  - `NoReviewContentError` - 无审查内容

## 设计原则

1. **关注点分离**: 命令逻辑、配置、工具函数、错误处理分离
2. **可维护性**: 常量集中管理，避免魔法数字
3. **可复用性**: 提取通用逻辑为工具函数
4. **类型安全**: 使用 TypeScript 和自定义错误类型
5. **可测试性**: 函数职责单一，易于测试

## 使用示例

### 使用常量
```typescript
import { DIFF_ESTIMATION, SECURITY_SCAN } from './constants';

const estimatedLines = fileCount * DIFF_ESTIMATION.LINES_PER_FILE_DEFAULT;
const limit = pLimit(SECURITY_SCAN.MAX_CONCURRENT);
```

### 使用工具函数
```typescript
import { cleanLLMOutput, deduplicateFiles, getCapabilityLevelDisplay } from './utils';

const cleaned = cleanLLMOutput(rawOutput);
const uniqueFiles = deduplicateFiles([...staged, ...unstaged]);
const displayName = getCapabilityLevelDisplay(level);
```

### 使用自定义错误
```typescript
import { NoChangesFoundError, isNoChangesFoundError } from './errors';

try {
  // ... 代码
} catch (error) {
  if (isNoChangesFoundError(error)) {
    console.log('未找到变更');
  }
}
```

## 最近更新

- 2026-01-28: 根据代码审查结论进行系统性优化
  - 创建 `constants.ts` 集中管理配置
  - 创建 `utils.ts` 提取通用逻辑
  - 创建 `errors.ts` 实现类型安全的错误处理
  - 优化 `plan.ts` 和 `review.ts`，降低复杂度

```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/ygs/npm_yuangs/src/commands/git/branch.ts"
}
```
**Output:**
```
<file>
00001| import { Command } from 'commander';
00002| import chalk from 'chalk';
00003| import ora from 'ora';
00004| import { GitService } from '../../core/git/GitService';
00005| import { getRouter } from '../../core/modelRouter';
00006| 
00007| /**
00008|  * 允许的动态导入路径白名单
00009|  */
00010| const ALLOWED_IMPORTS = [
00011|     '../../core/git/BranchAdvisor'
00012| ] as const;
00013| 
00014| /**
00015|  * 列出分支的公共动作函数
00016|  */
00017| async function listBranchesAction() {
00018|     try {
00019|         const gitService = new GitService();
00020|         if (!(await gitService.isGitRepository())) {
00021|             console.log(chalk.red('当前目录不是 Git 仓库'));
00022|             return;
00023|         }
00024| 
00025|         const [branches, status] = await Promise.all([
00026|             gitService.getBranches(),
00027|             gitService.getStatusSummary()
00028|         ]);
00029| 
00030|         console.log(chalk.bold.cyan('\n🌿 分支列表\n'));
00031| 
00032|         branches.details.forEach(b => {
00033|             const prefix = b.isCurrent ? chalk.green('*') : ' ';
00034|             const name = b.isCurrent ? chalk.green.bold(b.name) : chalk.white(b.name);
00035|             let meta = [];
00036| 
00037|             if (b.upstream) {
00038|                 if (b.ahead) meta.push(chalk.green(`↑${b.ahead}`));
00039|                 if (b.behind) meta.push(chalk.red(`↓${b.behind}`));
00040|                 if (!b.ahead && !b.behind) meta.push(chalk.gray('sync'));
00041|             }
00042| 
00043|             if (b.isCurrent) {
00044|                 const isDirty = status.modified > 0 || status.added > 0 || status.deleted > 0;
00045|                 if (isDirty) meta.push(chalk.yellow('(dirty)'));
00046|                 else meta.push(chalk.green('(clean)'));
00047|             }
00048| 
00049|             const metaStr = meta.length ? ` ${meta.join(' ')}` : '';
00050|             console.log(`${prefix} ${name}${metaStr}`);
00051|             if (b.subject) {
00052|                 console.log(chalk.gray(`    └─ ${b.hash} ${b.subject}`));
00053|             }
00054|         });
00055|         console.log();
00056| 
00057|     } catch (error: any) {
00058|         console.error(chalk.red(`错误: ${error.message}`));
00059|     }
00060| }
00061| 
00062| export function registerBranchCommand(gitCmd: Command) {
00063|     // git branch - 分支管理
00064|     const branchCmd = gitCmd
00065|         .command('branch')
00066|         .description('智能分支管理');
00067| 
00068|     // 关键修复：定义父命令的 action 
00069|     // 当输入 "yuangs git branch" (无子命令) 时触发
00070|     branchCmd.action(async (options: Record<string, any>, cmd: Command) => {
00071|         if (cmd.args.length === 0) {
00072|             await listBranchesAction();
00073|         }
00074|     });
00075| 
00076|     // branch list
00077|     branchCmd
00078|         .command('list')
00079|         .description('列出分支及上下文信息')
00080|         .action(listBranchesAction);
00081| 
00082|     // branch switch
00083|     branchCmd
00084|         .command('switch <branch>')
00085|         .description('安全切换分支')
00086|         .action(async (branchName: string) => {
00087|             try {
00088|                 const gitService = new GitService();
00089|                 if (!(await gitService.isGitRepository())) {
00090|                     console.log(chalk.red('当前目录不是 Git 仓库'));
00091|                     return;
00092|                 }
00093| 
00094|                 // 使用原生 Git 校验
00095|                 if (!(await gitService.isValidBranchName(branchName))) {
00096|                     console.log(chalk.red(`❌ 无效的分支名称: "${branchName}"`));
00097|                     return;
00098|                 }
00099| 
00100|                 const branches = await gitService.getBranches();
00101|                 if (!branches.all.includes(branchName)) {
00102|                     console.log(chalk.red(`❌ 分支 "${branchName}" 不存在`));
00103|                     return;
00104|                 }
00105| 
00106|                 if (branchName === branches.current) {
00107|                     console.log(chalk.yellow(`ℹ️  已经在分支 "${branchName}" 上`));
00108|                     return;
00109|                 }
00110| 
00111|                 const isClean = await gitService.isWorkingTreeClean();
00112|                 if (!isClean) {
00113|                     const status = await gitService.getStatusSummary();
00114|                     console.log(chalk.red(`⚠️  无法切换: 当前工作区有未提交的变更`));
00115|                     return;
00116|                 }
00117| 
00118|                 const spinner = ora(`正在切换到 "${branchName}"...`).start();
00119|                 await gitService.switchBranch(branchName);
00120|                 spinner.succeed(chalk.green(`已切换到分支 ${chalk.bold(branchName)}`));
00121| 
00122|             } catch (error: any) {
00123|                 console.error(chalk.red(`\n切换失败: ${error.message}`));
00124|             }
00125|         });
00126| 
00127|     // branch suggest
00128|     branchCmd
00129|         .command('suggest')
00130|         .description('🧠 获取分支操作建议 (AI)')
00131|         .action(async () => {
00132|             const spinner = ora('正在分析 Git 上下文...').start();
00133|             try {
00134|                 const gitService = new GitService();
00135|                 const router = getRouter();
00136|                 if (!router) {
00137|                     spinner.fail('未检测到 AI 模型配置');
00138|                     return;
00139|                 }
00140| 
00141|                 const importPath = '../../core/git/BranchAdvisor';
00142|                 if (!ALLOWED_IMPORTS.includes(importPath as any)) {
00143|                     throw new Error('Security: Import path not in whitelist');
00144|                 }
00145| 
00146|                 const { BranchAdvisor } = await import(importPath);
00147|                 const advisor = new BranchAdvisor(gitService, router);
00148| 
00149|                 const suggestion = await advisor.suggest();
00150|                 spinner.stop();
00151| 
00152|                 console.log(chalk.bold.cyan('\n💡 分支操作建议\n'));
00153| 
00154|                 let actionIcon = suggestion.action === 'stay' ? '➡️' : (suggestion.action === 'switch' ? '🔀' : '🌱');
00155|                 console.log(`${actionIcon}  ${chalk.bold('建议操作:')} ${suggestion.action}`);
00156|                 console.log(`📝 ${chalk.bold('原因:')} ${suggestion.reason}`);
00157| 
00158|                 if (suggestion.action === 'create' && suggestion.newBranch) {
00159|                     console.log(chalk.gray(`\n   git checkout -b ${suggestion.newBranch.name}`));
00160|                 } else if (suggestion.action === 'switch' && suggestion.targetBranch) {
00161|                     console.log(chalk.gray(`\n   git checkout ${suggestion.targetBranch}`));
00162|                 }
00163| 
00164|                 const confidence = Math.round(suggestion.confidence * 100);
00165|                 console.log(chalk.gray(`\n🎯 置信度: ${confidence}%`));
00166| 
00167|             } catch (error: any) {
00168|                 spinner.fail(`分析失败: ${error.message}`);
00169|             }
00170|         });
00171| }
00172| 

(End of file - total 172 lines)
</file>

[Project README: /Users/ygs/npm_yuangs/src/commands/git/README.md]
# Git 命令模块

本目录包含 Git 相关命令的实现。

## 文件结构

### 命令文件
- `auto.ts` - 自动化 Git 工作流
- `branch.ts` - 分支管理命令
- `commit.ts` - 提交相关命令
- `exec.ts` - 执行 Git 命令
- `plan.ts` - AI 驱动的开发规划
- `review.ts` - AI 代码审查
- `status.ts` - Git 状态查看

### 共享模块
- `constants.ts` - 常量配置
  - Diff 行数估算配置
  - 安全扫描配置
  - 能力等级显示映射
  
- `utils.ts` - 工具函数
  - `cleanLLMOutput()` - 清理 LLM 输出
  - `deduplicateFiles()` - 文件去重
  - `getCapabilityLevelDisplay()` - 能力等级显示
  
- `errors.ts` - 自定义错误类型
  - `GitError` - 基础 Git 错误
  - `NoChangesFoundError` - 未找到变更
  - `CommitNotFoundError` - Commit 不存在
  - `NoReviewContentError` - 无审查内容

## 设计原则

1. **关注点分离**: 命令逻辑、配置、工具函数、错误处理分离
2. **可维护性**: 常量集中管理，避免魔法数字
3. **可复用性**: 提取通用逻辑为工具函数
4. **类型安全**: 使用 TypeScript 和自定义错误类型
5. **可测试性**: 函数职责单一，易于测试

## 使用示例

### 使用常量
```typescript
import { DIFF_ESTIMATION, SECURITY_SCAN } from './constants';

const estimatedLines = fileCount * DIFF_ESTIMATION.LINES_PER_FILE_DEFAULT;
const limit = pLimit(SECURITY_SCAN.MAX_CONCURRENT);
```

### 使用工具函数
```typescript
import { cleanLLMOutput, deduplicateFiles, getCapabilityLevelDisplay } from './utils';

const cleaned = cleanLLMOutput(rawOutput);
const uniqueFiles = deduplicateFiles([...staged, ...unstaged]);
const displayName = getCapabilityLevelDisplay(level);
```

### 使用自定义错误
```typescript
import { NoChangesFoundError, isNoChangesFoundError } from './errors';

try {
  // ... 代码
} catch (error) {
  if (isNoChangesFoundError(error)) {
    console.log('未找到变更');
  }
}
```

## 最近更新

- 2026-01-28: 根据代码审查结论进行系统性优化
  - 创建 `constants.ts` 集中管理配置
  - 创建 `utils.ts` 提取通用逻辑
  - 创建 `errors.ts` 实现类型安全的错误处理
  - 优化 `plan.ts` 和 `review.ts`，降低复杂度

```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/ygs/npm_yuangs/src/commands/git/plan.ts"
}
```
**Output:**
```
<file>
00001| import { Command } from 'commander';
00002| import chalk from 'chalk';
00003| import ora from 'ora';
00004| import fs from 'fs';
00005| import path from 'path';
00006| import { GitService } from '../../core/git/GitService';
00007| import { runLLM, AIError } from '../../agent/llm';
00008| import { AIRequestMessage } from '../../core/validation';
00009| import { CapabilityLevel, MinCapability } from '../../core/capability/CapabilityLevel';
00010| import { defaultCostProfileCalculator } from '../../core/capability/CostProfile';
00011| import { DIFF_ESTIMATION } from './constants';
00012| import { cleanLLMOutput, deduplicateFiles, getCapabilityLevelDisplay } from './utils';
00013| 
00014| const DEFAULT_PLAN_PROMPT = '分析项目现状并规划下一步开发任务';
00015| const METADATA_PREFIX = '>';
00016| 
00017| /**
00018|  * 解析用户指令（优先级：命令行 > todo.md > 默认值）
00019|  */
00020| async function resolveUserPrompt(cliPrompt: string, todoPath: string): Promise<{ prompt: string; fromFile: boolean }> {
00021|     if (cliPrompt) {
00022|         return { prompt: cliPrompt, fromFile: false };
00023|     }
00024| 
00025|     try {
00026|         await fs.promises.access(todoPath, fs.constants.F_OK);
00027|         const content = await fs.promises.readFile(todoPath, 'utf8');
00028| 
00029|         // 过滤掉文件开头由 yuangs 生成的元数据行（连续的 > 开头的行）
00030|         const lines = content.split('\n');
00031|         let startIndex = 0;
00032| 
00033|         // 跳过开头连续的元数据行
00034|         while (startIndex < lines.length && lines[startIndex].trim().startsWith(METADATA_PREFIX)) {
00035|             startIndex++;
00036|         }
00037| 
00038|         // 跳过元数据后的空行
00039|         while (startIndex < lines.length && lines[startIndex].trim() === '') {
00040|             startIndex++;
00041|         }
00042| 
00043|         const filePrompt = lines.slice(startIndex).join('\n').trim();
00044| 
00045|         if (filePrompt) {
00046|             return { prompt: filePrompt, fromFile: true };
00047|         }
00048|     } catch (e: unknown) {
00049|         if (e instanceof Error && (e as NodeJS.ErrnoException).code !== 'ENOENT') {
00050|             console.warn(chalk.yellow(`⚠️  读取 todo.md 失败: ${e.message}`));
00051|         }
00052|     }
00053| 
00054|     return { prompt: DEFAULT_PLAN_PROMPT, fromFile: false };
00055| }
00056| 
00057| /**
00058|  * 注册 git plan 命令
00059|  */
00060| export function registerPlanCommand(gitCmd: Command) {
00061|     gitCmd
00062|         .command('plan [prompt...]')
00063|         .description('自动读取最近 10 次提交，由两个 AI (架构师 & 审查员) 协作生成 todo.md')
00064|         .option('-r, --rounds <number>', '对话轮数', '2')
00065|         .action(async (promptParts, options) => {
00066|             const cliPrompt = promptParts.join(' ').trim();
00067|             const maxRounds = parseInt(options.rounds) || 2;
00068|             const todoPath = path.join(process.cwd(), 'todo.md');
00069| 
00070|             const { prompt: userPrompt, fromFile } = await resolveUserPrompt(cliPrompt, todoPath);
00071| 
00072|             // 使用主 spinner 管理整体状态
00073|             const spinner = ora(fromFile ? '正在从 todo.md 读取并初始化分析规划...' : '正在初始化分析规划...').start();
00074| 
00075|             try {
00076|                 const gitService = new GitService();
00077| 
00078|                 if (!(await gitService.isGitRepository())) {
00079|                     spinner.fail('当前目录不是 Git 仓库');
00080|                     return;
00081|                 }
00082| 
00083|                 // 1. 获取最近 10 次提交
00084|                 spinner.text = '正在读取 Git 历史记录...';
00085|                 const commits = await gitService.getRecentCommits(10);
00086|                 const commitContext = commits.length > 0
00087|                     ? commits.map(c => `- ${c.date} [${c.hash.substring(0, 7)}] ${c.message}`).join('\n')
00088|                     : '暂无提交记录';
00089| 
00090|                 spinner.succeed('已获取 Git 上下文');
00091| 
00092|                 // 定义两个角色的配置
00093|                 const ARCHITECT_MODEL = 'Assistant'; // 负责写方案
00094|                 const REVIEWER_MODEL = 'gemini-2.5-flash-lite'; // 负责挑刺 (速度快/便宜)
00095| 
00096|                 // 共享的项目上下文
00097|                 const projectContext = `
00098| [项目背景 - 最近 Git 提交]
00099| ${commitContext}
00100| 
00101| [用户需求]
00102| ${userPrompt}
00103| `;
00104| 
00105|                 let currentPlan = ""; // 用于存储当前的方案草稿
00106|                 let reviewComments = ""; // 用于存储审查意见
00107| 
00108|                 console.log(chalk.bold.cyan('\n🚀 启动双智能体协作引擎...\n'));
00109| 
00110|                 // --- 阶段 1: 架构师起草初稿 ---
00111|                 spinner.start(`[架构师] ${ARCHITECT_MODEL} 正在起草初步方案...`);
00112| 
00113|                 const draftPrompt: AIRequestMessage[] = [
00114|                     {
00115|                         role: 'system',
00116|                         content: `你是一个资深软件架构师。请根据 Git 历史确保新功能与现有代码风格一致。
00117| 请基于用户需求输出一份初步的开发计划 (Draft Plan)。
00118| 包含：核心目标、修改文件列表、关键步骤。`
00119|                     },
00120|                     { role: 'user', content: projectContext }
00121|                 ];
00122| 
00123|                 const draftRes = await runLLM({
00124|                     prompt: { messages: draftPrompt },
00125|                     model: ARCHITECT_MODEL,
00126|                     stream: false,
00127|                     bypassRouter: true
00128|                 });
00129| 
00130|                 currentPlan = draftRes.rawText;
00131|                 spinner.succeed(chalk.blue(`[架构师] 初稿已完成`));
00132|                 // console.log(chalk.gray(currentPlan.substring(0, 100) + '...'));
00133| 
00134|                 // --- 阶段 2: 循环打磨 ---
00135|                 for (let i = 1; i <= maxRounds; i++) {
00136|                     console.log(chalk.gray(`\n--- Round ${i}/${maxRounds} ---`));
00137| 
00138|                     // Step A: 审查员 (Gemini) 评审
00139|                     spinner.start(`[审查员] ${REVIEWER_MODEL} 正在评审方案...`);
00140| 
00141|                     const reviewPrompt: AIRequestMessage[] = [
00142|                         {
00143|                             role: 'system',
00144|                             content: `你是一个严格的代码审查员和产品经理。
00145| 你的任务是找出架构师方案中的漏洞、遗漏、安全风险或逻辑错误。
00146| 请简明扼要地列出修改建议。不要重写计划，只给建议。`
00147|                         },
00148|                         {
00149|                             role: 'user',
00150|                             content: `
00151| ${projectContext}
00152| 
00153| [待评审的方案]
00154| ${currentPlan}
00155| `
00156|                         }
00157|                     ];
00158| 
00159|                     const reviewRes = await runLLM({
00160|                         prompt: { messages: reviewPrompt },
00161|                         model: REVIEWER_MODEL,
00162|                         stream: false,
00163|                         bypassRouter: true
00164|                     });
00165| 
00166|                     reviewComments = reviewRes.rawText;
00167|                     spinner.succeed(chalk.magenta(`[审查员] 已提出修改意见`));
00168|                     console.log(chalk.gray(`   💬 "${reviewComments.replace(/\n/g, ' ').substring(0, 80)}..."`));
00169| 
00170|                     // Step B: 架构师 (Assistant) 修正
00171|                     spinner.start(`[架构师] ${ARCHITECT_MODEL} 正在根据意见修订方案...`);
00172| 
00173|                     const refinePrompt: AIRequestMessage[] = [
00174|                         {
00175|                             role: 'system',
00176|                             content: `你是一个资深软件架构师。请根据审查员的意见优化你的开发计划。`
00177|                         },
00178|                         {
00179|                             role: 'user',
00180|                             content: `
00181| 这是你之前的方案：
00182| ${currentPlan}
00183| 
00184| 审查员给出的意见：
00185| ${reviewComments}
00186| 
00187| 请输出修正后的完整方案。`
00188|                         }
00189|                     ];
00190| 
00191|                     const refineRes = await runLLM({
00192|                         prompt: { messages: refinePrompt },
00193|                         model: ARCHITECT_MODEL,
00194|                         stream: false,
00195|                         bypassRouter: true
00196|                     });
00197| 
00198|                     currentPlan = refineRes.rawText;
00199|                     spinner.succeed(chalk.blue(`[架构师] 方案已修订`));
00200|                 }
00201| 
00202|                 // 4. 生成最终 todo.md
00203|                 spinner.start('正在生成最终 todo.md 文件...');
00204| 
00205|                 // 计算任务复杂度和能力需求
00206|                 const diff = await gitService.getDiff();
00207|                 // 对文件列表去重，避免 staged 和 unstaged 中的重复文件被重复计数
00208|                 const allFiles = deduplicateFiles([...diff.files.staged, ...diff.files.unstaged]);
00209| 
00210|                 // 使用 git diff --numstat 获取准确的行数统计
00211|                 let estimatedTotalLines = 0;
00212|                 try {
00213|                     const numstat = await gitService.getDiffNumstat();
00214|                     // numstat 直接提供准确的 added 和 deleted 行数
00215|                     estimatedTotalLines = numstat.added + numstat.deleted;
00216| 
00217|                     // 如果 numstat 没有数据（如没有变更），使用文件数估算
00218|                     if (estimatedTotalLines === 0 && allFiles.length > 0) {
00219|                         estimatedTotalLines = allFiles.length * DIFF_ESTIMATION.LINES_PER_FILE_DEFAULT;
00220|                     }
00221|                 } catch (e) {
00222|                     // numstat 失败，使用更保守的估算值作为后备
00223|                     estimatedTotalLines = allFiles.length * DIFF_ESTIMATION.LINES_PER_FILE_FALLBACK;
00224|                 }
00225| 
00226|                 const costProfile = defaultCostProfileCalculator.calculate(allFiles, estimatedTotalLines);
00227| 
00228|                 const finalPrompt: AIRequestMessage[] = [
00229|                     {
00230|                         role: 'system',
00231|                         content: `你是一个技术文档专家。请将以下开发方案整理为一份标准的 todo.md 文档。
00232| 
00233| 重要要求：
00234| 1. 格式清晰，使用 Markdown Checkbox (- [ ] )。
00235| 2. 包含 [目标]、[文件变更]、[详细步骤]。
00236| 3. 直接输出 Markdown 内容，不要使用 Markdown 代码块 (\`\`\`) 包裹。
00237| 4. 不要包含任何对话式前缀（如"好的"、"这是"）或后缀（如"希望这对你有帮助"）。
00238| 5. 开头直接输出内容，不要有任何问候语或开场白。
00239| 
00240| 能力等级标注：
00241| - SEMANTIC: 语义理解，需要理解代码意图和设计
00242| - STRUCTURAL: 结构分析，需要理解代码结构和依赖关系
00243| - LINE: 行级分析，需要理解具体代码行
00244| - TEXT: 文本分析，只需要处理文本内容
00245| - NONE: 无需智能分析
00246| 
00247| 格式示例：
00248| - [ ] 实现用户认证 [SEMANTIC]
00249|   - capability: SEMANTIC
00250|   - fallbackChain: [STRUCTURAL, LINE, TEXT, NONE]`
00251|                     },
00252|                     {
00253|                         role: 'user',
00254|                         content: currentPlan
00255|                     }
00256|                 ];
00257| 
00258|                 const finalResponse = await runLLM({
00259|                     prompt: { messages: finalPrompt },
00260|                     model: 'Assistant',
00261|                     stream: false,
00262|                     bypassRouter: true
00263|                 });
00264| 
00265|                 const todoContent = finalResponse.rawText;
00266|                 const filePath = path.join(process.cwd(), 'todo.md');
00267| 
00268|                 // 使用工具函数清理 LLM 输出
00269|                 const cleanedContent = cleanLLMOutput(todoContent);
00270| 
00271|                 // 添加能力元数据到文件头
00272|                 const metadataLines = [
00273|                     `> 📅 Generated by Yuangs Git Plan at ${new Date().toLocaleString()}`,
00274|                     `> 🎯 Context: ${userPrompt}`,
00275|                     `> 🔧 Capability Level: ${getCapabilityLevelDisplay(costProfile.requiredCapability)}`,
00276|                     `> ⚙️  Estimated Time: ${costProfile.estimatedTime}ms`,
00277|                     `> 📊 Estimated Tokens: ${costProfile.estimatedTokens}`,
00278|                     '',
00279|                 ];
00280| 
00281|                 const fileOutput = metadataLines.join('\n') + cleanedContent;
00282| 
00283|                 fs.writeFileSync(filePath, fileOutput);
00284| 
00285|                 spinner.succeed(chalk.green(`\n✅ 规划完成！文件已生成: ${chalk.bold('todo.md')}`));
00286|                 console.log(chalk.gray(`👉 你可以使用 'code todo.md' 打开查看`));
00287| 
00288|             } catch (error: any) {
00289|                 spinner.fail(chalk.red(`规划过程中出错: ${error.message}`));
00290|                 if (error instanceof AIError) {
00291|                     console.error(chalk.red(`Status: ${error.statusCode}`));
00292|                 }
00293|             }
00294|         });
00295| }
00296| 

(End of file - total 296 lines)
</file>
```
```

---

## Assistant (Sisyphus · glm-4.7 · 26.1s)

_Thinking:_

好的，我已经读取了主要的git命令文件。现在让我继续读取剩余的文件。

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/ygs/npm_yuangs/src/commands/git/exec.ts"
}
```
**Output:**
```
<file>
00001| import { Command } from 'commander';
00002| import chalk from 'chalk';
00003| import ora from 'ora';
00004| import fs from 'fs';
00005| import path from 'path';
00006| import { runLLM, AIError } from '../../agent/llm';
00007| import { AIRequestMessage } from '../../core/validation';
00008| import { parseGeneratedCode, writeGeneratedCode, saveRawOutput } from '../../core/git/CodeGenerator';
00009| 
00010| const METADATA_PREFIX = '>';
00011| 
00012| /**
00013|  * 从 todo.md 中提取任务列表
00014|  */
00015| async function parseTodoFile(filePath: string): Promise<{ tasks: string[]; context: string }> {
00016|     const content = await fs.promises.readFile(filePath, 'utf8');
00017|     const lines = content.split('\n');
00018| 
00019|     // 跳过元数据
00020|     let startIndex = 0;
00021|     while (startIndex < lines.length && lines[startIndex].trim().startsWith(METADATA_PREFIX)) {
00022|         startIndex++;
00023|     }
00024|     while (startIndex < lines.length && lines[startIndex].trim() === '') {
00025|         startIndex++;
00026|     }
00027| 
00028|     const mainContent = lines.slice(startIndex).join('\n');
00029| 
00030|     // 提取所有未完成的任务（- [ ] 格式）
00031|     const tasks: string[] = [];
00032|     const taskRegex = /^[\s]*-\s*\[\s*\]\s*(.+)$/gm;
00033|     let match;
00034| 
00035|     while ((match = taskRegex.exec(mainContent)) !== null) {
00036|         tasks.push(match[1].trim());
00037|     }
00038| 
00039|     return { tasks, context: mainContent };
00040| }
00041| 
00042| /**
00043|  * 注册 git exec 命令
00044|  */
00045| export function registerExecCommand(gitCmd: Command) {
00046|     gitCmd
00047|         .command('exec')
00048|         .description('根据 todo.md 自动生成代码并执行任务')
00049|         .option('-f, --fromfile <file>', '指定 todo 文件路径', 'todo.md')
00050|         .option('-t, --task <number>', '执行指定编号的任务（从 1 开始）')
00051|         .option('-m, --model <model>', '指定 AI 模型', 'Assistant')
00052|         .action(async (options) => {
00053|             const todoPath = path.join(process.cwd(), options.fromfile);
00054|             const spinner = ora('正在读取任务文件...').start();
00055| 
00056|             try {
00057|                 // 1. 检查文件是否存在
00058|                 await fs.promises.access(todoPath, fs.constants.F_OK);
00059| 
00060|                 // 2. 解析任务
00061|                 const { tasks, context } = await parseTodoFile(todoPath);
00062| 
00063|                 if (tasks.length === 0) {
00064|                     spinner.fail('未找到待执行的任务（- [ ] 格式）');
00065|                     console.log(chalk.yellow('💡 提示：请确保 todo.md 中包含未完成的任务，格式如：- [ ] 任务描述'));
00066|                     return;
00067|                 }
00068| 
00069|                 spinner.succeed(`发现 ${tasks.length} 个待执行任务`);
00070| 
00071|                 // 3. 确定要执行的任务
00072|                 let taskIndex = 0;
00073|                 if (options.task) {
00074|                     taskIndex = parseInt(options.task) - 1;
00075|                     if (taskIndex < 0 || taskIndex >= tasks.length) {
00076|                         console.error(chalk.red(`❌ 任务编号 ${options.task} 超出范围（1-${tasks.length}）`));
00077|                         return;
00078|                     }
00079|                 } else {
00080|                     // 默认执行第一个任务
00081|                     taskIndex = 0;
00082|                 }
00083| 
00084|                 const currentTask = tasks[taskIndex];
00085|                 console.log(chalk.cyan(`\n📋 准备执行任务 #${taskIndex + 1}: ${chalk.bold(currentTask)}\n`));
00086| 
00087|                 // 4. 构建 AI 提示
00088|                 spinner.start('正在生成实现方案...');
00089| 
00090|                 const prompt: AIRequestMessage[] = [
00091|                     {
00092|                         role: 'system',
00093|                         content: `你是一个资深软件工程师。请根据任务描述和上下文，生成完整的代码实现。
00094| 要求：
00095| 1. 输出可直接使用的代码
00096| 2. 包含必要的注释
00097| 3. 遵循最佳实践
00098| 4. 如果需要创建新文件，明确指出文件路径`
00099|                     },
00100|                     {
00101|                         role: 'user',
00102|                         content: `
00103| [项目上下文 - 来自 todo.md]
00104| ${context}
00105| 
00106| [当前任务]
00107| ${currentTask}
00108| 
00109| 请生成完整的实现代码。如果需要创建或修改文件，请按以下格式输出：
00110| 
00111| \`\`\`filepath
00112| 文件路径
00113| \`\`\`
00114| 
00115| \`\`\`code
00116| 代码内容
00117| \`\`\`
00118| `
00119|                     }
00120|                 ];
00121| 
00122|                 const response = await runLLM({
00123|                     prompt: { messages: prompt },
00124|                     model: options.model,
00125|                     stream: false,
00126|                     bypassRouter: true
00127|                 });
00128| 
00129|                 spinner.succeed('实现方案已生成');
00130| 
00131|                 // 5. 显示生成的代码
00132|                 console.log(chalk.gray('━'.repeat(60)));
00133|                 console.log(response.rawText);
00134|                 console.log(chalk.gray('━'.repeat(60)));
00135| 
00136|                 // 6. 询问是否应用
00137|                 const readline = require('readline').createInterface({
00138|                     input: process.stdin,
00139|                     output: process.stdout
00140|                 });
00141| 
00142|                 const answer = await new Promise<string>((resolve) => {
00143|                     readline.question(chalk.yellow('\n是否应用以上代码？(y/N): '), resolve);
00144|                 });
00145|                 readline.close();
00146| 
00147|                 if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
00148|                     // 7. 解析并应用代码
00149|                     spinner.start('正在解析生成的代码...');
00150| 
00151|                     const generated = parseGeneratedCode(response.rawText);
00152| 
00153|                     if (generated.files.length > 0) {
00154|                         spinner.succeed(`检测到 ${generated.files.length} 个文件`);
00155| 
00156|                         // 保存原始输出
00157|                         const savedPath = await saveRawOutput(response.rawText, taskIndex);
00158|                         console.log(chalk.gray(`📄 原始输出已保存: ${path.relative(process.cwd(), savedPath)}\n`));
00159| 
00160|                         // 写入文件
00161|                         console.log(chalk.cyan('开始写入文件...\n'));
00162|                         const { written, skipped } = await writeGeneratedCode(generated);
00163| 
00164|                         if (written.length > 0) {
00165|                             console.log(chalk.green(`\n✅ 成功写入 ${written.length} 个文件`));
00166|                         }
00167|                         if (skipped.length > 0) {
00168|                             console.log(chalk.yellow(`⚠️  跳过 ${skipped.length} 个文件`));
00169|                         }
00170| 
00171|                         // 更新 todo.md 任务状态
00172|                         const todoLineRegex = /^(\s*)-\s*\[\s*\]\s*(.+)$/;
00173|                         const todoContent = await fs.promises.readFile(todoPath, 'utf8');
00174|                         const lines = todoContent.split('\n');
00175| 
00176|                         let taskFound = false;
00177|                         for (let i = 0; i < lines.length; i++) {
00178|                             const match = lines[i].match(todoLineRegex);
00179|                             if (match && taskIndex > 0) {
00180|                                 taskIndex--;
00181|                                 continue;
00182|                             }
00183|                             if (match && taskIndex === 0) {
00184|                                 lines[i] = `${match[1]}- [x] ${match[2]}`;
00185|                                 taskFound = true;
00186|                                 break;
00187|                             }
00188|                         }
00189| 
00190|                         if (taskFound) {
00191|                             await fs.promises.writeFile(todoPath, lines.join('\n'), 'utf8');
00192|                             console.log(chalk.green('\n✅ 任务已标记为完成'));
00193|                         }
00194|                     } else {
00195|                         spinner.fail('未检测到可解析的文件路径和代码');
00196|                         console.log(chalk.yellow('\n💡 请检查 AI 输出格式，或查看原始输出文件'));
00197|                     }
00198|                 } else {
00199|                     console.log(chalk.gray('\n已取消应用'));
00200|                 }
00201| 
00202|             } catch (e: unknown) {
00203|                 if (e instanceof Error && (e as NodeJS.ErrnoException).code === 'ENOENT') {
00204|                     spinner.fail(`文件不存在: ${todoPath}`);
00205|                     console.log(chalk.yellow('💡 提示：请先运行 yuangs git plan 生成任务文件'));
00206|                 } else if (e instanceof AIError) {
00207|                     spinner.fail(`AI 调用失败: ${e.message}`);
00208|                     console.error(chalk.red(`Status: ${e.statusCode}`));
00209|                 } else if (e instanceof Error) {
00210|                     spinner.fail(`执行失败: ${e.message}`);
00211|                 } else {
00212|                     spinner.fail('未知错误');
00213|                 }
00214|             }
00215|         });
00216| }
00217| 

(End of file - total 217 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/ygs/npm_yuangs/src/commands/git/auto.ts"
}
```
**Output:**
```
<file>
00001| import { Command } from 'commander';
00002| import chalk from 'chalk';
00003| import ora from 'ora';
00004| import fs from 'fs';
00005| import path from 'path';
00006| import { GitService } from '../../core/git/GitService';
00007| import { runLLM, AIError } from '../../agent/llm';
00008| import { AIRequestMessage } from '../../core/validation';
00009| import {
00010|     parseTodoFile,
00011|     updateTaskStatus,
00012|     updateMetadata,
00013|     getNextTask,
00014|     calculateProgress,
00015|     TaskStatus
00016| } from '../../core/git/TodoManager';
00017| import { ReviewLevel } from '../../core/git/CodeReviewer';
00018| import {
00019|     MAX_RETRY_ATTEMPTS,
00020|     MIN_REVIEW_SCORE,
00021|     REVIEW_FAILURE_SCORE,
00022|     DEFAULT_AI_MODEL
00023| } from '../../core/git/constants';
00024| import {
00025|     parseGeneratedCode,
00026|     writeGeneratedCode,
00027|     saveRawOutput,
00028|     backupFiles,
00029|     restoreFromBackup,
00030|     cleanOldBackups,
00031|     BackupInfo
00032| } from '../../core/git/CodeGenerator';
00033| import { CommitMessageGenerator } from '../../core/git/CommitMessageGenerator';
00034| import {
00035|     withRetry,
00036|     isRetryableError,
00037|     formatError,
00038|     getSuggestion
00039| } from '../../core/git/ErrorHandler';
00040| import { ProgressManager } from '../../core/git/ProgressManager';
00041| import { ContextGatherer } from '../../core/git/ContextGatherer';
00042| 
00043| /**
00044|  * 执行单个任务
00045|  */
00046| async function executeTask(
00047|     task: TaskStatus,
00048|     context: string,
00049|     model: string,
00050|     previousFeedback?: string
00051| ): Promise<{ code: string; success: boolean; error?: string }> {
00052|     const prompt: AIRequestMessage[] = [
00053|         {
00054|             role: 'system',
00055|             content: `你是一个全方位的交付专家。
00056| 1. 如果当前任务涉及代码（如 .ts, .js, .py 等文件），请扮演**资深软件工程师**，确保代码健壮、注释详尽、遵循最佳实践，并追求极致的模块化与性能。
00057| 2. 如果当前任务涉及文档（如 .md, .yaml, .html 等文件），请扮演**资深内容专家或历史学者**，确保叙事优美、逻辑严密、事实准确。
00058| 
00059| **重要输出格式要求：**
00060| 对于每个需要创建或修改的文件，请使用以下格式之一标明：
00061| 
00062| ### 文件: path/to/file.ext
00063| \`\`\`language
00064| // 完整的具体内容
00065| \`\`\`
00066| 
00067| 或
00068| 
00069| \`\`\`filepath
00070| 文件路径
00071| \`\`\`
00072| \`\`\`code
00073| 文件具体内容
00074| \`\`\`
00075| 
00076| 要求：
00077| 1. 明确指出每个文件的完整路径。
00078| 2. 提供完整的、可直接使用的内容，禁止使用占位符（如 "// rest of code..."）。
00079| 3. 遵循所属领域（代码或文学）的全球最高标准最佳实践。
00080| 4. 确保文件路径格式与 todo.md 中的定义 100% 匹配。
00081| 5. 必须使用合适的代码块语法标明对应格式，便于解析引擎识别。`
00082|         },
00083|         {
00084|             role: 'user',
00085|             content: `
00086| [项目上下文]
00087| ${context}
00088| 
00089| [当前任务]
00090| ${task.description}
00091| 
00092| ${previousFeedback ? `\n[上次实现的问题]\n${previousFeedback}\n\n请根据以上反馈重新实现。` : ''}
00093| 
00094| 请生成完整的实现代码，并明确标注每个文件的路径。
00095| `
00096|         }
00097|     ];
00098| 
00099|     try {
00100|         const response = await withRetry(
00101|             () => runLLM({
00102|                 prompt: { messages: prompt },
00103|                 model,
00104|                 stream: false,
00105|                 bypassRouter: true
00106|             }),
00107|             {
00108|                 maxAttempts: 3,
00109|                 delay: 1000,
00110|                 backoff: true,
00111|                 shouldRetry: isRetryableError,
00112|                 onRetry: (error, attempt) => {
00113|                     console.log(chalk.yellow(`⚠️  AI 调用失败，第 ${attempt} 次重试...`));
00114|                 }
00115|             }
00116|         );
00117| 
00118|         return { code: response.rawText, success: true };
00119|     } catch (e: any) {
00120|         const errorMsg = e.message || '未知错误';
00121|         console.error(chalk.red(`\n❌ AI 执行阶段发生异常: ${errorMsg}`));
00122|         return { code: '', success: false, error: errorMsg };
00123|     }
00124| }
00125| 
00126| /**
00127|  * 执行代码审查
00128|  */
00129| async function reviewCode(staged: boolean = true): Promise<{ score: number; issues: string[]; error?: string }> {
00130|     try {
00131|         const { CodeReviewer } = await import('../../core/git/CodeReviewer');
00132|         const { getRouter } = await import('../../core/modelRouter');
00133|         const gitService = new GitService();
00134| 
00135|         const router = getRouter();
00136|         const reviewer = new CodeReviewer(gitService, router);
00137| 
00138|         const result = await withRetry(
00139|             () => reviewer.review(ReviewLevel.STANDARD, staged),
00140|             {
00141|                 maxAttempts: 2,
00142|                 delay: 500,
00143|                 backoff: true,
00144|                 shouldRetry: isRetryableError,
00145|                 onRetry: (error, attempt) => {
00146|                     console.log(chalk.yellow(`⚠️  代码审查失败，第 ${attempt} 次重试...`));
00147|                 }
00148|             }
00149|         );
00150| 
00151|         return {
00152|             score: result.score,
00153|             issues: result.issues.map(i => `${i.severity}: ${i.message}`)
00154|         };
00155|     } catch (e: unknown) {
00156|         const errorMsg = e instanceof Error ? e.message : '未知错误';
00157|         console.warn(chalk.yellow(`⚠️  代码审查失败: ${errorMsg}`));
00158| 
00159|         // 审查失败时返回低分，避免掩盖问题
00160|         return {
00161|             score: REVIEW_FAILURE_SCORE,
00162|             issues: [`审查系统错误: ${errorMsg}`],
00163|             error: errorMsg
00164|         };
00165|     }
00166| }
00167| 
00168| /**
00169|  * 注册 git auto 命令
00170|  */
00171| export function registerAutoCommand(gitCmd: Command) {
00172|     gitCmd
00173|         .command('auto')
00174|         .description('全自动工作流：plan → exec → review 循环')
00175|         .option('-n, --max-tasks <number>', '最大执行任务数', '5')
00176|         .option('-m, --model <model>', '指定 AI 模型', 'Assistant')
00177|         .option('-s, --min-score <score>', '最低审查分数', '85')
00178|         .option('-r, --skip-review', '跳过代码审查')
00179|         .option('-o, --save-only', '只保存代码，不写入文件系统')
00180|         .option('-c, --commit', '所有任务完成后自动提交')
00181|         .option('--commit-message <msg>', '自定义提交信息（使用 --commit 时生效）')
00182|         .action(async (options) => {
00183|             const todoPath = path.join(process.cwd(), 'todo.md');
00184|             const maxTasks = parseInt(options.maxTasks) || 5;
00185|             const minScore = parseInt(options.minScore) || MIN_REVIEW_SCORE;
00186| 
00187|             const progressManager = new ProgressManager();
00188| 
00189|             console.log(chalk.bold.cyan('\n🤖 启动全自动 AI 开发工作流...\n'));
00190|             console.log(chalk.gray(`📋 最大任务数: ${maxTasks}`));
00191|             console.log(chalk.gray(`🎯 最低审查分数: ${minScore}`));
00192|             console.log(chalk.gray(`🤖 AI 模型: ${options.model}\n`));
00193| 
00194|             const spinner = ora('正在初始化...').start();
00195| 
00196|             try {
00197|                 // 1. 检查 todo.md 是否存在
00198|                 await fs.promises.access(todoPath, fs.constants.F_OK);
00199| 
00200|                 // 2. 解析任务
00201|                 const { metadata, tasks, rawContent } = await parseTodoFile(todoPath);
00202| 
00203|                 if (tasks.length === 0) {
00204|                     spinner.fail('未找到任何任务');
00205|                     console.log(chalk.yellow('💡 提示：请先运行 yuangs git plan 生成任务'));
00206|                     return;
00207|                 }
00208| 
00209|                 spinner.succeed(`发现 ${tasks.length} 个任务`);
00210| 
00211|                 const progress = calculateProgress(tasks);
00212|                 console.log(chalk.cyan(`📊 当前进度: ${progress.completed}/${progress.total}\n`));
00213| 
00214|                 // 初始化进度管理器
00215|                 await progressManager.initialize({
00216|                     minScore,
00217|                     skipReview: options.skipReview,
00218|                     saveOnly: options.saveOnly,
00219|                     commit: options.commit,
00220|                     commitMessage: options.commitMessage
00221|                 });
00222| 
00223|                 let tasksExecuted = 0;
00224| 
00225|                 // 3. 循环执行任务
00226|                 while (tasksExecuted < maxTasks) {
00227|                     const nextTask = getNextTask(tasks);
00228| 
00229|                     if (!nextTask) {
00230|                         console.log(chalk.green('\n🎉 所有任务已完成！'));
00231|                         break;
00232|                     }
00233| 
00234|                     console.log(chalk.bold.cyan(`\n━━━ 任务 #${nextTask.index + 1} ━━━`));
00235|                     console.log(chalk.white(`📝 ${nextTask.description}\n`));
00236| 
00237|                     let attempts = nextTask.attempts || 0;
00238|                     let taskCompleted = false;
00239| 
00240|                     while (attempts <= MAX_RETRY_ATTEMPTS && !taskCompleted) {
00241|                         attempts++;
00242| 
00243|                         // 3a. 执行任务
00244|                         spinner.start(`[尝试 ${attempts}/${MAX_RETRY_ATTEMPTS + 1}] 正在生成代码...`);
00245| 
00246|                         await updateTaskStatus(todoPath, nextTask.index, {
00247|                             execStatus: 'in_progress',
00248|                             attempts
00249|                         });
00250| 
00251|                         const previousFeedback = attempts > 1 && nextTask.reviewIssues
00252|                             ? nextTask.reviewIssues.join('\n')
00253|                             : undefined;
00254| 
00255|                         // 采集真实上下文
00256|                         spinner.text = `[尝试 ${attempts}] 正在采集项目上下文...`;
00257|                         const gitService = new GitService();
00258|                         const gatherer = new ContextGatherer(gitService);
00259|                         const gathered = await gatherer.gather(nextTask.description);
00260| 
00261|                         spinner.text = `[尝试 ${attempts}/${MAX_RETRY_ATTEMPTS + 1}] 正在生成实现方案...`;
00262| 
00263|                         const { code, success } = await executeTask(
00264|                             nextTask,
00265|                             gathered.summary,
00266|                             options.model,
00267|                             previousFeedback
00268|                         );
00269| 
00270|                         if (!success) {
00271|                             spinner.fail('代码生成失败');
00272|                             await updateTaskStatus(todoPath, nextTask.index, {
00273|                                 execStatus: 'failed'
00274|                             });
00275|                             break;
00276|                         }
00277| 
00278|                         spinner.succeed('代码已生成');
00279| 
00280|                         // 3b. 保存原始输出
00281|                         const savedPath = await saveRawOutput(code, nextTask.index);
00282|                         console.log(chalk.gray(`📄 原始输出已保存: ${path.relative(process.cwd(), savedPath)}`));
00283| 
00284|                         // 3c. 解析并写入代码
00285|                         const generated = parseGeneratedCode(code);
00286| 
00287|                         if (generated.files.length > 0) {
00288|                             console.log(chalk.cyan(`\n📦 检测到 ${generated.files.length} 个文件:\n`));
00289| 
00290|                             if (!options.saveOnly) {
00291|                                 // 写入前备份
00292|                                 spinner.start('正在备份当前文件状态...');
00293|                                 let backupId: string | undefined;
00294|                                 try {
00295|                                     const backup = await backupFiles(generated.files);
00296|                                     backupId = backup.id;
00297|                                     spinner.succeed('文件状态已备份');
00298|                                 } catch (e: unknown) {
00299|                                     spinner.warn('备份失败，继续执行');
00300|                                 }
00301| 
00302|                                 const { written, skipped } = await writeGeneratedCode(generated);
00303| 
00304|                                 if (written.length > 0) {
00305|                                     console.log(chalk.green(`\n✅ 成功写入 ${written.length} 个文件`));
00306|                                 }
00307|                                 if (skipped.length > 0) {
00308|                                     console.log(chalk.yellow(`⚠️  跳过 ${skipped.length} 个文件`));
00309|                                 }
00310| 
00311|                                 // 保存备份ID
00312|                                 await updateTaskStatus(todoPath, nextTask.index, {
00313|                                     backupId
00314|                                 });
00315|                                 nextTask.backupId = backupId;
00316|                             } else {
00317|                                 console.log(chalk.gray('  (--save-only 模式，未写入文件系统)'));
00318|                                 generated.files.forEach(f => {
00319|                                     console.log(chalk.gray(`  - ${f.path}`));
00320|                                 });
00321|                             }
00322|                         } else {
00323|                             console.log(chalk.yellow('\n⚠️  未检测到可解析的文件路径和代码'));
00324|                             console.log(chalk.yellow('\n💡 可能的原因：'));
00325|                             console.log(chalk.gray('  1. AI 输出格式不符合要求'));
00326|                             console.log(chalk.gray('  2. 文件路径标识不正确'));
00327|                             console.log(chalk.gray('  3. 代码块格式错误'));
00328|                             console.log(chalk.cyan(`\n📄 原始输出文件: ${path.relative(process.cwd(), savedPath)}`));
00329|                             console.log(chalk.gray('\n💡 提示：请检查原始输出文件，确认格式是否正确'));
00330|                             console.log(chalk.gray('\n支持的格式: ### 文件: path, **path**, ```filepath/path```, ## 📄 文件：`path``'));
00331|                         }
00332| 
00333|                         // 3b. 代码审查（如果未跳过）
00334|                         if (!options.skipReview) {
00335|                             spinner.start('正在进行代码审查...');
00336| 
00337|                             // 审查刚刚写入但尚未暂存的文件 (staged: false)
00338|                             const review = await reviewCode(false);
00339| 
00340|                             spinner.succeed(`审查完成 (评分: ${review.score}/100)`);
00341| 
00342|                             await updateTaskStatus(todoPath, nextTask.index, {
00343|                                 reviewScore: review.score,
00344|                                 reviewIssues: review.issues
00345|                             });
00346| 
00347|                             // 3c. 判断是否通过
00348|                             if (review.score >= minScore) {
00349|                                 console.log(chalk.green(`✅ 审查通过！(${review.score} >= ${minScore})\n`));
00350|                                 taskCompleted = true;
00351| 
00352|                                 await updateTaskStatus(todoPath, nextTask.index, {
00353|                                     completed: true,
00354|                                     execStatus: 'done'
00355|                                 });
00356| 
00357|                                 nextTask.completed = true;
00358|                             } else {
00359|                                 console.log(chalk.yellow(`⚠️  审查未通过 (${review.score} < ${minScore})`));
00360| 
00361|                                 if (review.issues.length > 0) {
00362|                                     console.log(chalk.yellow('问题列表:'));
00363|                                     review.issues.forEach(issue => {
00364|                                         console.log(chalk.yellow(`  • ${issue}`));
00365|                                     });
00366|                                 }
00367| 
00368|                                 if (attempts <= MAX_RETRY_ATTEMPTS) {
00369|                                     console.log(chalk.cyan(`\n🔄 将根据反馈重新生成...\n`));
00370|                                 } else {
00371|                                     console.log(chalk.red(`\n❌ 已达最大重试次数，跳过此任务\n`));
00372| 
00373|                                     // 回滚代码
00374|                                     if (nextTask.backupId) {
00375|                                         spinner.start('正在回滚代码变更...');
00376|                                         try {
00377|                                             await restoreFromBackup(nextTask.backupId);
00378|                                             spinner.succeed('代码已回滚');
00379|                                         } catch (e: unknown) {
00380|                                             const errorMsg = e instanceof Error ? e.message : '未知错误';
00381|                                             spinner.warn(`回滚失败: ${errorMsg}`);
00382|                                         }
00383|                                     }
00384| 
00385|                                     await updateTaskStatus(todoPath, nextTask.index, {
00386|                                         execStatus: 'failed'
00387|                                     });
00388|                                 }
00389|                             }
00390|                         } else {
00391|                             // 跳过审查，直接标记完成
00392|                             console.log(chalk.gray('⏭️  已跳过代码审查\n'));
00393|                             taskCompleted = true;
00394| 
00395|                             await updateTaskStatus(todoPath, nextTask.index, {
00396|                                 completed: true,
00397|                                 execStatus: 'done'
00398|                             });
00399| 
00400|                             nextTask.completed = true;
00401|                         }
00402|                     }
00403| 
00404|                     tasksExecuted++;
00405| 
00406|                     // 更新进度管理器
00407|                     await progressManager.incrementTaskExecuted();
00408|                     await progressManager.updateCurrentTask(nextTask.index + 1);
00409| 
00410|                     // 更新总体进度
00411|                     const newProgress = calculateProgress(tasks);
00412|                     await updateMetadata(todoPath, {
00413|                         progress: newProgress,
00414|                         currentTask: nextTask.index + 1
00415|                     });
00416|                 }
00417| 
00418|                 // 4. 总结
00419|                 const finalProgress = calculateProgress(tasks);
00420|                 console.log(chalk.bold.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
00421|                 console.log(chalk.bold.cyan('📊 工作流执行完成'));
00422|                 console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
00423|                 console.log(chalk.white(`✅ 已完成: ${finalProgress.completed}/${finalProgress.total}`));
00424|                 console.log(chalk.white(`🔄 本次执行: ${tasksExecuted} 个任务\n`));
00425| 
00426|                 if (finalProgress.completed < finalProgress.total) {
00427|                     console.log(chalk.yellow('💡 提示：还有未完成的任务，可以再次运行 yuangs git auto 继续'));
00428|                 }
00429| 
00430|                 // 导出进度报告
00431|                 const reportMetadata = {
00432|                     ...metadata,
00433|                     progress: finalProgress
00434|                 };
00435|                 const reportPath = await progressManager.exportReport(reportMetadata);
00436|                 console.log(chalk.gray(`\n📊 进度报告已保存: ${path.relative(process.cwd(), reportPath)}`));
00437| 
00438|                 // 清理状态
00439|                 if (finalProgress.completed === finalProgress.total) {
00440|                     await progressManager.clear();
00441|                 }
00442| 
00443|                 if (options.commit && finalProgress.completed === finalProgress.total) {
00444|                     // 5. 自动提交
00445|                     const gitService = new GitService();
00446|                     const isClean = await gitService.isWorkingTreeClean();
00447| 
00448|                     if (!isClean) {
00449|                         console.log(chalk.cyan('🚀 准备自动提交...\n'));
00450| 
00451|                         // 暂存所有变更
00452|                         spinner.start('正在暂存所有变更...');
00453|                         await gitService.stageAll();
00454|                         spinner.succeed('已暂存所有变更');
00455| 
00456|                         // 生成提交信息
00457|                         let commitMessage: string;
00458|                         if (options.commitMessage) {
00459|                             commitMessage = options.commitMessage;
00460|                             spinner.succeed('使用自定义提交信息');
00461|                         } else {
00462|                             spinner.start('正在生成提交信息...');
00463|                             const router = await (await import('../../core/modelRouter')).getRouter();
00464|                             const commitGen = new CommitMessageGenerator(gitService, router);
00465|                             const commit = await commitGen.generate({ detailed: false });
00466|                             commitMessage = commit.full;
00467|                             spinner.succeed('提交信息已生成');
00468|                         }
00469| 
00470|                         console.log(chalk.gray(`\n📝 提交信息:\n  ${commitMessage}\n`));
00471| 
00472|                         // 执行提交
00473|                         spinner.start('正在提交...');
00474|                         try {
00475|                             await gitService.commit(commitMessage);
00476|                             spinner.succeed('提交成功！');
00477| 
00478|                             console.log(chalk.green('✅ 代码已自动提交到 Git 仓库'));
00479|                         } catch (error: any) {
00480|                             spinner.fail('提交失败');
00481|                             console.log(chalk.red(`错误: ${error.message}`));
00482|                             console.log(chalk.yellow('💡 请手动提交代码'));
00483|                         }
00484|                     } else {
00485|                         console.log(chalk.yellow('\n⚠️  没有需要提交的变更'));
00486|                     }
00487|                 } else if (finalProgress.completed === finalProgress.total) {
00488|                     console.log(chalk.cyan('\n💡 提示：所有任务已完成'));
00489|                     console.log(chalk.gray('   使用 --commit 选项可以自动提交代码'));
00490|                 }
00491| 
00492|             } catch (e: unknown) {
00493|                 if (e instanceof Error && (e as NodeJS.ErrnoException).code === 'ENOENT') {
00494|                     spinner.fail('未找到 todo.md 文件');
00495|                     console.log(chalk.yellow('\n💡 建议流程:'));
00496|                     console.log(chalk.gray('  1. yuangs git plan "你的需求"  # 生成任务清单'));
00497|                     console.log(chalk.gray('  2. yuangs git auto            # 启动自动化工作流\n'));
00498|                 } else if (e instanceof AIError) {
00499|                     spinner.fail(formatError(e, 'AI 调用失败'));
00500|                     const suggestion = getSuggestion(e);
00501|                     if (suggestion) {
00502|                         console.log(chalk.yellow(`💡 ${suggestion}`));
00503|                     }
00504|                 } else if (e instanceof Error) {
00505|                     spinner.fail(formatError(e, '执行失败'));
00506|                     const suggestion = getSuggestion(e);
00507|                     if (suggestion) {
00508|                         console.log(chalk.yellow(`💡 ${suggestion}`));
00509|                     }
00510|                 } else {
00511|                     spinner.fail('未知错误');
00512|                 }
00513|             }
00514|         });
00515| }
00516| 

(End of file - total 516 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/ygs/npm_yuangs/src/commands/git/constants.ts"
}
```
**Output:**
```
<file>
00001| /**
00002|  * Git 命令相关常量配置
00003|  * 
00004|  * 支持通过环境变量覆盖默认值，提供更灵活的配置能力
00005|  */
00006| 
00007| /**
00008|  * 从环境变量获取数值配置，带默认值和验证
00009|  */
00010| function getEnvNumber(key: string, defaultValue: number, min?: number, max?: number): number {
00011|     const value = process.env[key];
00012|     if (!value) return defaultValue;
00013| 
00014|     const parsed = parseInt(value, 10);
00015|     if (isNaN(parsed)) {
00016|         console.warn(`⚠️  环境变量 ${key} 的值 "${value}" 无效，使用默认值 ${defaultValue}`);
00017|         return defaultValue;
00018|     }
00019| 
00020|     if (min !== undefined && parsed < min) {
00021|         console.warn(`⚠️  环境变量 ${key} 的值 ${parsed} 小于最小值 ${min}，使用最小值`);
00022|         return min;
00023|     }
00024| 
00025|     if (max !== undefined && parsed > max) {
00026|         console.warn(`⚠️  环境变量 ${key} 的值 ${parsed} 大于最大值 ${max}，使用最大值`);
00027|         return max;
00028|     }
00029| 
00030|     return parsed;
00031| }
00032| 
00033| /**
00034|  * Diff 行数估算配置
00035|  * 
00036|  * 数据来源：基于对 100+ 个真实项目的统计分析（2024-2025）
00037|  * - 小型变更（1-10 文件）：平均每文件 45-55 行，取中值 50
00038|  * - 大型变更（10+ 文件）：平均每文件 80-120 行，取中值 100
00039|  * - 适用范围：TypeScript/JavaScript 项目，其他语言可能需要调整
00040|  * 
00041|  * 环境变量覆盖：
00042|  * - YUANGS_DIFF_LINES_DEFAULT: 默认每文件行数（范围 10-500）
00043|  * - YUANGS_DIFF_LINES_FALLBACK: 后备每文件行数（范围 10-1000）
00044|  */
00045| export const DIFF_ESTIMATION = {
00046|     /** 默认每文件估算行数（用于有文件但无 numstat 数据的情况） */
00047|     LINES_PER_FILE_DEFAULT: getEnvNumber('YUANGS_DIFF_LINES_DEFAULT', 50, 10, 500),
00048| 
00049|     /** 后备每文件估算行数（用于 numstat 完全失败的情况） */
00050|     LINES_PER_FILE_FALLBACK: getEnvNumber('YUANGS_DIFF_LINES_FALLBACK', 100, 10, 1000),
00051| } as const;
00052| 
00053| /**
00054|  * 安全扫描配置
00055|  * 
00056|  * 数据来源：基于性能测试和用户反馈（2024-2025）
00057|  * - 文件数量限制：50 个文件的扫描时间约 1.5-2s，超过 100 个会明显影响体验
00058|  * - 并发数：5 个并发在大多数机器上平衡了速度和资源占用
00059|  * - 文件大小：1MB 以上的文件通常是编译产物或依赖，扫描价值低
00060|  * 
00061|  * 环境变量覆盖：
00062|  * - YUANGS_SCAN_MAX_FILES: 最大扫描文件数（范围 1-200）
00063|  * - YUANGS_SCAN_CONCURRENT: 并发数（范围 1-20）
00064|  * - YUANGS_SCAN_MAX_SIZE_MB: 最大文件大小（MB，范围 0.1-100）
00065|  */
00066| export const SECURITY_SCAN = {
00067|     /** 最大扫描文件数量，避免性能问题 */
00068|     MAX_SCAN_FILES: getEnvNumber('YUANGS_SCAN_MAX_FILES', 50, 1, 200),
00069| 
00070|     /** 最大并发扫描数，避免资源耗尽 */
00071|     MAX_CONCURRENT: getEnvNumber('YUANGS_SCAN_CONCURRENT', 5, 1, 20),
00072| 
00073|     /** 最大文件大小（字节），避免扫描大文件 */
00074|     MAX_FILE_SIZE: getEnvNumber('YUANGS_SCAN_MAX_SIZE_MB', 1, 0.1, 100) * 1024 * 1024,
00075| } as const;
00076| 
00077| /**
00078|  * Capability Level 显示名称映射
00079|  * 确保枚举变更不会破坏输出兼容性
00080|  */
00081| export const CAPABILITY_LEVEL_DISPLAY = {
00082|     SEMANTIC: 'SEMANTIC',
00083|     STRUCTURAL: 'STRUCTURAL',
00084|     LINE: 'LINE',
00085|     TEXT: 'TEXT',
00086|     NONE: 'NONE',
00087| } as const;
00088| 

(End of file - total 88 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/ygs/npm_yuangs/src/commands/git/utils.ts"
}
```
**Output:**
```
<file>
00001| /**
00002|  * Git 命令工具函数
00003|  */
00004| 
00005| /**
00006|  * LLM 输出清理策略
00007|  */
00008| export enum CleanStrategy {
00009|     /** 保守模式：仅清理明确的 Markdown fence */
00010|     CONSERVATIVE = 'conservative',
00011|     /** 宽松模式：清理 fence 和常见对话式前缀/后缀 */
00012|     LENIENT = 'lenient',
00013| }
00014| 
00015| /**
00016|  * 清理 LLM 输出中的格式化标记
00017|  * 
00018|  * 适用场景：
00019|  * - LLM 返回的内容被包裹在 Markdown 代码块中（```markdown ... ```）
00020|  * - LLM 添加了对话式前缀（如"好的"、"这是"）或后缀（如"希望这对你有帮助"）
00021|  * 
00022|  * 限制：
00023|  * - 仅处理 Markdown fence 和简单的对话式文本
00024|  * - 不处理其他格式异常（如 JSON、XML 包裹等）
00025|  * - 假设内容主体是有效的 Markdown 文本
00026|  * 
00027|  * 未来扩展：
00028|  * - 可添加 JSON/XML 格式的检测和清理
00029|  * - 可添加更多对话式模式的识别
00030|  * - 可支持自定义清理规则
00031|  * 
00032|  * @param content LLM 原始输出
00033|  * @param strategy 清理策略（默认：保守模式）
00034|  * @returns 清理后的内容
00035|  * 
00036|  * @example
00037|  * ```typescript
00038|  * // 保守模式（默认）
00039|  * cleanLLMOutput('```markdown\n# Title\n```') // => '# Title'
00040|  * 
00041|  * // 宽松模式
00042|  * cleanLLMOutput('好的，这是内容\n# Title\n希望有帮助', CleanStrategy.LENIENT)
00043|  * // => '# Title'
00044|  * ```
00045|  */
00046| export function cleanLLMOutput(
00047|     content: string,
00048|     strategy: CleanStrategy = CleanStrategy.CONSERVATIVE
00049| ): string {
00050|     let cleaned = content.trim();
00051| 
00052|     // 检测并移除 Markdown fence
00053|     const hasOpeningFence = /^```(markdown|md)?\\s*\\n/i.test(cleaned);
00054|     const hasClosingFence = /\\n\\s*```$/.test(cleaned);
00055| 
00056|     if (hasOpeningFence || hasClosingFence) {
00057|         // 仅在存在 fence 时进行清理
00058|         cleaned = cleaned.replace(/^```(markdown|md)?\\s*\\n/i, '');
00059|         cleaned = cleaned.replace(/\\n\\s*```$/, '');
00060|     }
00061| 
00062|     // 宽松模式：额外清理对话式前缀和后缀
00063|     if (strategy === CleanStrategy.LENIENT) {
00064|         // 移除常见的对话式前缀（如"好的"、"这是"、"以下是"等）
00065|         cleaned = cleaned.replace(/^(好的[，,。.]?|这是|以下是|为您生成|已生成)[^\\n]*\\n+/i, '');
00066| 
00067|         // 移除常见的对话式后缀（如"希望这对你有帮助"等）
00068|         cleaned = cleaned.replace(/\\n+(希望|祝|如有|还有)[^\\n]*$/i, '');
00069|     }
00070| 
00071|     return cleaned.trim();
00072| }
00073| 
00074| /**
00075|  * 对文件列表进行去重
00076|  * 
00077|  * 用于合并 staged 和 unstaged 文件列表时避免重复计数
00078|  * 
00079|  * @param files 文件路径数组
00080|  * @returns 去重后的文件路径数组
00081|  * 
00082|  * @example
00083|  * ```typescript
00084|  * const staged = ['src/a.ts', 'src/b.ts'];
00085|  * const unstaged = ['src/b.ts', 'src/c.ts'];
00086|  * deduplicateFiles([...staged, ...unstaged])
00087|  * // => ['src/a.ts', 'src/b.ts', 'src/c.ts']
00088|  * ```
00089|  */
00090| export function deduplicateFiles(files: string[]): string[] {
00091|     return Array.from(new Set(files));
00092| }
00093| 
00094| /**
00095|  * 获取 Capability Level 的显示名称
00096|  * 
00097|  * 提供 fallback 处理，避免枚举变更破坏输出
00098|  * 
00099|  * @param level Capability Level 枚举值
00100|  * @returns 显示名称
00101|  * 
00102|  * @example
00103|  * ```typescript
00104|  * getCapabilityLevelDisplay(4) // => 'SEMANTIC'
00105|  * getCapabilityLevelDisplay(999) // => 'UNKNOWN(999)'
00106|  * ```
00107|  */
00108| export function getCapabilityLevelDisplay(level: number): string {
00109|     const levelNames: Record<number, string> = {
00110|         0: 'NONE',
00111|         1: 'TEXT',
00112|         2: 'LINE',
00113|         3: 'STRUCTURAL',
00114|         4: 'SEMANTIC',
00115|     };
00116| 
00117|     return levelNames[level] || `UNKNOWN(${level})`;
00118| }
00119| 

(End of file - total 119 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/ygs/npm_yuangs/src/commands/git/errors.ts"
}
```
**Output:**
```
<file>
00001| /**
00002|  * Git 命令自定义错误类型
00003|  * 
00004|  * 提供类型安全的错误处理，避免依赖字符串匹配
00005|  * 携带结构化上下文信息，提升错误处理和日志能力
00006|  */
00007| 
00008| /**
00009|  * 基础 Git 错误
00010|  */
00011| export class GitError extends Error {
00012|     /** 错误发生的时间戳 */
00013|     readonly timestamp: Date;
00014| 
00015|     /** 额外的上下文数据 */
00016|     readonly context?: Record<string, any>;
00017| 
00018|     constructor(message: string, context?: Record<string, any>) {
00019|         super(message);
00020|         this.name = 'GitError';
00021|         this.timestamp = new Date();
00022|         this.context = context;
00023| 
00024|         // 修复原型链，确保 instanceof 在所有环境下正常工作
00025|         Object.setPrototypeOf(this, new.target.prototype);
00026|     }
00027| 
00028|     /**
00029|      * 获取格式化的错误信息（包含上下文）
00030|      */
00031|     getDetailedMessage(): string {
00032|         let msg = `[${this.name}] ${this.message}`;
00033| 
00034|         if (this.context && Object.keys(this.context).length > 0) {
00035|             msg += `\\n上下文: ${JSON.stringify(this.context, null, 2)}`;
00036|         }
00037| 
00038|         return msg;
00039|     }
00040| }
00041| 
00042| /**
00043|  * 未找到变更错误
00044|  */
00045| export class NoChangesFoundError extends GitError {
00046|     /** 检查的 commit 引用 */
00047|     readonly commitRef?: string;
00048| 
00049|     /** 检查的文件列表 */
00050|     readonly files?: string[];
00051| 
00052|     constructor(message: string = 'No changes found', options?: {
00053|         commitRef?: string;
00054|         files?: string[];
00055|         context?: Record<string, any>;
00056|     }) {
00057|         super(message, options?.context);
00058|         this.name = 'NoChangesFoundError';
00059|         this.commitRef = options?.commitRef;
00060|         this.files = options?.files;
00061| 
00062|         Object.setPrototypeOf(this, new.target.prototype);
00063|     }
00064| }
00065| 
00066| /**
00067|  * Commit 不存在错误
00068|  */
00069| export class CommitNotFoundError extends GitError {
00070|     /** 查找的 commit 引用 */
00071|     readonly commitRef: string;
00072| 
00073|     /** 仓库路径 */
00074|     readonly repoPath?: string;
00075| 
00076|     constructor(commitRef: string, options?: {
00077|         repoPath?: string;
00078|         context?: Record<string, any>;
00079|     }) {
00080|         super(`Commit not found: ${commitRef}`, options?.context);
00081|         this.name = 'CommitNotFoundError';
00082|         this.commitRef = commitRef;
00083|         this.repoPath = options?.repoPath;
00084| 
00085|         Object.setPrototypeOf(this, new.target.prototype);
00086|     }
00087| }
00088| 
00089| /**
00090|  * 无审查内容错误
00091|  */
00092| export class NoReviewContentError extends GitError {
00093|     /** 尝试审查的文件列表 */
00094|     readonly files?: string[];
00095| 
00096|     /** 是否检查了 staged 文件 */
00097|     readonly checkedStaged?: boolean;
00098| 
00099|     /** 是否检查了 unstaged 文件 */
00100|     readonly checkedUnstaged?: boolean;
00101| 
00102|     constructor(message: string = 'No changes to review', options?: {
00103|         files?: string[];
00104|         checkedStaged?: boolean;
00105|         checkedUnstaged?: boolean;
00106|         context?: Record<string, any>;
00107|     }) {
00108|         super(message, options?.context);
00109|         this.name = 'NoReviewContentError';
00110|         this.files = options?.files;
00111|         this.checkedStaged = options?.checkedStaged;
00112|         this.checkedUnstaged = options?.checkedUnstaged;
00113| 
00114|         Object.setPrototypeOf(this, new.target.prototype);
00115|     }
00116| }
00117| 
00118| /**
00119|  * 检查错误是否为特定类型
00120|  */
00121| export function isGitError(error: unknown): error is GitError {
00122|     return error instanceof GitError;
00123| }
00124| 
00125| export function isNoChangesFoundError(error: unknown): error is NoChangesFoundError {
00126|     return error instanceof NoChangesFoundError;
00127| }
00128| 
00129| export function isCommitNotFoundError(error: unknown): error is CommitNotFoundError {
00130|     return error instanceof CommitNotFoundError;
00131| }
00132| 
00133| export function isNoReviewContentError(error: unknown): error is NoReviewContentError {
00134|     return error instanceof NoReviewContentError;
00135| }
00136| 
00137| /**
00138|  * 从任意错误中提取详细信息
00139|  * 
00140|  * @param error 任意错误对象
00141|  * @returns 格式化的错误信息
00142|  */
00143| export function getErrorDetails(error: unknown): string {
00144|     if (isGitError(error)) {
00145|         return error.getDetailedMessage();
00146|     }
00147| 
00148|     if (error instanceof Error) {
00149|         return `[${error.name}] ${error.message}`;
00150|     }
00151| 
00152|     return String(error);
00153| }
00154| 

(End of file - total 154 lines)
</file>
```
```

---

## Assistant (Sisyphus · glm-4.7 · 23.5s)

_Thinking:_

很好，现在我已经读取了所有git命令相关的文件。让我继续读取核心的git服务实现文件。

```
Tool: glob

**Input:**
```json
{
  "pattern": "src/core/git/*.ts"
}
```
**Output:**
```
Found 12 file(s)

./src/core/git/constants.ts
./src/core/git/TodoManager.ts
./src/core/git/ProgressManager.ts
./src/core/git/GitService.ts
./src/core/git/GitConfigManager.ts
./src/core/git/ErrorHandler.ts
./src/core/git/ContextGatherer.ts
./src/core/git/CodeReviewer.ts
./src/core/git/CodeGenerator.ts
./src/core/git/BranchAdvisor.ts
./src/core/git/GitContextAggregator.ts
./src/core/git/CommitMessageGenerator.ts
```
```

---

## Assistant (Sisyphus · glm-4.7 · 27.1s)

_Thinking:_

好的，找到了核心的git服务文件。让我读取关键的文件来了解底层实现。

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/ygs/npm_yuangs/src/core/git/GitService.ts"
}
```
**Output:**
```
<file>
00001| import { exec } from 'child_process';
00002| import { promisify } from 'util';
00003| import * as path from 'path';
00004| 
00005| const execAsync = promisify(exec);
00006| 
00007| /**
00008|  * Git 变更信息
00009|  */
00010| export interface GitDiff {
00011|     staged: string | null;
00012|     unstaged: string | null;
00013|     files: {
00014|         staged: string[];
00015|         unstaged: string[];
00016|     };
00017| }
00018| 
00019| /**
00020|  * Git Numstat 统计信息
00021|  */
00022| export interface GitNumstat {
00023|     added: number;
00024|     deleted: number;
00025|     files: string[];
00026| }
00027| 
00028| /**
00029|  * Git 分支信息
00030|  */
00031| export interface GitBranchInfo {
00032|     current: string;
00033|     upstream?: string;
00034|     ahead: number;
00035|     behind: number;
00036| }
00037| 
00038| /**
00039|  * Git 提交信息
00040|  */
00041| export interface GitCommitInfo {
00042|     hash: string;
00043|     author: string;
00044|     date: string;
00045|     message: string;
00046| }
00047| 
00048| /**
00049|  * Git 服务类
00050|  * 提供完整的 Git 操作能力
00051|  */
00052| export class GitService {
00053|     private cwd: string;
00054| 
00055|     constructor(cwd: string = process.cwd()) {
00056|         this.cwd = cwd;
00057|     }
00058| 
00059|     /**
00060|      * 执行 Git 命令
00061|      */
00062|     private async exec(command: string): Promise<string> {
00063|         try {
00064|             const { stdout } = await execAsync(`git ${command}`, {
00065|                 cwd: this.cwd,
00066|                 maxBuffer: 10 * 1024 * 1024, // 10MB
00067|             });
00068|             return stdout.trim();
00069|         } catch (error: any) {
00070|             throw new Error(`Git command failed: ${error.message}`);
00071|         }
00072|     }
00073| 
00074|     /**
00075|      * 安全执行 Git 命令(失败返回 null)
00076|      */
00077|     private async execSafe(command: string): Promise<string | null> {
00078|         try {
00079|             return await this.exec(command);
00080|         } catch {
00081|             return null;
00082|         }
00083|     }
00084| 
00085|     /**
00086|      * 检查是否在 Git 仓库中
00087|      */
00088|     async isGitRepository(): Promise<boolean> {
00089|         const result = await this.execSafe('rev-parse --git-dir');
00090|         return result !== null;
00091|     }
00092| 
00093|     /**
00094|      * 获取当前分支信息
00095|      */
00096|     async getBranchInfo(): Promise<GitBranchInfo> {
00097|         const current = await this.exec('rev-parse --abbrev-ref HEAD');
00098|         const upstream = await this.execSafe(`rev-parse --abbrev-ref ${current}@{upstream}`);
00099| 
00100|         let ahead = 0;
00101|         let behind = 0;
00102| 
00103|         if (upstream) {
00104|             const aheadResult = await this.execSafe(`rev-list --count ${upstream}..HEAD`);
00105|             const behindResult = await this.execSafe(`rev-list --count HEAD..${upstream}`);
00106|             ahead = aheadResult ? parseInt(aheadResult, 10) : 0;
00107|             behind = behindResult ? parseInt(behindResult, 10) : 0;
00108|         }
00109| 
00110|         return {
00111|             current,
00112|             upstream: upstream || undefined,
00113|             ahead,
00114|             behind,
00115|         };
00116|     }
00117| 
00118|     /**
00119|      * 获取完整的 diff 信息
00120|      */
00121|     async getDiff(): Promise<GitDiff> {
00122|         const staged = await this.execSafe('diff --staged');
00123|         const unstaged = await this.execSafe('diff');
00124| 
00125|         const stagedFiles = await this.execSafe('diff --staged --name-only');
00126|         const unstagedFiles = await this.execSafe('diff --name-only');
00127| 
00128|         return {
00129|             staged,
00130|             unstaged,
00131|             files: {
00132|                 staged: stagedFiles ? stagedFiles.split('\n').filter(Boolean) : [],
00133|                 unstaged: unstagedFiles ? unstagedFiles.split('\n').filter(Boolean) : [],
00134|             },
00135|         };
00136|     }
00137| 
00138|     /**
00139|      * 获取 diff 的 numstat 统计信息（准确统计行数）
00140|      * 格式：added deleted filename
00141|      */
00142|     async getDiffNumstat(): Promise<GitNumstat> {
00143|         const stagedNumstat = await this.execSafe('diff --staged --numstat');
00144|         const unstagedNumstat = await this.execSafe('diff --numstat');
00145| 
00146|         let totalAdded = 0;
00147|         let totalDeleted = 0;
00148|         const allFiles: string[] = [];
00149| 
00150|         // 解析 staged 的 numstat
00151|         if (stagedNumstat) {
00152|             for (const line of stagedNumstat.split('\n')) {
00153|                 if (!line.trim()) continue;
00154|                 const parts = line.split(/\s+/);
00155|                 if (parts.length >= 3) {
00156|                     const added = parseInt(parts[0], 10) || 0;
00157|                     const deleted = parseInt(parts[1], 10) || 0;
00158|                     totalAdded += added;
00159|                     totalDeleted += deleted;
00160|                     // 最后部分是文件名（可能包含空格）
00161|                     const fileName = parts.slice(2).join(' ');
00162|                     allFiles.push(fileName);
00163|                 }
00164|             }
00165|         }
00166| 
00167|         // 解析 unstaged 的 numstat
00168|         if (unstagedNumstat) {
00169|             for (const line of unstagedNumstat.split('\n')) {
00170|                 if (!line.trim()) continue;
00171|                 const parts = line.split(/\s+/);
00172|                 if (parts.length >= 3) {
00173|                     const added = parseInt(parts[0], 10) || 0;
00174|                     const deleted = parseInt(parts[1], 10) || 0;
00175|                     totalAdded += added;
00176|                     totalDeleted += deleted;
00177|                     // 最后部分是文件名（可能包含空格）
00178|                     const fileName = parts.slice(2).join(' ');
00179|                     allFiles.push(fileName);
00180|                 }
00181|             }
00182|         }
00183| 
00184|         return {
00185|             added: totalAdded,
00186|             deleted: totalDeleted,
00187|             files: allFiles,
00188|         };
00189|     }
00190| 
00191|     /**
00192|      * 获取文件的 diff
00193|      */
00194|     async getFileDiff(filePath: string, staged: boolean = false): Promise<string | null> {
00195|         const stagedFlag = staged ? '--staged' : '';
00196|         return await this.execSafe(`diff ${stagedFlag} -- ${filePath}`);
00197|     }
00198| 
00199|     /**
00200|      * 获取指定 commit 的 diff
00201|      * @param commitHash commit hash 或引用（如 HEAD~1）
00202|      * @returns diff 内容
00203|      */
00204|     async getCommitDiff(commitHash: string): Promise<{ diff: string | null; files: string[] }> {
00205|         const diff = await this.execSafe(`show ${commitHash} --format=`); // 使用空格式避免输出 commit 信息
00206|         const files = await this.execSafe(`diff-tree --name-only -r ${commitHash}`);
00207|         
00208|         return {
00209|             diff,
00210|             files: files ? files.split('\n').filter(Boolean) : [],
00211|         };
00212|     }
00213| 
00214|     /**
00215|      * 获取两个 commit 之间的 diff
00216|      * @param from 起始 commit
00217|      * @param to 结束 commit（默认为 HEAD）
00218|      * @returns diff 内容
00219|      */
00220|     async getCommitRangeDiff(from: string, to: string = 'HEAD'): Promise<{ diff: string | null; files: string[] }> {
00221|         const diff = await this.execSafe(`diff ${from}...${to}`);
00222|         const files = await this.execSafe(`diff --name-only ${from}...${to}`);
00223|         
00224|         return {
00225|             diff,
00226|             files: files ? files.split('\n').filter(Boolean) : [],
00227|         };
00228|     }
00229| 
00230|     /**
00231|      * 获取 commit 的详细信息
00232|      * @param commitHash commit hash
00233|      * @returns commit 信息
00234|      */
00235|     async getCommitInfo(commitHash: string): Promise<GitCommitInfo | null> {
00236|         const format = '%H%n%an%n%ai%n%s';
00237|         const output = await this.execSafe(`log -1 --format="${format}" ${commitHash}`);
00238|         
00239|         if (!output) return null;
00240|         
00241|         const lines = output.trim().split('\n');
00242|         if (lines.length >= 4) {
00243|             return {
00244|                 hash: lines[0],
00245|                 author: lines[1],
00246|                 date: lines[2],
00247|                 message: lines[3],
00248|             };
00249|         }
00250|         
00251|         return null;
00252|     }
00253| 
00254|     /**
00255|      * 获取最近的提交历史
00256|      */
00257|     async getRecentCommits(count: number = 10): Promise<GitCommitInfo[]> {
00258|         const format = '%H%n%an%n%ai%n%s%n---COMMIT-END---';
00259|         const log = await this.execSafe(`log -${count} --format="${format}"`);
00260| 
00261|         if (!log) return [];
00262| 
00263|         const commits: GitCommitInfo[] = [];
00264|         const commitBlocks = log.split('---COMMIT-END---').filter(Boolean);
00265| 
00266|         for (const block of commitBlocks) {
00267|             const lines = block.trim().split('\n');
00268|             if (lines.length >= 4) {
00269|                 commits.push({
00270|                     hash: lines[0],
00271|                     author: lines[1],
00272|                     date: lines[2],
00273|                     message: lines[3],
00274|                 });
00275|             }
00276|         }
00277| 
00278|         return commits;
00279|     }
00280| 
00281|     /**
00282|      * 暂存文件
00283|      */
00284|     async stageFiles(files: string[]): Promise<void> {
00285|         if (files.length === 0) return;
00286|         await this.exec(`add ${files.map(f => `"${f}"`).join(' ')}`);
00287|     }
00288| 
00289|     /**
00290|      * 暂存所有变更
00291|      */
00292|     async stageAll(): Promise<void> {
00293|         await this.exec('add -A');
00294|     }
00295| 
00296|     /**
00297|    * 提交变更 (使用 stdin 避免 shell escaping 问题)
00298|    */
00299|     async commit(message: string): Promise<string> {
00300|         return new Promise((resolve, reject) => {
00301|             const { spawn } = require('child_process');
00302|             const gitCommit = spawn('git', ['commit', '-F', '-'], {
00303|                 cwd: this.cwd,
00304|             });
00305| 
00306|             let stdout = '';
00307|             let stderr = '';
00308| 
00309|             gitCommit.stdout.on('data', (data: Buffer) => {
00310|                 stdout += data.toString();
00311|             });
00312| 
00313|             gitCommit.stderr.on('data', (data: Buffer) => {
00314|                 stderr += data.toString();
00315|             });
00316| 
00317|             gitCommit.on('close', (code: number) => {
00318|                 if (code === 0) {
00319|                     resolve(stdout.trim());
00320|                 } else {
00321|                     reject(new Error(`Git commit failed: ${stderr || stdout}`));
00322|                 }
00323|             });
00324| 
00325|             gitCommit.on('error', (error: Error) => {
00326|                 reject(new Error(`Git commit failed: ${error.message}`));
00327|             });
00328| 
00329|             // 写入 commit message 到 stdin
00330|             gitCommit.stdin.write(message);
00331|             gitCommit.stdin.end();
00332|         });
00333|     }
00334| 
00335|     /**
00336|      * 获取 Git 状态摘要
00337|      */
00338|     async getStatusSummary(): Promise<{
00339|         modified: number;
00340|         added: number;
00341|         deleted: number;
00342|         untracked: number;
00343|     }> {
00344|         const status = await this.execSafe('status --porcelain');
00345|         if (!status) {
00346|             return { modified: 0, added: 0, deleted: 0, untracked: 0 };
00347|         }
00348| 
00349|         const lines = status.split('\n');
00350|         let modified = 0;
00351|         let added = 0;
00352|         let deleted = 0;
00353|         let untracked = 0;
00354| 
00355|         for (const line of lines) {
00356|             const statusCode = line.substring(0, 2);
00357|             if (statusCode.includes('M')) modified++;
00358|             if (statusCode.includes('A')) added++;
00359|             if (statusCode.includes('D')) deleted++;
00360|             if (statusCode.includes('?')) untracked++;
00361|         }
00362| 
00363|         return { modified, added, deleted, untracked };
00364|     }
00365| 
00366|     /**
00367|      * 获取仓库根目录
00368|      */
00369|     async getRepoRoot(): Promise<string> {
00370|         const root = await this.exec('rev-parse --show-toplevel');
00371|         return root;
00372|     }
00373| 
00374|     /**
00375|      * 获取当前提交的 hash
00376|      */
00377|     async getCurrentCommitHash(): Promise<string> {
00378|         return await this.exec('rev-parse HEAD');
00379|     }
00380| 
00381|     async isWorkingTreeClean(): Promise<boolean> {
00382|         const status = await this.execSafe('status --porcelain');
00383|         return !status || status.length === 0;
00384|     }
00385| 
00386|     /**
00387|      * 获取所有本地分支信息
00388|      */
00389|     async getBranches(): Promise<{
00390|         current: string;
00391|         all: string[];
00392|         details: Array<{
00393|             name: string;
00394|             isCurrent: boolean;
00395|             hash: string;
00396|             date?: string;
00397|             subject?: string;
00398|             upstream?: string;
00399|             ahead?: number;
00400|             behind?: number;
00401|         }>;
00402|     }> {
00403|         const current = await this.exec('rev-parse --abbrev-ref HEAD');
00404| 
00405|         // 使用 format 获取更详细的信息: name, objectname, committerdate:iso8601, subject, upstream, ahead-behind
00406|         const format = '%(refname:short)|%(objectname:short)|%(committerdate:iso8601)|%(subject)|%(upstream:short)|%(upstream:track)';
00407|         const output = await this.exec(`for-each-ref --sort=-committerdate --format="${format}" refs/heads`);
00408| 
00409|         const lines = output.split('\n').filter(Boolean);
00410|         const all: string[] = [];
00411|         const details = lines.map(line => {
00412|             const [name, hash, date, subject, upstream, track] = line.split('|');
00413|             all.push(name);
00414| 
00415|             // 解析 ahead/behind
00416|             let ahead = 0;
00417|             let behind = 0;
00418|             if (track) {
00419|                 const aheadMatch = track.match(/ahead (\d+)/);
00420|                 const behindMatch = track.match(/behind (\d+)/);
00421|                 if (aheadMatch) ahead = parseInt(aheadMatch[1], 10);
00422|                 if (behindMatch) behind = parseInt(behindMatch[1], 10);
00423|             }
00424| 
00425|             return {
00426|                 name,
00427|                 isCurrent: name === current,
00428|                 hash,
00429|                 date,
00430|                 subject,
00431|                 upstream: upstream || undefined,
00432|                 ahead,
00433|                 behind
00434|             };
00435|         });
00436| 
00437|         return { current, all, details };
00438|     }
00439| 
00440|     /**
00441|      * 安全执行带参数的 Git 命令 (不经过 shell)
00442|      */
00443|     private async execArgs(args: string[]): Promise<string> {
00444|         return new Promise((resolve, reject) => {
00445|             const { spawn } = require('child_process');
00446|             const child = spawn('git', args, { cwd: this.cwd });
00447| 
00448|             let stdout = '';
00449|             let stderr = '';
00450| 
00451|             child.stdout.on('data', (data: Buffer) => stdout += data.toString());
00452|             child.stderr.on('data', (data: Buffer) => stderr += data.toString());
00453| 
00454|             child.on('close', (code: number) => {
00455|                 if (code === 0) resolve(stdout.trim());
00456|                 else reject(new Error(`Git command failed: git ${args.join(' ')}\n${stderr || stdout}`));
00457|             });
00458| 
00459|             child.on('error', (err: Error) => reject(new Error(`Git command failed: ${err.message}`)));
00460|         });
00461|     }
00462| 
00463|     /**
00464|      * 切换分支 (Safe)
00465|      */
00466|     async switchBranch(name: string): Promise<void> {
00467|         await this.execArgs(['checkout', name]);
00468|     }
00469| 
00470|     /**
00471|      * 创建新分支 (Safe)
00472|      */
00473|     async createBranch(name: string, startPoint?: string): Promise<void> {
00474|         const args = startPoint ? ['checkout', '-b', name, startPoint] : ['checkout', '-b', name];
00475|         await this.execArgs(args);
00476|     }
00477| 
00478|     /**
00479|      * 验证分支名称是否符合 Git 规范
00480|      */
00481|     async isValidBranchName(name: string): Promise<boolean> {
00482|         try {
00483|             // 使用 git check-ref-format --branch 验证分支名
00484|             await this.exec(`check-ref-format --branch "${name}"`);
00485|             return true;
00486|         } catch {
00487|             return false;
00488|         }
00489|     }
00490| 
00491|     /**
00492|      * 保存当前工作目录快照（用于回滚）
00493|      */
00494|     async saveSnapshot(snapshotName: string): Promise<string> {
00495|         const stashResult = await this.execSafe(`save --include-untracked -m "${snapshotName}"`);
00496|         if (stashResult) {
00497|             return 'stashed';
00498|         }
00499|         
00500|         const status = await this.getStatusSummary();
00501|         if (status.modified === 0 && status.added === 0 && status.deleted === 0 && status.untracked === 0) {
00502|             return 'clean';
00503|         }
00504|         
00505|         throw new Error('Unable to save snapshot');
00506|     }
00507| 
00508|     /**
00509|      * 恢复到之前的快照
00510|      */
00511|     async restoreSnapshot(): Promise<void> {
00512|         await this.execArgs(['reset', '--hard', 'HEAD']);
00513|         await this.execArgs(['clean', '-fd']);
00514|         
00515|         const stashes = await this.execSafe('stash list');
00516|         if (stashes) {
00517|             const stashRef = stashes.split('\n')[0]?.split(':')[0];
00518|             if (stashRef) {
00519|                 await this.execArgs(['stash', 'drop', stashRef]);
00520|             }
00521|         }
00522|     }
00523| 
00524|     /**
00525|      * 放弃未提交的变更
00526|      */
00527|     async discardChanges(): Promise<void> {
00528|         await this.execArgs(['reset', '--hard', 'HEAD']);
00529|         await this.execArgs(['clean', '-fd']);
00530|     }
00531| }
00532| 

(End of file - total 532 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/ygs/npm_yuangs/src/core/git/CodeReviewer.ts"
}
```
**Output:**
```
<file>
00001| import chalk from 'chalk';
00002| import { GitService } from './GitService';
00003| import { ModelRouter } from '../modelRouter/ModelRouter';
00004| import { TaskConfig, TaskType } from '../modelRouter/types';
00005| import { CapabilityLevel, MinCapability } from '../capability/CapabilityLevel';
00006| import { DecisionInput, ThresholdDegradationPolicy } from '../capability/DegradationPolicy';
00007| 
00008| /**
00009|  * 代码审查级别
00010|  */
00011| export enum ReviewLevel {
00012|     /** 快速审查 - 只看明显问题 */
00013|     QUICK = 'quick',
00014|     /** 标准审查 - 常规检查 */
00015|     STANDARD = 'standard',
00016|     /** 深度审查 - 全面分析 */
00017|     DEEP = 'deep',
00018| }
00019| 
00020| /**
00021|  * 审查问题严重程度
00022|  */
00023| export enum IssueSeverity {
00024|     INFO = 'info',
00025|     WARNING = 'warning',
00026|     ERROR = 'error',
00027|     CRITICAL = 'critical',
00028| }
00029| 
00030| /**
00031|  * 审查问题
00032|  */
00033| export interface ReviewIssue {
00034|     /** 严重程度 */
00035|     severity: IssueSeverity;
00036|     /** 文件路径 */
00037|     file: string;
00038|     /** 行号(可选) */
00039|     line?: number;
00040|     /** 问题描述 */
00041|     message: string;
00042|     /** 建议修复 */
00043|     suggestion?: string;
00044|     /** 代码片段 */
00045|     snippet?: string;
00046| }
00047| 
00048| /**
00049|  * 审查结果
00050|  */
00051| export interface ReviewResult {
00052|     /** 总体评分 (0-100) */
00053|     score: number;
00054|     /** 总体评价 */
00055|     summary: string;
00056|     /** 发现的问题 */
00057|     issues: ReviewIssue[];
00058|     /** 优点 */
00059|     strengths: string[];
00060|     /** 建议 */
00061|     recommendations: string[];
00062|     /** 审查的文件数 */
00063|     filesReviewed: number;
00064|     /** 置信度 (0-1) */
00065|     confidence: number;
00066|     /** 降级决策 */
00067|     degradation?: {
00068|         applied: boolean;
00069|         originalLevel: CapabilityLevel;
00070|         targetLevel: CapabilityLevel;
00071|         reason: string;
00072|     };
00073| }
00074| 
00075| /**
00076|  * AI 代码审查器
00077|  */
00078| export class CodeReviewer {
00079|     public static readonly VERSION = 'v1.0';
00080|     private degradationPolicy: ThresholdDegradationPolicy;
00081| 
00082|     constructor(
00083|         private gitService: GitService,
00084|         private router?: ModelRouter
00085|     ) {
00086|         this.degradationPolicy = new ThresholdDegradationPolicy();
00087|     }
00088| 
00089|     /**
00090|      * 构建审查提示词
00091|      */
00092|     private buildReviewPrompt(diff: string, level: ReviewLevel, capabilityLevel: CapabilityLevel): string {
00093|         const levelInstructions = {
00094|             [ReviewLevel.QUICK]: '快速扫描,只关注明显的 bug、安全问题和严重的代码异味',
00095|             [ReviewLevel.STANDARD]: '进行标准的代码审查,包括代码质量、最佳实践、潜在问题',
00096|             [ReviewLevel.DEEP]: '进行深度审查,包括架构设计、性能优化、安全性、可维护性等所有方面',
00097|         };
00098| 
00099|         const capabilityInstructions = {
00100|             [CapabilityLevel.SEMANTIC]: '进行语义级别的审查,深入理解代码意图和设计',
00101|             [CapabilityLevel.STRUCTURAL]: '进行结构级别的审查,关注代码结构和依赖关系',
00102|             [CapabilityLevel.LINE]: '进行行级别的审查,关注具体代码行的实现',
00103|             [CapabilityLevel.TEXT]: '进行文本级别的审查,关注文本内容和格式',
00104|             [CapabilityLevel.NONE]: '不进行深度审查,仅输出摘要',
00105|         };
00106| 
00107|         return `你是一位资深的代码审查专家。请对以下代码变更进行${levelInstructions[level]}。
00108| 当前能力等级: ${capabilityInstructions[capabilityLevel]}
00109| 
00110| ## 代码变更
00111| \`\`\`diff
00112| ${diff.substring(0, 15000)}${diff.length > 15000 ? '\n... (diff 过长,已截断)' : ''}
00113| \`\`\`
00114| 
00115| ## 审查要点
00116| 1. **代码质量**: 可读性、可维护性、复杂度
00117| 2. **潜在问题**: Bug、边界条件、错误处理
00118| 3. **安全性**: 安全漏洞、敏感信息泄露
00119| 4. **性能**: 性能瓶颈、资源使用
00120| 5. **最佳实践**: 设计模式、编码规范
00121| 6. **测试**: 是否需要测试、测试覆盖
00122| 
00123| ## 输出格式
00124| 请以 JSON 格式输出审查结果:
00125| 
00126| \`\`\`json
00127| {
00128|   "score": 85,
00129|   "summary": "整体代码质量良好,有几处需要改进",
00130|   "issues": [
00131|     {
00132|       "severity": "warning",
00133|       "file": "src/example.ts",
00134|       "line": 42,
00135|       "message": "缺少错误处理",
00136|       "suggestion": "建议添加 try-catch 块",
00137|       "snippet": "相关代码片段"
00138|     }
00139|   ],
00140|   "strengths": [
00141|     "代码结构清晰",
00142|     "命名规范"
00143|   ],
00144|   "recommendations": [
00145|     "建议添加单元测试",
00146|     "考虑提取公共逻辑"
00147|   ],
00148|   "confidence": 0.85
00149| }
00150| \`\`\`
00151| 
00152| 请确保输出是有效的 JSON 格式，并包含 confidence 字段。`;
00153|     }
00154| 
00155|     /**
00156|      * 解析 AI 返回的审查结果
00157|      */
00158|     private parseReviewResult(content: string): Partial<ReviewResult> & { confidence?: number } {
00159|         try {
00160|             // 尝试提取 JSON
00161|             const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
00162|                 content.match(/{[\s\S]*}/);
00163| 
00164|             if (jsonMatch) {
00165|                 const jsonStr = jsonMatch[1] || jsonMatch[0];
00166|                 return JSON.parse(jsonStr);
00167|             }
00168| 
00169|             return this.parseTextReview(content);
00170|         } catch (error) {
00171|             console.warn('Failed to parse review result:', error);
00172|             return {
00173|                 score: 70,
00174|                 summary: content.substring(0, 200),
00175|                 issues: [],
00176|                 strengths: [],
00177|                 recommendations: [],
00178|                 confidence: 0.5,
00179|             };
00180|         }
00181|     }
00182| 
00183|     /**
00184|      * 解析文本格式的审查结果
00185|      */
00186|     private parseTextReview(content: string): Partial<ReviewResult> & { confidence?: number } {
00187|         const issues: ReviewIssue[] = [];
00188|         const strengths: string[] = [];
00189|         const recommendations: string[] = [];
00190| 
00191|         const lines = content.split('\n');
00192|         let currentSection = '';
00193| 
00194|         for (const line of lines) {
00195|             const trimmed = line.trim();
00196|             if (trimmed.includes('问题') || trimmed.includes('Issue')) {
00197|                 currentSection = 'issues';
00198|             } else if (trimmed.includes('优点') || trimmed.includes('Strength')) {
00199|                 currentSection = 'strengths';
00200|             } else if (trimmed.includes('建议') || trimmed.includes('Recommend')) {
00201|                 currentSection = 'recommendations';
00202|             } else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
00203|                 const item = trimmed.substring(1).trim();
00204|                 if (currentSection === 'strengths') {
00205|                     strengths.push(item);
00206|                 } else if (currentSection === 'recommendations') {
00207|                     recommendations.push(item);
00208|                 }
00209|             }
00210|         }
00211| 
00212|         return {
00213|             score: 75,
00214|             summary: content.substring(0, 200),
00215|             issues,
00216|             strengths,
00217|             recommendations,
00218|             confidence: 0.7,
00219|         };
00220|     }
00221| 
00222|     /**
00223|      * 执行代码审查
00224|      */
00225|     async review(
00226|         level: ReviewLevel = ReviewLevel.STANDARD,
00227|         staged: boolean = true
00228|     ): Promise<ReviewResult> {
00229|         const diff = await this.gitService.getDiff();
00230|         const diffContent = staged ? diff.staged : diff.unstaged;
00231| 
00232|         if (!diffContent) {
00233|             throw new Error('No changes to review');
00234|         }
00235| 
00236|         const files = staged ? diff.files.staged : diff.files.unstaged;
00237| 
00238|         if (level === ReviewLevel.DEEP && files.length > 20) {
00239|             throw new Error(
00240|                 'Deep review is not recommended for more than 20 files.\n' +
00241|                 'Please use "--level standard" or review specific files using "--file".'
00242|             );
00243|         }
00244| 
00245|         if (!this.router) {
00246|             throw new Error('AI code review requires model configuration. Please configure AI models using: yuangs config');
00247|         }
00248| 
00249|         const minCapability: MinCapability = {
00250|             minCapability: CapabilityLevel.SEMANTIC,
00251|             fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
00252|         };
00253| 
00254|         let currentCapability = minCapability.minCapability;
00255|         let confidence = 1.0;
00256|         let degradationApplied = false;
00257|         let degradationReason = '';
00258|         const startTime = Date.now();
00259| 
00260|         const taskConfig: TaskConfig = {
00261|             type: TaskType.CODE_REVIEW,
00262|             description: 'Review code changes',
00263|         };
00264| 
00265|         const routingConfig = {
00266|             strategy: 'auto' as any,
00267|         };
00268| 
00269|         const routingResult = await this.router.route(taskConfig, routingConfig);
00270|         console.log(chalk.cyan(`🤖 使用模型: ${routingResult.adapter.name}`));
00271|         console.log(chalk.gray(`📋 理由: ${routingResult.reason}\n`));
00272| 
00273|         const prompt = this.buildReviewPrompt(diffContent, level, currentCapability);
00274| 
00275|         const execution = await this.router.executeTask(
00276|             routingResult.adapter,
00277|             prompt,
00278|             taskConfig
00279|         );
00280| 
00281|         if (!execution.success || !execution.content) {
00282|             throw new Error('Failed to perform code review');
00283|         }
00284| 
00285|         const timeElapsed = Date.now() - startTime;
00286| 
00287|         const parsed = this.parseReviewResult(execution.content);
00288|         confidence = parsed.confidence ?? 0.8;
00289| 
00290|         const decisionInput: DecisionInput = {
00291|             timeElapsed,
00292|             confidence,
00293|         };
00294| 
00295|         const degradationDecision = this.degradationPolicy.decide(decisionInput, minCapability);
00296| 
00297|         if (degradationDecision.shouldDegrade && currentCapability !== degradationDecision.targetLevel) {
00298|             degradationApplied = true;
00299|             degradationReason = degradationDecision.reason;
00300|             console.log(chalk.yellow(`⚠️  降级触发: ${degradationReason}`));
00301|         }
00302| 
00303|         return {
00304|             score: parsed.score || 70,
00305|             summary: parsed.summary || '审查完成',
00306|             issues: parsed.issues || [],
00307|             strengths: parsed.strengths || [],
00308|             recommendations: parsed.recommendations || [],
00309|             filesReviewed: files.length,
00310|             confidence,
00311|             degradation: degradationApplied ? {
00312|                 applied: true,
00313|                 originalLevel: minCapability.minCapability,
00314|                 targetLevel: degradationDecision.targetLevel,
00315|                 reason: degradationReason,
00316|             } : undefined,
00317|         };
00318|     }
00319| 
00320|     /**
00321|      * 审查特定文件
00322|      */
00323|     async reviewFile(
00324|         filePath: string,
00325|         level: ReviewLevel = ReviewLevel.STANDARD
00326|     ): Promise<ReviewResult> {
00327|         const diff = await this.gitService.getFileDiff(filePath, true);
00328| 
00329|         if (!diff) {
00330|             throw new Error(`No changes in file: ${filePath}`);
00331|         }
00332| 
00333|         if (!this.router) {
00334|             throw new Error('AI code review requires model configuration. Please configure AI models using: yuangs config');
00335|         }
00336| 
00337|         const minCapability: MinCapability = {
00338|             minCapability: CapabilityLevel.SEMANTIC,
00339|             fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
00340|         };
00341| 
00342|         let currentCapability = minCapability.minCapability;
00343|         let confidence = 1.0;
00344|         let degradationApplied = false;
00345|         let degradationReason = '';
00346|         const startTime = Date.now();
00347| 
00348|         const taskConfig: TaskConfig = {
00349|             type: TaskType.CODE_REVIEW,
00350|             description: `Review file: ${filePath}`,
00351|         };
00352| 
00353|         const routingConfig = {
00354|             strategy: 'auto' as any,
00355|         };
00356| 
00357|         const routingResult = await this.router.route(taskConfig, routingConfig);
00358|         console.log(chalk.cyan(`🤖 使用模型: ${routingResult.adapter.name}`));
00359|         console.log(chalk.gray(`📋 理由: ${routingResult.reason}\n`));
00360| 
00361|         const prompt = this.buildReviewPrompt(diff, level, currentCapability);
00362| 
00363|         const execution = await this.router.executeTask(
00364|             routingResult.adapter,
00365|             prompt,
00366|             taskConfig
00367|         );
00368| 
00369|         if (!execution.success || !execution.content) {
00370|             throw new Error('Failed to perform code review');
00371|         }
00372| 
00373|         const timeElapsed = Date.now() - startTime;
00374| 
00375|         const parsed = this.parseReviewResult(execution.content);
00376|         confidence = parsed.confidence ?? 0.8;
00377| 
00378|         const decisionInput: DecisionInput = {
00379|             timeElapsed,
00380|             confidence,
00381|         };
00382| 
00383|         const degradationDecision = this.degradationPolicy.decide(decisionInput, minCapability);
00384| 
00385|         if (degradationDecision.shouldDegrade && currentCapability !== degradationDecision.targetLevel) {
00386|             degradationApplied = true;
00387|             degradationReason = degradationDecision.reason;
00388|             console.log(chalk.yellow(`⚠️  降级触发: ${degradationReason}`));
00389|         }
00390| 
00391|         return {
00392|             score: parsed.score || 70,
00393|             summary: parsed.summary || '审查完成',
00394|             issues: parsed.issues || [],
00395|             strengths: parsed.strengths || [],
00396|             recommendations: parsed.recommendations || [],
00397|             filesReviewed: 1,
00398|             confidence,
00399|             degradation: degradationApplied ? {
00400|                 applied: true,
00401|                 originalLevel: minCapability.minCapability,
00402|                 targetLevel: degradationDecision.targetLevel,
00403|                 reason: degradationReason,
00404|             } : undefined,
00405|         };
00406|     }
00407| 
00408|     /**
00409|      * 审查指定 commit
00410|      * @param commitHash commit hash 或引用（如 HEAD~1, abc123）
00411|      * @param level 审查级别
00412|      * @returns 审查结果
00413|      */
00414|     async reviewCommit(
00415|         commitHash: string,
00416|         level: ReviewLevel = ReviewLevel.STANDARD
00417|     ): Promise<ReviewResult> {
00418|         const { diff, files } = await this.gitService.getCommitDiff(commitHash);
00419| 
00420|         if (!diff) {
00421|             throw new Error(`No changes found in commit: ${commitHash}`);
00422|         }
00423| 
00424|         if (!this.router) {
00425|             throw new Error('AI code review requires model configuration. Please configure AI models using: yuangs config');
00426|         }
00427| 
00428|         const minCapability: MinCapability = {
00429|             minCapability: CapabilityLevel.SEMANTIC,
00430|             fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
00431|         };
00432| 
00433|         let currentCapability = minCapability.minCapability;
00434|         let confidence = 1.0;
00435|         let degradationApplied = false;
00436|         let degradationReason = '';
00437|         const startTime = Date.now();
00438| 
00439|         const taskConfig: TaskConfig = {
00440|             type: TaskType.CODE_REVIEW,
00441|             description: `Review commit: ${commitHash}`,
00442|         };
00443| 
00444|         const routingConfig = {
00445|             strategy: 'auto' as any,
00446|         };
00447| 
00448|         const routingResult = await this.router.route(taskConfig, routingConfig);
00449|         console.log(chalk.cyan(`🤖 使用模型: ${routingResult.adapter.name}`));
00450|         console.log(chalk.gray(`📋 理由: ${routingResult.reason}\n`));
00451| 
00452|         const prompt = this.buildReviewPrompt(diff, level, currentCapability);
00453| 
00454|         const execution = await this.router.executeTask(
00455|             routingResult.adapter,
00456|             prompt,
00457|             taskConfig
00458|         );
00459| 
00460|         if (!execution.success || !execution.content) {
00461|             throw new Error('Failed to perform code review');
00462|         }
00463| 
00464|         const timeElapsed = Date.now() - startTime;
00465| 
00466|         const parsed = this.parseReviewResult(execution.content);
00467|         confidence = parsed.confidence ?? 0.8;
00468| 
00469|         const decisionInput: DecisionInput = {
00470|             timeElapsed,
00471|             confidence,
00472|         };
00473| 
00474|         const degradationDecision = this.degradationPolicy.decide(decisionInput, minCapability);
00475| 
00476|         if (degradationDecision.shouldDegrade && currentCapability !== degradationDecision.targetLevel) {
00477|             degradationApplied = true;
00478|             degradationReason = degradationDecision.reason;
00479|             console.log(chalk.yellow(`⚠️  降级触发: ${degradationReason}`));
00480|         }
00481| 
00482|         return {
00483|             score: parsed.score || 70,
00484|             summary: parsed.summary || '审查完成',
00485|             issues: parsed.issues || [],
00486|             strengths: parsed.strengths || [],
00487|             recommendations: parsed.recommendations || [],
00488|             filesReviewed: files.length,
00489|             confidence,
00490|             degradation: degradationApplied ? {
00491|                 applied: true,
00492|                 originalLevel: minCapability.minCapability,
00493|                 targetLevel: degradationDecision.targetLevel,
00494|                 reason: degradationReason,
00495|             } : undefined,
00496|         };
00497|     }
00498| }
00499| 

(End of file - total 499 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/ygs/npm_yuangs/src/core/git/CommitMessageGenerator.ts"
}
```
**Output:**
```
<file>
00001| import { GitService } from './GitService';
00002| import { ModelRouter } from '../modelRouter/ModelRouter';
00003| import { TaskConfig, TaskType } from '../modelRouter/types';
00004| 
00005| /**
00006|  * Commit Message 生成配置
00007|  */
00008| export interface CommitMessageConfig {
00009|     /** 是否包含详细描述 */
00010|     detailed?: boolean;
00011|     /** 提交类型(feat/fix/docs等) */
00012|     type?: string;
00013|     /** 影响范围 */
00014|     scope?: string;
00015|     /** 最大长度 */
00016|     maxLength?: number;
00017| }
00018| 
00019| /**
00020|  * 生成的 Commit Message
00021|  */
00022| export interface GeneratedCommitMessage {
00023|     /** 主标题 */
00024|     title: string;
00025|     /** 详细描述 */
00026|     body?: string;
00027|     /** 完整消息 */
00028|     full: string;
00029|     /** 变更摘要 */
00030|     summary: {
00031|         filesChanged: number;
00032|         insertions: number;
00033|         deletions: number;
00034|     };
00035| }
00036| 
00037| /**
00038|  * 智能 Commit Message 生成器
00039|  */
00040| export class CommitMessageGenerator {
00041|     constructor(
00042|         private gitService: GitService,
00043|         private router?: ModelRouter
00044|     ) { }
00045| 
00046|     /**
00047|      * 分析 diff 获取统计信息
00048|      */
00049|     private analyzeDiff(diff: string): {
00050|         insertions: number;
00051|         deletions: number;
00052|         files: Set<string>;
00053|     } {
00054|         const lines = diff.split('\n');
00055|         let insertions = 0;
00056|         let deletions = 0;
00057|         const files = new Set<string>();
00058| 
00059|         for (const line of lines) {
00060|             if (line.startsWith('+++') || line.startsWith('---')) {
00061|                 const match = line.match(/[ab]\/(.*)/);
00062|                 if (match && match[1] !== '/dev/null') {
00063|                     files.add(match[1]);
00064|                 }
00065|             } else if (line.startsWith('+') && !line.startsWith('+++')) {
00066|                 insertions++;
00067|             } else if (line.startsWith('-') && !line.startsWith('---')) {
00068|                 deletions++;
00069|             }
00070|         }
00071| 
00072|         return { insertions, deletions, files };
00073|     }
00074| 
00075|     /**
00076|      * 构建 AI 提示词
00077|      */
00078|     private buildPrompt(diff: string, config: CommitMessageConfig): string {
00079|         const stats = this.analyzeDiff(diff);
00080| 
00081|         let projectContext = '';
00082|         try {
00083|             // 尝试获取简单的项目上下文（这里做轻量尝试，不阻塞）
00084|             const cwd = process.cwd();
00085|             const path = require('path');
00086|             const fs = require('fs');
00087|             const pkgPath = path.join(cwd, 'package.json');
00088|             if (fs.existsSync(pkgPath)) {
00089|                 const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
00090|                 projectContext = `
00091| ## 项目上下文
00092| - 项目名称: ${pkg.name || 'unknown'}
00093| - 项目描述: ${pkg.description || 'none'}
00094| `;
00095|             }
00096|         } catch (e) {
00097|             // 忽略读取错误
00098|         }
00099| 
00100|         let prompt = `你是一个专业的 Git commit message 生成助手。请根据以下代码变更生成符合规范的 commit message。
00101| ${projectContext}
00102| 
00103| ## 变更统计
00104| - 文件数: ${stats.files.size}
00105| - 新增行: ${stats.insertions}
00106| - 删除行: ${stats.deletions}
00107| 
00108| ## 代码变更
00109| \`\`\`diff
00110| ${diff.substring(0, 8000)} ${diff.length > 8000 ? '\n... (内容过长,已截断)' : ''}
00111| \`\`\`
00112| 
00113| ## 要求
00114| 1. 使用 Conventional Commits 规范
00115| 2. 格式: <type>(<scope>): <subject>
00116| 3. type 可选: feat, fix, docs, style, refactor, perf, test, chore
00117| 4. subject 使用中文,简洁明了(不超过50字)
00118| 5. ${config.detailed ? '需要包含详细的 body 说明,解释变更的原因和影响' : '只需要生成简洁的标题即可'}
00119| ${config.type ? `6. 必须使用 type: ${config.type}` : ''}
00120| ${config.scope ? `7. 必须使用 scope: ${config.scope}` : ''}
00121| 
00122| ## 输出格式
00123| 请直接输出 commit message,不要有任何额外解释。
00124| ${config.detailed ? '如果有 body,用空行分隔 subject 和 body。' : ''}`;
00125| 
00126|         return prompt;
00127|     }
00128| 
00129|     /**
00130|      * 使用 AI 生成 commit message
00131|      */
00132|     async generateWithAI(
00133|         diff: string,
00134|         config: CommitMessageConfig = {}
00135|     ): Promise<string> {
00136|         if (!this.router) {
00137|             throw new Error('ModelRouter not configured');
00138|         }
00139| 
00140|         const prompt = this.buildPrompt(diff, config);
00141| 
00142|         const taskConfig: TaskConfig = {
00143|             type: TaskType.CODE_GENERATION,
00144|             description: 'Generate git commit message',
00145|         };
00146| 
00147|         const routingConfig = {
00148|             strategy: 'auto' as any,
00149|         };
00150| 
00151|         const result = await this.router.route(taskConfig, routingConfig);
00152|         const execution = await this.router.executeTask(
00153|             result.adapter,
00154|             prompt,
00155|             taskConfig
00156|         );
00157| 
00158|         if (!execution.success || !execution.content) {
00159|             throw new Error('Failed to generate commit message');
00160|         }
00161| 
00162|         return execution.content.trim();
00163|     }
00164| 
00165|     /**
00166|      * 生成基于规则的 commit message (fallback)
00167|      */
00168|     private generateRuleBased(diff: string, config: CommitMessageConfig): string {
00169|         const stats = this.analyzeDiff(diff);
00170|         const files = Array.from(stats.files);
00171| 
00172|         // 智能推断 type
00173|         let type = config.type || 'chore';
00174|         if (files.some(f => f.includes('test'))) {
00175|             type = 'test';
00176|         } else if (files.some(f => f.match(/\.(md|txt)$/))) {
00177|             type = 'docs';
00178|         } else if (stats.insertions > stats.deletions * 2) {
00179|             type = 'feat';
00180|         } else if (stats.deletions > stats.insertions) {
00181|             type = 'refactor';
00182|         }
00183| 
00184|         // 智能推断 scope
00185|         const scope = config.scope || this.inferScope(files);
00186| 
00187|         // 生成 subject
00188|         const subject = this.generateSubject(files, stats);
00189| 
00190|         return `${type}${scope ? `(${scope})` : ''}: ${subject}`;
00191|     }
00192| 
00193|     /**
00194|      * 推断变更范围
00195|      */
00196|     private inferScope(files: string[]): string {
00197|         if (files.length === 0) return '';
00198| 
00199|         // 提取第一级目录作为 scope
00200|         const dirs = files
00201|             .map(f => f.split('/')[0])
00202|             .filter(d => d !== 'src' && d !== 'test');
00203| 
00204|         const uniqueDirs = [...new Set(dirs)];
00205|         if (uniqueDirs.length === 1) {
00206|             return uniqueDirs[0];
00207|         }
00208| 
00209|         return '';
00210|     }
00211| 
00212|     /**
00213|      * 生成 subject
00214|      */
00215|     private generateSubject(files: string[], stats: any): string {
00216|         if (files.length === 1) {
00217|             const fileName = files[0].split('/').pop()?.replace(/\.[^.]+$/, '');
00218|             return `更新 ${fileName}`;
00219|         }
00220| 
00221|         if (files.length <= 3) {
00222|             return `更新 ${files.map(f => f.split('/').pop()).join(', ')}`;
00223|         }
00224| 
00225|         return `更新 ${files.length} 个文件 (+${stats.insertions}/-${stats.deletions})`;
00226|     }
00227| 
00228|     /**
00229|      * 生成完整的 commit message
00230|      */
00231|     async generate(
00232|         config: CommitMessageConfig = {}
00233|     ): Promise<GeneratedCommitMessage> {
00234|         const { GitContextAggregator } = await import('./GitContextAggregator');
00235|         const aggregator = new GitContextAggregator(this.gitService);
00236|         const ctx = await aggregator.collect();
00237| 
00238|         // 使用统一的 Policy 校验
00239|         aggregator.ensureStaged(ctx);
00240| 
00241|         const diffContent = ctx.diff.staged || '';
00242|         const stats = this.analyzeDiff(diffContent);
00243| 
00244|         let message: string;
00245| 
00246|         try {
00247|             // 优先使用 AI 生成
00248|             if (this.router) {
00249|                 message = await this.generateWithAI(diffContent, config);
00250|             } else {
00251|                 message = this.generateRuleBased(diffContent, config);
00252|             }
00253|         } catch (error) {
00254|             console.warn('AI generation failed, falling back to rule-based:', error);
00255|             message = this.generateRuleBased(diffContent, config);
00256|         }
00257| 
00258|         // 分离 title 和 body
00259|         const parts = message.split('\n\n');
00260|         const title = parts[0];
00261|         const body = parts.slice(1).join('\n\n');
00262| 
00263|         return {
00264|             title,
00265|             body: body || undefined,
00266|             full: message,
00267|             summary: {
00268|                 filesChanged: stats.files.size,
00269|                 insertions: stats.insertions,
00270|                 deletions: stats.deletions,
00271|             },
00272|         };
00273|     }
00274| }
00275| 

(End of file - total 275 lines)
</file>
```
```

---

## Assistant (Sisyphus · glm-4.7 · 26.0s)

_Thinking:_

很好，现在我已经收集了足够的信息。让我检查一下探索任务的结果。

```
Tool: background_output

**Input:**
```json
{
  "task_id": "bg_7c6a03ca"
}
```
**Output:**
```
# Task Status

| Field | Value |
|-------|-------|
| Task ID | `bg_7c6a03ca` |
| Description | Explore project structure and architecture |
| Agent | explore |
| Status | **running** |
| Duration | 3m 4s |
| Session ID | `ses_3faea4dd4ffekU8qllclxV1A91` |


> **Note**: No need to wait explicitly - the system will notify you when this task completes.
## Original Prompt

```
Explore the project structure and identify the overall architecture. What type of project is this? What is the main purpose? List the key directories and their roles.
```
```
```

```
Tool: background_output

**Input:**
```json
{
  "task_id": "bg_1351af21"
}
```
**Output:**
```
# Task Status

| Field | Value |
|-------|-------|
| Task ID | `bg_1351af21` |
| Description | Find all git-related functionality |
| Agent | explore |
| Status | **running** |
| Duration | 2m 58s |
| Session ID | `ses_3faea3a00ffeIdnBcqTpQtmvEE` |


> **Note**: No need to wait explicitly - the system will notify you when this task completes.
## Original Prompt

```
Find ALL git-related functionality in this codebase. Search for:
- Files containing git operations (git commands, git APIs)
- Git-related dependencies in package.json or similar files
- Git hooks configuration files
- Git utilities or helper functions
- Files that interact with git in any way

Provide a comprehensive list of all git-related code and configuration.
```
```
```

```
Tool: background_output

**Input:**
```json
{
  "task_id": "bg_79774a55"
}
```
**Output:**
```
# Task Status

| Field | Value |
|-------|-------|
| Task ID | `bg_79774a55` |
| Description | Analyze git implementation patterns |
| Agent | explore |
| Status | **running** |
| Duration | 2m 48s |
| Session ID | `ses_3faea105fffey4XFkJad2PWwsm` |


> **Note**: No need to wait explicitly - the system will notify you when this task completes.
## Original Prompt

```
Analyze how git is actually used in the codebase. Look for:
- Git command execution patterns (e.g., exec('git ...'), child_process.spawn with git)
- Git library usage (e.g., simple-git, nodegit, isomorphic-git)
- Git state management and tracking
- Git operations implemented (commit, push, pull, clone, status, etc.)

Detail the implementation approach and patterns used.
```
```
```

---

## Assistant (Sisyphus · glm-4.7 · 6.9s)

_Thinking:_

探索任务还在运行。让我再读取一些其他相关的核心文件，然后可以开始撰写分析报告了。我已经收集了足够的信息来进行分析。

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/ygs/npm_yuangs/src/core/git/CodeGenerator.ts"
}
```
**Output:**
```
<file>
00001| import fs from 'fs';
00002| import path from 'path';
00003| import chalk from 'chalk';
00004| import crypto from 'crypto';
00005| 
00006| /**
00007|  * 代码生成结果
00008|  */
00009| export interface GeneratedCode {
00010|     files: Array<{
00011|         path: string;
00012|         content: string;
00013|         action: 'create' | 'modify';
00014|     }>;
00015|     rawOutput: string;
00016| }
00017| 
00018| /**
00019|  * 备份信息
00020|  */
00021| export interface BackupInfo {
00022|     id: string;
00023|     timestamp: string;
00024|     files: string[];
00025| }
00026| 
00027| /**
00028|  * 从 LLM 输出中解析文件路径和代码
00029|  */
00030| export function parseGeneratedCode(llmOutput: string): GeneratedCode {
00031|     const files: GeneratedCode['files'] = [];
00032|     
00033|     // 尝试多种格式解析
00034|     
00035|     // 格式 1: ```filepath\n路径\n```\n```code\n代码\n```
00036|     const pattern1 = /```filepath\s*\n(.*?)\n```\s*\n```(?:typescript|javascript|ts|js|code)?\s*\n([\s\S]*?)\n```/gi;
00037|     let match;
00038|     
00039|     while ((match = pattern1.exec(llmOutput)) !== null) {
00040|         files.push({
00041|             path: match[1].trim(),
00042|             content: match[2].trim(),
00043|             action: 'create'
00044|         });
00045|     }
00046|     
00047|     // 格式 2: ### 文件: path/to/file.ts\n```typescript\n代码\n```
00048|     const pattern2 = /###?\s*(?:文件|File)[：:]\s*([^\n]+)\s*\n```(?:typescript|javascript|ts|js|code)?\s*\n([\s\S]*?)\n```/gi;
00049|     
00050|     while ((match = pattern2.exec(llmOutput)) !== null) {
00051|         const filePath = match[1].trim().replace(/`/g, '');
00052|         if (!files.some(f => f.path === filePath)) {
00053|             files.push({
00054|                 path: filePath,
00055|                 content: match[2].trim(),
00056|                 action: 'create'
00057|             });
00058|         }
00059|     }
00060|     
00061|     // 格式 3: **path/to/file.ts**\n```typescript\n代码\n```
00062|     const pattern3 = /\*\*([^*]+\.(?:ts|js|tsx|jsx|json|md|html))\*\*\s*\n```(?:typescript|javascript|ts|js|json|markdown|code|html)?\s*\n([\s\S]*?)\n```/gi;
00063| 
00064|     while ((match = pattern3.exec(llmOutput)) !== null) {
00065|         const filePath = match[1].trim();
00066|         if (!files.some(f => f.path === filePath)) {
00067|             files.push({
00068|                 path: filePath,
00069|                 content: match[2].trim(),
00070|                 action: 'create'
00071|             });
00072|         }
00073|     }
00074| 
00075|     // 格式 4: ## 📄 文件：`filename.ext`\n```code\n代码\n```
00076|     const pattern4 = /##\s*[^\n]*文件[：:]\s*`([^`]+)`\s*\n```(?:code|html|typescript|javascript)?\s*\n([\s\S]*?)\n```/gi;
00077| 
00078|     while ((match = pattern4.exec(llmOutput)) !== null) {
00079|         const filePath = match[1].trim();
00080|         if (!files.some(f => f.path === filePath)) {
00081|             files.push({
00082|                 path: filePath,
00083|                 content: match[2].trim(),
00084|                 action: 'create'
00085|             });
00086|         }
00087|     }
00088| 
00089|     // 格式 5: ### 📄 文件：`filename.ext`\n```html\n代码\n```
00090|     const pattern5 = /###.*文件.*\`([^`]+)\`.*\n\`\`\`.*\n\`\`\`/gis;
00091| 
00092|     while ((match = pattern5.exec(llmOutput)) !== null) {
00093|         const filePath = match[1].trim();
00094|         if (!files.some(f => f.path === filePath)) {
00095|             // 提取代码内容：从第一个 ``` 到第二个 ```
00096|             const parts = match[0].split('\`\`\`\n');
00097|             if (parts.length >= 3) {
00098|                 const contentParts = parts[2].split('\n\`\`\`');
00099|                 const content = contentParts[0].trim();
00100|                 files.push({
00101|                     path: filePath,
00102|                     content: content,
00103|                     action: 'create'
00104|                 });
00105|             }
00106|         }
00107|     }
00108| 
00109|     // 格式 6: ## 📄 文件：`filename.ext`\n说明\n```html\n代码\n```（支持多行说明）
00110|     const pattern6 = /##\s*[^\n]*文件[：:]\s*\`([^`]+)\`[\s\S]*?\n\`\`\`(?:html|code|typescript|javascript|css|json)?\s*\n([\s\S]+?)\n\`\`\`/gis;
00111| 
00112|     while ((match = pattern6.exec(llmOutput)) !== null) {
00113|         const filePath = match[1].trim();
00114|         if (!files.some(f => f.path === filePath)) {
00115|             files.push({
00116|                 path: filePath,
00117|                 content: match[2].trim(),
00118|                 action: 'create'
00119|             });
00120|         }
00121|     }
00122| 
00123|     return {
00124|         files,
00125|         rawOutput: llmOutput
00126|     };
00127| }
00128| 
00129| /**
00130|  * 将生成的代码写入文件系统
00131|  */
00132| export async function writeGeneratedCode(
00133|     generated: GeneratedCode,
00134|     baseDir: string = process.cwd()
00135| ): Promise<{ written: string[]; skipped: string[] }> {
00136|     const written: string[] = [];
00137|     const skipped: string[] = [];
00138|     
00139|     for (const file of generated.files) {
00140|         try {
00141|             const fullPath = path.isAbsolute(file.path) 
00142|                 ? file.path 
00143|                 : path.join(baseDir, file.path);
00144|             
00145|             // 确保目录存在
00146|             const dir = path.dirname(fullPath);
00147|             await fs.promises.mkdir(dir, { recursive: true });
00148|             
00149|             // 写入文件
00150|             await fs.promises.writeFile(fullPath, file.content, 'utf8');
00151|             written.push(file.path);
00152|             
00153|             console.log(chalk.green(`  ✓ ${file.action === 'create' ? '创建' : '修改'}: ${file.path}`));
00154|         } catch (e: unknown) {
00155|             const errorMsg = e instanceof Error ? e.message : '未知错误';
00156|             console.warn(chalk.yellow(`  ⚠ 跳过 ${file.path}: ${errorMsg}`));
00157|             skipped.push(file.path);
00158|         }
00159|     }
00160|     
00161|     return { written, skipped };
00162| }
00163| 
00164| /**
00165|  * 保存原始输出到临时文件
00166|  */
00167| export async function saveRawOutput(
00168|     content: string,
00169|     taskIndex: number,
00170|     baseDir: string = process.cwd()
00171| ): Promise<string> {
00172|     const outputDir = path.join(baseDir, '.yuangs', 'generated');
00173|     await fs.promises.mkdir(outputDir, { recursive: true });
00174|     
00175|     const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
00176|     const filename = `task-${taskIndex + 1}-${timestamp}.md`;
00177|     const filepath = path.join(outputDir, filename);
00178|     
00179|     await fs.promises.writeFile(filepath, content, 'utf8');
00180|     
00181|     return filepath;
00182| }
00183| 
00184| /**
00185|  * 备份受影响的文件（在写入前）
00186|  */
00187| export async function backupFiles(
00188|     files: Array<{ path: string; content: string }>,
00189|     baseDir: string = process.cwd()
00190| ): Promise<BackupInfo> {
00191|     const backupId = crypto.randomBytes(8).toString('hex');
00192|     const backupDir = path.join(baseDir, '.yuangs', 'backups', backupId);
00193|     const manifest: string[] = [];
00194|     
00195|     await fs.promises.mkdir(backupDir, { recursive: true });
00196|     
00197|     for (const file of files) {
00198|         const fullPath = path.isAbsolute(file.path) 
00199|             ? file.path 
00200|             : path.join(baseDir, file.path);
00201|         
00202|         if (fs.existsSync(fullPath)) {
00203|             const backupFile = path.join(backupDir, path.relative(baseDir, fullPath));
00204|             const backupDirPath = path.dirname(backupFile);
00205|             
00206|             await fs.promises.mkdir(backupDirPath, { recursive: true });
00207|             await fs.promises.copyFile(fullPath, backupFile);
00208|             manifest.push(file.path);
00209|         }
00210|     }
00211|     
00212|     const info: BackupInfo = {
00213|         id: backupId,
00214|         timestamp: new Date().toISOString(),
00215|         files: manifest
00216|     };
00217|     
00218|     const manifestPath = path.join(backupDir, 'manifest.json');
00219|     await fs.promises.writeFile(manifestPath, JSON.stringify(info, null, 2), 'utf8');
00220|     
00221|     return info;
00222| }
00223| 
00224| /**
00225|  * 从备份恢复文件
00226|  */
00227| export async function restoreFromBackup(
00228|     backupId: string,
00229|     baseDir: string = process.cwd()
00230| ): Promise<void> {
00231|     const backupDir = path.join(baseDir, '.yuangs', 'backups', backupId);
00232|     const manifestPath = path.join(backupDir, 'manifest.json');
00233|     
00234|     if (!fs.existsSync(manifestPath)) {
00235|         throw new Error(`Backup ${backupId} not found`);
00236|     }
00237|     
00238|     const manifest = JSON.parse(await fs.promises.readFile(manifestPath, 'utf8')) as BackupInfo;
00239|     
00240|     for (const filePath of manifest.files) {
00241|         const backupFile = path.join(backupDir, filePath);
00242|         const originalPath = path.isAbsolute(filePath) 
00243|             ? filePath 
00244|             : path.join(baseDir, filePath);
00245|         
00246|         if (fs.existsSync(backupFile)) {
00247|             await fs.promises.copyFile(backupFile, originalPath);
00248|         }
00249|     }
00250| }
00251| 
00252| /**
00253|  * 清理旧备份
00254|  */
00255| export async function cleanOldBackups(
00256|     keepCount: number = 5,
00257|     baseDir: string = process.cwd()
00258| ): Promise<void> {
00259|     const backupsDir = path.join(baseDir, '.yuangs', 'backups');
00260|     
00261|     if (!fs.existsSync(backupsDir)) {
00262|         return;
00263|     }
00264|     
00265|     const entries = await fs.promises.readdir(backupsDir, { withFileTypes: true });
00266|     const backups = entries
00267|         .filter(entry => entry.isDirectory())
00268|         .map(async entry => {
00269|             const manifestPath = path.join(backupsDir, entry.name, 'manifest.json');
00270|             const manifest = JSON.parse(
00271|                 await fs.promises.readFile(manifestPath, 'utf8')
00272|             ) as BackupInfo;
00273|             return { id: entry.name, timestamp: manifest.timestamp };
00274|         });
00275|     
00276|     const backupInfos = await Promise.all(backups);
00277|     backupInfos.sort((a, b) => 
00278|         new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
00279|     );
00280|     
00281|     const toDelete = backupInfos.slice(0, -keepCount);
00282|     for (const backup of toDelete) {
00283|         const backupPath = path.join(backupsDir, backup.id);
00284|         await fs.promises.rm(backupPath, { recursive: true, force: true });
00285|     }
00286| }
00287| 

(End of file - total 287 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/ygs/npm_yuangs/src/core/git/BranchAdvisor.ts"
}
```
**Output:**
```
<file>
00001| import { GitService } from './GitService';
00002| import { ModelRouter } from '../modelRouter/ModelRouter';
00003| import { TaskConfig, TaskType } from '../modelRouter/types';
00004| 
00005| /**
00006|  * 分支建议上下文
00007|  */
00008| export interface BranchSuggestContext {
00009|     currentBranch: string;
00010|     workingTree: {
00011|         modified: number;
00012|         added: number;
00013|         deleted: number;
00014|         untracked: number;
00015|         isClean: boolean;
00016|     };
00017|     stagedFiles: string[];
00018|     unstagedFiles: string[];
00019|     recentCommits: Array<{
00020|         message: string;
00021|         date: string;
00022|     }>;
00023|     branchList: string[]; // 简化版，只传名字，避免 token 过多
00024| }
00025| 
00026| /**
00027|  * 分支建议结果
00028|  */
00029| export interface BranchSuggestion {
00030|     action: 'stay' | 'switch' | 'create';
00031|     reason: string;
00032|     targetBranch?: string; // for switch
00033|     newBranch?: {          // for create
00034|         name: string;
00035|         from: string;
00036|         type: 'feature' | 'fix' | 'chore' | 'docs' | 'refactor' | 'test';
00037|     };
00038|     confidence: number; // 0-1
00039| }
00040| 
00041| /**
00042|  * AI 分支顾问
00043|  * - 该模块目前仅提供建议 (Advisory)，不执行任何 Git 写操作。
00044|  */
00045| export class BranchAdvisor {
00046|     public static readonly VERSION = 'v1.0';
00047| 
00048|     constructor(
00049|         private gitService: GitService,
00050|         private router: ModelRouter
00051|     ) { }
00052| 
00053|     /**
00054|      * 获取分支建议
00055|      */
00056|     async suggest(): Promise<BranchSuggestion> {
00057|         const context = await this.collectContext();
00058|         const prompt = this.buildPrompt(context);
00059| 
00060|         const taskConfig: TaskConfig = {
00061|             type: TaskType.ANALYSIS,
00062|             description: 'Analyze git context for branch suggestion',
00063|         };
00064| 
00065|         // 优先使用 smart 模型进行决策
00066|         const routingConfig = {
00067|             strategy: 'auto' as any,
00068|         };
00069| 
00070|         const result = await this.router.route(taskConfig, routingConfig);
00071|         const execution = await this.router.executeTask(
00072|             result.adapter,
00073|             prompt,
00074|             taskConfig
00075|         );
00076| 
00077|         return this.parseResponse(execution.content || '{}');
00078|     }
00079| 
00080|     private async collectContext(): Promise<BranchSuggestContext> {
00081|         const { GitContextAggregator } = await import('./GitContextAggregator');
00082|         const aggregator = new GitContextAggregator(this.gitService);
00083|         const ctx = await aggregator.collect();
00084| 
00085|         return {
00086|             currentBranch: ctx.branches.current,
00087|             workingTree: {
00088|                 modified: ctx.status.modified,
00089|                 added: ctx.status.added,
00090|                 deleted: ctx.status.deleted,
00091|                 untracked: ctx.status.untracked,
00092|                 isClean: ctx.status.modified === 0 && ctx.status.added === 0 && ctx.status.deleted === 0 && ctx.status.untracked === 0
00093|             },
00094|             stagedFiles: ctx.diff.files.staged,
00095|             unstagedFiles: ctx.diff.files.unstaged,
00096|             recentCommits: ctx.recentCommits.map(c => ({
00097|                 message: c.message,
00098|                 date: c.date
00099|             })),
00100|             branchList: ctx.branches.all.slice(0, 20)
00101|         };
00102|     }
00103| 
00104|     private buildPrompt(ctx: BranchSuggestContext): string {
00105|         return `你是一位资深的软件工程专家，擅长 Git 工作流管理。
00106| 请根据以下 Git 仓库的当前状态，分析并给出**最合理的分支操作建议**。
00107| 
00108| ## 决策选项 (三选一)
00109| 1. **stay**:   当前工作区变更与当前分支主题一致，建议继续在此分支开发。
00110| 2. **switch**: 当前变更明显属于另一个已有分支的任务范围，建议切换。
00111| 3. **create**: 当前变更代表一个新的独立功能或修复，且当前分支不适合直接提交（如 main 分支），建议新建。
00112| 
00113| ---
00114| 
00115| ## 当前上下文
00116| 
00117| ### 1. 当前位置
00118| - 分支: ${ctx.currentBranch}
00119| 
00120| ### 2. 工作区状态
00121| - Clean: ${ctx.workingTree.isClean}
00122| - 统计: +${ctx.workingTree.added} / ~${ctx.workingTree.modified} / -${ctx.workingTree.deleted} / ?${ctx.workingTree.untracked}
00123| 
00124| ### 3. 具体变更文件
00125| **已暂存 (Staged):**
00126| ${ctx.stagedFiles.join('\n') || '(none)'}
00127| 
00128| **未暂存 (Unstaged):**
00129| ${ctx.unstagedFiles.join('\n') || '(none)'}
00130| 
00131| ### 4. 最近提交历史
00132| ${ctx.recentCommits.map(c => `- ${c.date.split(' ')[0]}: ${c.message}`).join('\n')}
00133| 
00134| ### 5. 已有分支列表 (部分)
00135| ${ctx.branchList.join(', ')}
00136| 
00137| ---
00138| 
00139| ## 判断原则 (Priority High -> Low)
00140| 1. **主分支保护**: 如果当前在 protected 分支 (main/master/develop) 且有 feature/fix 级变更 -> **必须建议 create**。
00141| 2. **主题一致性**: 如果变更文件与当前分支名强相关 (e.g. 分支叫 fix-auth, 变更为 auth.ts) -> **建议 stay**。
00142| 3. **混合变更风险**: 如果暂存区混合了多个不相关的改动 -> **建议 create** (提示拆分)。
00143| 4. **已有分支匹配**: 如果变更内容明显对应某个已有分支 -> **建议 switch**。
00144| 
00145| ---
00146| 
00147| ## 输出格式 (Strict JSON)
00148| 只输出 JSON，不要 Markdown 代码块，不要额外文字。
00149| 
00150| 示例:
00151| {
00152|   "action": "create",
00153|   "reason": "当前在 main 分支进行了功能开发，且变更涉及 git 核心模块，建议创建独立 feature 分支。",
00154|   "newBranch": {
00155|     "name": "feature/git-core-enhancement",
00156|     "from": "main",
00157|     "type": "feature"
00158|   },
00159|   "confidence": 0.95
00160| }
00161| `;
00162|     }
00163| 
00164|     private isValidSuggestion(x: any): x is BranchSuggestion {
00165|         if (!x || typeof x !== 'object') return false;
00166|         if (!['stay', 'switch', 'create'].includes(x.action)) return false;
00167|         if (typeof x.reason !== 'string') return false;
00168|         if (typeof x.confidence !== 'number') return false;
00169| 
00170|         if (x.action === 'create') {
00171|             return !!(x.newBranch && typeof x.newBranch.name === 'string');
00172|         }
00173| 
00174|         if (x.action === 'switch') {
00175|             return typeof x.targetBranch === 'string';
00176|         }
00177| 
00178|         return true;
00179|     }
00180| 
00181|     private parseResponse(content: string): BranchSuggestion {
00182|         try {
00183|             // 尝试清理 markdown 标记
00184|             const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
00185|             const parsed = JSON.parse(clean);
00186| 
00187|             if (!this.isValidSuggestion(parsed)) {
00188|                 console.warn('AI response failed validation:', parsed);
00189|                 return { action: 'stay', reason: 'AI 建议格式不合法，已自动回退', confidence: 0 };
00190|             }
00191| 
00192|             // 语义校验 (Schema Guard)
00193|             let action = parsed.action;
00194|             let reason = parsed.reason;
00195|             let confidence = parsed.confidence;
00196| 
00197|             if (action === 'create') {
00198|                 if (!parsed.newBranch || !parsed.newBranch.name) {
00199|                     console.warn('AI suggested create but missing branch name, falling back to stay');
00200|                     action = 'stay';
00201|                     reason = 'AI 建议创建分支但未提供名称，建议重新评估或手动操作';
00202|                     confidence = 0;
00203|                 }
00204|             }
00205| 
00206|             if (action === 'switch') {
00207|                 if (!parsed.targetBranch) {
00208|                     console.warn('AI suggested switch but missing target branch, falling back to stay');
00209|                     action = 'stay';
00210|                     reason = 'AI 建议切换分支但未提供目标，建议重新评估';
00211|                     confidence = 0;
00212|                 }
00213|             }
00214| 
00215|             return {
00216|                 action,
00217|                 reason,
00218|                 targetBranch: parsed.targetBranch,
00219|                 newBranch: parsed.newBranch,
00220|                 confidence
00221|             };
00222|         } catch (e) {
00223|             console.warn('Failed to parse AI suggestion:', e);
00224|             // Fallback
00225|             return {
00226|                 action: 'stay',
00227|                 reason: '无法解析 AI 建议，保持当前状态最安全',
00228|                 confidence: 0
00229|             };
00230|         }
00231|     }
00232| }
00233| 

(End of file - total 233 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/ygs/npm_yuangs/src/core/git/TodoManager.ts"
}
```
**Output:**
```
<file>
00001| import fs from 'fs';
00002| import path from 'path';
00003| 
00004| export interface TaskStatus {
00005|     index: number;
00006|     description: string;
00007|     completed: boolean;
00008|     execStatus?: 'pending' | 'in_progress' | 'done' | 'failed';
00009|     reviewScore?: number;
00010|     reviewIssues?: string[];
00011|     attempts?: number;
00012|     backupId?: string;
00013|     dependsOn?: number[];
00014|     priority?: 'high' | 'medium' | 'low';
00015| }
00016| 
00017| export interface TodoMetadata {
00018|     generatedAt?: string;
00019|     context?: string;
00020|     progress?: { completed: number; total: number };
00021|     currentTask?: number;
00022| }
00023| 
00024| const METADATA_PREFIX = '>';
00025| const TASK_REGEX = /^[\s]*-\s*\[([x\s])\]\s*(.+?)(?:\s*<!--\s*(.+?)\s*-->)?$/;
00026| const DEPENDENCY_REGEX = /\[depends:\s*(.+?)\]/i;
00027| const PRIORITY_REGEX = /\[priority:\s*(high|medium|low)\]/i;
00028| 
00029| /**
00030|  * 解析 todo.md 文件
00031|  */
00032| export async function parseTodoFile(filePath: string): Promise<{
00033|     metadata: TodoMetadata;
00034|     tasks: TaskStatus[];
00035|     rawContent: string;
00036| }> {
00037|     const content = await fs.promises.readFile(filePath, 'utf8');
00038|     const lines = content.split('\n');
00039|     
00040|     // 解析元数据
00041|     const metadata: TodoMetadata = {};
00042|     let contentStartIndex = 0;
00043|     
00044|     for (let i = 0; i < lines.length; i++) {
00045|         const line = lines[i].trim();
00046|         if (!line.startsWith(METADATA_PREFIX)) {
00047|             contentStartIndex = i;
00048|             break;
00049|         }
00050|         
00051|         // 解析特定元数据
00052|         if (line.includes('Generated by Yuangs Git Plan at')) {
00053|             const match = line.match(/at (.+)$/);
00054|             if (match) {
00055|                 metadata.generatedAt = match[1].trim();
00056|             }
00057|         } else if (line.includes('Context:')) {
00058|             metadata.context = line.split('Context:')[1]?.trim();
00059|         } else if (line.includes('Progress:')) {
00060|             const match = line.match(/(\d+)\/(\d+)/);
00061|             if (match) {
00062|                 metadata.progress = {
00063|                     completed: parseInt(match[1]),
00064|                     total: parseInt(match[2])
00065|                 };
00066|             }
00067|         } else if (line.includes('Current Task:')) {
00068|             metadata.currentTask = parseInt(line.split('Current Task:')[1]?.trim() || '0');
00069|         }
00070|     }
00071|     
00072|     // 解析任务
00073|     const tasks: TaskStatus[] = [];
00074|     const mainContent = lines.slice(contentStartIndex).join('\n');
00075|     
00076|     let taskIndex = 0;
00077|     for (const line of lines.slice(contentStartIndex)) {
00078|         const match = line.match(TASK_REGEX);
00079|         if (match) {
00080|             const [, checkbox, description, comment] = match;
00081|             const task: TaskStatus = {
00082|                 index: taskIndex++,
00083|                 description: description.trim(),
00084|                 completed: checkbox.toLowerCase() === 'x',
00085|                 attempts: 0
00086|             };
00087|             
00088|             // 解析描述中的依赖关系
00089|             const depMatch = description.match(DEPENDENCY_REGEX);
00090|             if (depMatch) {
00091|                 const depIndices = depMatch[1].split(',')
00092|                     .map(s => parseInt(s.trim()) - 1)
00093|                     .filter(n => !isNaN(n) && n >= 0);
00094|                 if (depIndices.length > 0) {
00095|                     task.dependsOn = depIndices;
00096|                 }
00097|             }
00098|             
00099|             // 解析描述中的优先级
00100|             const priorityMatch = description.match(PRIORITY_REGEX);
00101|             if (priorityMatch) {
00102|                 task.priority = priorityMatch[1] as 'high' | 'medium' | 'low';
00103|             }
00104|             
00105|             // 解析注释中的状态
00106|             if (comment) {
00107|                 const execMatch = comment.match(/exec:(\w+)/);
00108|                 const reviewMatch = comment.match(/review:(\d+)/);
00109|                 const attemptsMatch = comment.match(/attempts:(\d+)/);
00110|                 const backupMatch = comment.match(/backup:([a-f0-9]+)/);
00111|                 
00112|                 if (execMatch) task.execStatus = execMatch[1] as any;
00113|                 if (reviewMatch) task.reviewScore = parseInt(reviewMatch[1]);
00114|                 if (attemptsMatch) task.attempts = parseInt(attemptsMatch[1]);
00115|                 if (backupMatch) task.backupId = backupMatch[1];
00116|             }
00117|             
00118|             tasks.push(task);
00119|         }
00120|     }
00121|     
00122|     return { metadata, tasks, rawContent: content };
00123| }
00124| 
00125| /**
00126|  * 更新任务状态
00127|  */
00128| export async function updateTaskStatus(
00129|     filePath: string,
00130|     taskIndex: number,
00131|     updates: Partial<TaskStatus>
00132| ): Promise<void> {
00133|     const content = await fs.promises.readFile(filePath, 'utf8');
00134|     const lines = content.split('\n');
00135|     
00136|     let currentTaskIndex = 0;
00137|     for (let i = 0; i < lines.length; i++) {
00138|         const match = lines[i].match(TASK_REGEX);
00139|         if (match && currentTaskIndex === taskIndex) {
00140|             const [, checkbox, description] = match;
00141|             
00142|             // 构建新的注释
00143|             const comments: string[] = [];
00144|             if (updates.execStatus) comments.push(`exec:${updates.execStatus}`);
00145|             if (updates.reviewScore !== undefined) comments.push(`review:${updates.reviewScore}`);
00146|             if (updates.attempts !== undefined) comments.push(`attempts:${updates.attempts}`);
00147|             
00148|             const newCheckbox = updates.completed ? 'x' : ' ';
00149|             const commentStr = comments.length > 0 ? ` <!-- ${comments.join(', ')} -->` : '';
00150|             
00151|             lines[i] = `- [${newCheckbox}] ${description}${commentStr}`;
00152|             break;
00153|         }
00154|         if (match) currentTaskIndex++;
00155|     }
00156|     
00157|     await fs.promises.writeFile(filePath, lines.join('\n'), 'utf8');
00158| }
00159| 
00160| /**
00161|  * 更新元数据
00162|  */
00163| export async function updateMetadata(
00164|     filePath: string,
00165|     updates: Partial<TodoMetadata>
00166| ): Promise<void> {
00167|     const content = await fs.promises.readFile(filePath, 'utf8');
00168|     const lines = content.split('\n');
00169|     
00170|     // 找到元数据结束位置
00171|     let metadataEndIndex = 0;
00172|     for (let i = 0; i < lines.length; i++) {
00173|         if (!lines[i].trim().startsWith(METADATA_PREFIX)) {
00174|             metadataEndIndex = i;
00175|             break;
00176|         }
00177|     }
00178|     
00179|     // 更新或添加进度信息
00180|     if (updates.progress) {
00181|         let progressLineIndex = -1;
00182|         for (let i = 0; i < metadataEndIndex; i++) {
00183|             if (lines[i].includes('Progress:')) {
00184|                 progressLineIndex = i;
00185|                 break;
00186|             }
00187|         }
00188|         
00189|         const progressLine = `> 📊 Progress: ${updates.progress.completed}/${updates.progress.total} tasks completed`;
00190|         if (progressLineIndex >= 0) {
00191|             lines[progressLineIndex] = progressLine;
00192|         } else {
00193|             lines.splice(metadataEndIndex, 0, progressLine);
00194|         }
00195|     }
00196|     
00197|     if (updates.currentTask !== undefined) {
00198|         let currentTaskLineIndex = -1;
00199|         for (let i = 0; i < metadataEndIndex; i++) {
00200|             if (lines[i].includes('Current Task:')) {
00201|                 currentTaskLineIndex = i;
00202|                 break;
00203|             }
00204|         }
00205|         
00206|         const currentTaskLine = `> 🔄 Current Task: ${updates.currentTask}`;
00207|         if (currentTaskLineIndex >= 0) {
00208|             lines[currentTaskLineIndex] = currentTaskLine;
00209|         } else {
00210|             lines.splice(metadataEndIndex, 0, currentTaskLine);
00211|         }
00212|     }
00213|     
00214|     await fs.promises.writeFile(filePath, lines.join('\n'), 'utf8');
00215| }
00216| 
00217| /**
00218|  * 获取下一个待执行的任务（考虑依赖关系）
00219|  */
00220| export function getNextTask(tasks: TaskStatus[]): TaskStatus | null {
00221|     const pendingTasks = tasks.filter(t => !t.completed && t.execStatus !== 'failed');
00222|     
00223|     if (pendingTasks.length === 0) {
00224|         return null;
00225|     }
00226|     
00227|     // 检查哪些任务可以执行（所有依赖都已完成）
00228|     const availableTasks = pendingTasks.filter(task => {
00229|         if (!task.dependsOn || task.dependsOn.length === 0) {
00230|             return true;
00231|         }
00232|         
00233|         return task.dependsOn.every(depIndex => {
00234|             const depTask = tasks[depIndex];
00235|             return depTask && depTask.completed;
00236|         });
00237|     });
00238|     
00239|     if (availableTasks.length === 0) {
00240|         // 如果没有可执行的任务，返回第一个失败的任务（如果有）
00241|         const firstFailed = tasks.find(t => t.execStatus === 'failed');
00242|         return firstFailed || null;
00243|     }
00244|     
00245|     // 按优先级排序：high > medium > low
00246|     const priorityOrder = { high: 0, medium: 1, low: 2 };
00247|     availableTasks.sort((a, b) => {
00248|         const priorityA = a.priority ? priorityOrder[a.priority] : 1;
00249|         const priorityB = b.priority ? priorityOrder[b.priority] : 1;
00250|         return priorityA - priorityB;
00251|     });
00252|     
00253|     // 返回优先级最高的可执行任务
00254|     return availableTasks[0];
00255| }
00256| 
00257| /**
00258|  * 验证任务的依赖关系
00259|  */
00260| export function validateDependencies(tasks: TaskStatus[]): { valid: boolean; errors: string[] } {
00261|     const errors: string[] = [];
00262|     
00263|     for (const task of tasks) {
00264|         if (task.dependsOn && task.dependsOn.length > 0) {
00265|             for (const depIndex of task.dependsOn) {
00266|                 // 检查依赖索引是否有效
00267|                 if (depIndex < 0 || depIndex >= tasks.length) {
00268|                     errors.push(`任务 #${task.index + 1} 依赖了无效的任务索引: ${depIndex + 1}`);
00269|                     continue;
00270|                 }
00271|                 
00272|                 // 检查循环依赖
00273|                 if (hasCircularDependency(tasks, task.index, depIndex, new Set())) {
00274|                     errors.push(`检测到循环依赖: 任务 #${task.index + 1} <-> #${depIndex + 1}`);
00275|                 }
00276|                 
00277|                 // 检查自依赖
00278|                 if (depIndex === task.index) {
00279|                     errors.push(`任务 #${task.index + 1} 不能依赖自己`);
00280|                 }
00281|             }
00282|         }
00283|     }
00284|     
00285|     return { valid: errors.length === 0, errors };
00286| }
00287| 
00288| /**
00289|  * 检查循环依赖
00290|  */
00291| function hasCircularDependency(
00292|     tasks: TaskStatus[],
00293|     from: number,
00294|     to: number,
00295|     visited: Set<number>
00296| ): boolean {
00297|     if (visited.has(to)) {
00298|         return true;
00299|     }
00300|     
00301|     visited.add(to);
00302|     const toTask = tasks[to];
00303|     
00304|     if (!toTask || !toTask.dependsOn) {
00305|         return false;
00306|     }
00307|     
00308|     for (const dep of toTask.dependsOn) {
00309|         if (dep === from || hasCircularDependency(tasks, from, dep, new Set(visited))) {
00310|             return true;
00311|         }
00312|     }
00313|     
00314|     return false;
00315| }
00316| 
00317| /**
00318|  * 获取任务的执行顺序
00319|  */
00320| export function getExecutionOrder(tasks: TaskStatus[]): number[] {
00321|     const order: number[] = [];
00322|     const visited = new Set<number>();
00323|     
00324|     function visit(index: number) {
00325|         if (visited.has(index)) {
00326|             return;
00327|         }
00328|         
00329|         visited.add(index);
00330|         const task = tasks[index];
00331|         
00332|         // 先访问依赖的任务
00333|         if (task.dependsOn) {
00334|             for (const depIndex of task.dependsOn) {
00335|                 visit(depIndex);
00336|             }
00337|         }
00338|         
00339|         order.push(index);
00340|     }
00341|     
00342|     for (let i = 0; i < tasks.length; i++) {
00343|         visit(i);
00344|     }
00345|     
00346|     return order;
00347| }
00348| 
00349| /**
00350|  * 计算进度
00351|  */
00352| export function calculateProgress(tasks: TaskStatus[]): { completed: number; total: number } {
00353|     return {
00354|         completed: tasks.filter(t => t.completed).length,
00355|         total: tasks.length
00356|     };
00357| }
00358| 

(End of file - total 358 lines)
</file>
```
```

---

## Assistant (Sisyphus · glm-4.7 · 20.2s)

_Thinking:_

非常好！现在我已经收集了足够的信息。让我取消后台任务，然后开始撰写全面的分析报告。

```
Tool: background_cancel

**Input:**
```json
{
  "all": true
}
```
**Output:**
```
Cancelled 3 background task(s):

| Task ID | Description | Status | Session ID |
|---------|-------------|--------|------------|
| `bg_7c6a03ca` | Explore project structure and architecture | running | `ses_3faea4dd4ffekU8qllclxV1A91` |
| `bg_1351af21` | Find all git-related functionality | running | `ses_3faea3a00ffeIdnBcqTpQtmvEE` |
| `bg_79774a55` | Analyze git implementation patterns | running | `ses_3faea105fffey4XFkJad2PWwsm` |

## Continue Instructions

To continue a cancelled task, use:
```
delegate_task(session_id="<session_id>", prompt="Continue: <your follow-up>")
```

Continuable sessions:
- `ses_3faea4dd4ffekU8qllclxV1A91` (Explore project structure and architecture)
- `ses_3faea3a00ffeIdnBcqTpQtmvEE` (Find all git-related functionality)
- `ses_3faea105fffey4XFkJad2PWwsm` (Analyze git implementation patterns)
```
```

---

## Assistant (Sisyphus · glm-4.7 · 163.1s)

_Thinking:_

好的，现在我已经收集了足够的信息来撰写全面的分析报告。让我组织一下我收集到的信息：

## 项目概览
- 项目名称: yuangs
- 类型: AI-Augmented CLI工具
- 核心理念: AI提供思路，人类掌控执行

## Git相关功能架构

### 1. 命令层 (src/commands/git/)
- commit.ts - 智能commit message生成
- review.ts - AI代码审查
- status.ts - 增强的Git状态显示
- branch.ts - 分支管理 + AI建议
- plan.ts - AI驱动的开发规划
- exec.ts - 执行todo任务
- auto.ts - 全自动工作流

### 2. 核心服务层 (src/core/git/)
- GitService.ts - Git操作封装
- CodeReviewer.ts - 代码审查引擎
- CommitMessageGenerator.ts - Commit消息生成
- BranchAdvisor.ts - 分支建议
- TodoManager.ts - 任务管理
- CodeGenerator.ts - 代码生成和备份
- ProgressManager.ts - 进度管理
- ContextGatherer.ts - 上下文收集

### 3. 共享模块
- constants.ts - 配置常量
- utils.ts - 工具函数
- errors.ts - 错误类型

让我开始撰写详细的分析报告。

# Yuangs CLI Git功能深度分析报告

## 一、项目概览

**项目定位**: Yuangs是一个AI增强的CLI工具，核心理念是"AI提供思路，人类掌控执行"。它不是一个黑盒执行器，而是一个可编程的Agent运行时基础设施。

**架构特点**:
- 分层架构：命令层 → 核心服务层 → 共享模块
- AI增强：所有Git操作都可以通过AI辅助
- 人类在环：所有重要操作都需要人工确认

---

## 二、Git功能架构原理

### 2.1 整体架构

```
用户命令 (CLI)
    ↓
命令路由层 (src/commands/git/)
    ↓
核心服务层 (src/core/git/)
    ↓
Git原生调用 (child_process)
```

### 2.2 模块划分

| 层级 | 职责 | 文件 |
|------|------|------|
| **命令层** | 用户交互、参数处理、流程编排 | commit.ts, review.ts, branch.ts, plan.ts, exec.ts, auto.ts, status.ts |
| **服务层** | 业务逻辑、AI集成、Git操作封装 | GitService.ts, CodeReviewer.ts, CommitMessageGenerator.ts, BranchAdvisor.ts |
| **管理层** | 任务状态、进度追踪、备份恢复 | TodoManager.ts, ProgressManager.ts, CodeGenerator.ts |
| **共享层** | 工具函数、常量、错误类型 | constants.ts, utils.ts, errors.ts |

---

## 三、核心功能详解

### 3.1 智能Commit (commit.ts)

**原理**:
1. 获取Git diff（staged + unstaged）
2. 通过LLM生成Conventional Commits规范的commit message
3. AI失败时降级到规则生成

**实现亮点**:
```typescript
// 双模式：AI优先，规则fallback
async generate(config: CommitMessageConfig) {
    try {
        message = await this.generateWithAI(diffContent, config);
    } catch (error) {
        message = this.generateRuleBased(diffContent, config);
    }
}
```

**规则生成逻辑**:
- 检测文件类型推断type (test→test, .md→docs, 新增>2*删除→feat)
- 从文件路径提取scope
- 生成简洁的subject

### 3.2 AI代码审查

**三级审查模式**:
- **quick**: 快速扫描，只看明显问题
- **standard**: 标准审查，代码质量+最佳实践
- **deep**: 深度审查，架构+性能+安全

**审查流程**:
```typescript
1. 获取diff内容
2. 构建审查prompt（根据level动态调整）
3. ModelRouter路由选择模型
4. 执行AI审查
5. 解析JSON输出
6. 降级策略判断（基于confidence和timeElapsed）
```

**安全扫描集成**:
- 使用SecurityScanner检测敏感信息（密钥、token等）
- 扫描前检查文件大小（>1MB跳过）
- 并发限制（最多5个文件）
- 发现问题可选择--force强制继续

### 3.3 分支管理 (branch.ts)

**三层设计**:
1. **list**: 显示分支列表+上下文（ahead/behind、是否dirty）
2. **switch**: 安全切换（检查工作区干净性）
3. **suggest**: AI分支建议（BranchAdvisor）

**BranchAdvisor智能决策**:
```
决策树：
1. 主分支保护 → create
2. 主题一致性 → stay
3. 混合变更 → create
4. 已有分支匹配 → switch
```

**输出格式**:
```json
{
  "action": "create",
  "reason": "当前在main分支进行了功能开发",
  "newBranch": {
    "name": "feature/git-core-enhancement",
    "from": "main",
    "type": "feature"
  },
  "confidence": 0.95
}
```

### 3.4 自动化开发工作流 (auto.ts)

**完整闭环**:
```
plan (生成任务清单)
  ↓
exec (AI生成代码 + 人工确认)
  ↓
review (代码审查)
  ↓
retry (未通过则重新生成)
  ↓
commit (所有任务完成后自动提交)
```

**关键特性**:
- **任务依赖**: 支持[depends:1,2]语法
- **优先级**: [priority:high/medium/low]
- **自动重试**: 最多3次，带反馈循环
- **备份恢复**: 写入前自动备份，失败可回滚
- **进度追踪**: TodoManager记录每个任务状态

**执行状态机**:
```
pending → in_progress → done
         ↓
       failed
```

### 3.5 双智能体协作

**规划阶段执行**:

```typescript
// 第一步：架构师生成初稿
const ARCHITECT_MODEL = 'Assistant'; // 负责写方案
const REVIEWER_MODEL = 'gemini-2.5-flash-lite'; // 负责挑刺

// 第二步：多轮迭代
for (let i = 1; i <= maxRounds; i++) {
    // 审查员评审
    reviewPrompt = "找出方案中的漏洞、遗漏"
    
    // 架构师修正
    refinePrompt = "根据审查员意见优化方案"
}
```

**角色分工**:
- **架构师**: 深度思考，生成高质量方案
- **审查员**: 快速挑刺，降低成本

---

## 四、Git操作封装

### 4.1 GitService设计模式

**核心方法**:
```typescript
class GitService {
    // 基础操作
    isGitRepository()
    getDiff()
    getBranchInfo()
    getStatusSummary()
    getRecentCommits()
    
    // 写操作
    stageAll()
    commit(message)
    switchBranch(name)
    
    // 高级功能
    getDiffNumstat() // 准确的行数统计
    getCommitDiff(hash) // 历史commit diff
    getCommitRangeDiff(from, to) // 两个commit之间
    isValidBranchName(name) // 验证分支名
}
```

**执行方式**:
```typescript
// 普通命令（通过shell）
private async exec(command: string) {
    const { stdout } = await execAsync(`git ${command}`, {
        maxBuffer: 10 * 1024 * 1024, // 10MB
    });
}

// 安全命令（spawn，避免shell注入）
private async execArgs(args: string[]) {
    const child = spawn('git', args, { cwd: this.cwd });
}
```

### 4.2 Diff行数统计

**准确性优先策略**:
```typescript
async getDiffNumstat() {
    // 优先使用git diff --numstat（准确）
    const numstat = await this.execSafe('diff --staged --numstat');
    if (numstat) {
        // 解析格式：added deleted filename
        const parts = line.split(/\s+/);
        totalAdded += parseInt(parts[0]);
        totalDeleted += parseInt(parts[1]);
    }
    
    // Fallback：使用文件数估算
    if (estimatedTotalLines === 0) {
        estimatedTotalLines = files.length * 50; // 默认每文件50行
    }
}
```

---

## 五、使用方法详解

### 5.1 基础命令

```bash
# 智能提交
yuangs git commit                    # AI生成commit message
yuangs git commit -a                  # 暂存所有变更后提交
yuangs git commit -t feat             # 指定type
yuangs git commit -s auth             # 指定scope
yuangs git commit --dry-run           # 只生成，不实际提交
yuangs git commit --no-ai             # 禁用AI，使用规则

# 代码审查
yuangs git review                     # 审查staged文件
yuangs git review -l deep             # 深度审查
yuangs git review -u                  # 审查unstaged文件
yuangs git review -f src/index.ts     # 审查特定文件
yuangs git review -c HEAD~1           # 审查指定commit
yuangs git review --no-security       # 跳过安全扫描
yuangs git review --save=false        # 不保存结果到git_reviews.md

# 分支管理
yuangs git branch                      # 列出分支
yuangs git branch list                 # 同上
yuangs git branch switch develop       # 切换分支
yuangs git branch suggest              # AI建议分支操作

# 状态查看
yuangs git status                      # 增强的状态显示
```

### 5.2 高级工作流

```bash
# 完整开发流程
yuangs git plan "添加用户认证功能"     # 生成任务清单
yuangs git auto                        # 自动执行任务
yuangs git auto -c                     # 执行完成后自动提交

# 执行特定任务
yuangs git exec -t 3                   # 执行第3个任务
yuangs git exec --model gemini-2.0    # 指定AI模型
```

---

## 六、实际点评

### 6.1 优势

#### 1. **设计理念先进**
- ✅ 人类在环，所有关键操作需要确认
- ✅ AI作为"外脑"，而非"黑盒执行器"
- ✅ 可审计、可回溯、可回滚

#### 2. **架构设计合理**
- ✅ 清晰的分层架构
- ✅ 关注点分离（命令、服务、管理、共享）
- ✅ 模块化程度高，易于扩展

#### 3. **鲁棒性强**
- ✅ AI失败时有规则fallback
- ✅ 自动备份机制（.yuangs/backups/）
- ✅ 重试机制（最多3次）
- ✅ 自定义错误类型

#### 4. **用户体验好**
- ✅ 彩色输出
- ✅ 进度提示（ora spinner）
- ✅ 详细的错误信息
- ✅ 操作建议（💡提示）

#### 5. **AI集成灵活**
- ✅ ModelRouter支持多模型
- ✅ 降级策略（基于confidence和timeElapsed）
- ✅ 双智能体协作模式

### 6.2 弱项分析

#### 弱项1: Git操作过于依赖Shell命令
**问题**:
```typescript
// 所有Git操作通过exec执行
private async exec(command: string) {
    await execAsync(`git ${command}`);
}
```

**风险**:
- Shell注入风险（虽然有spawn作为fallback）
- 跨平台兼容性问题
- 性能开销（每次都fork子进程）

**优化建议**:
```typescript
// 使用isomorphic-git（纯JS实现，更安全、更快）
import * as git from 'isomorphic-git';
import fs from 'fs';

class GitServiceJS {
    private dir: string;
    private fs: any; // isomorphic-git的fs适配器
    
    async getDiff(): Promise<GitDiff> {
        const diff = await git.diff({
            fs: this.fs,
            dir: this.dir,
            cache: {},
        });
        return diff;
    }
    
    async commit(message: string): Promise<string> {
        return await git.commit({
            fs: this.fs,
            dir: this.dir,
            message,
            author: await this.getConfig('user'),
        });
    }
}
```

**预期收益**:
- 零Shell调用，消除注入风险
- 跨平台一致性
- 更好的性能（无需fork）

#### 弱项2: 缺少并发控制
**问题**:
```typescript
// auto.ts中顺序执行任务，没有并发
for (let i = 0; i < maxTasks; i++) {
    const nextTask = getNextTask(tasks);
    await executeTask(nextTask);
}
```

**优化建议**:
```typescript
// 引入依赖图和并发执行
import { DAG } from './DAG';

class ConcurrentExecutor {
    async executeWithConcurrency(
        tasks: TaskStatus[],
        maxConcurrent: number = 3
    ) {
        const dag = new DAG(tasks);
        const executionOrder = dag.getTopologicalOrder();
        
        // 分批执行
        const batches = this.createBatches(executionOrder, maxConcurrent);
        
        for (const batch of batches) {
            await Promise.all(batch.map(task => this.executeTask(task)));
        }
    }
}
```

**预期收益**:
- 独立任务并行执行，提升效率
- 依赖任务正确排序

#### 弱项3: 错误处理不够细粒度
**问题**:
```typescript
// 很多地方使用通用的Error
throw new Error(`Git command failed: ${error.message}`);
```

**优化建议**:
```typescript
// 扩展错误类型
export class GitCommandError extends GitError {
    constructor(
        public command: string,
        public exitCode: number,
        message: string
    ) {
        super(message);
    }
}

export class GitMergeConflictError extends GitError {
    conflictedFiles: string[];
}

export class GitRemoteError extends GitError {
    remote: string;
}

// 使用
try {
    await this.exec('push');
} catch (error: any) {
    if (error.message.includes('conflict')) {
        throw new GitMergeConflictError('合并冲突', {
            conflictedFiles: this.parseConflictedFiles(error.stdout)
        });
    }
}
```

#### 弱项4: 缺少测试覆盖
**问题**: 没有看到单元测试文件

**优化建议**:
```typescript
// __tests__/git/GitService.test.ts
describe('GitService', () => {
    let mockGitService: GitService;
    
    beforeEach(() => {
        // Mock child_process
        jest.mock('child_process');
        mockGitService = new GitService('/tmp/test');
    });
    
    it('should get branch info correctly', async () => {
        const info = await mockGitService.getBranchInfo();
        expect(info.current).toBe('main');
        expect(info.ahead).toBe(0);
    });
    
    it('should handle git command failure', async () => {
        await expect(mockGitService.getBranchInfo()).rejects.toThrow(GitCommandError);
    });
});
```

#### 弱项5: 缺少性能监控
**问题**: 无法追踪Git操作的性能瓶颈

**优化建议**:
```typescript
// 引入性能监控
class GitService {
    private metrics = {
        operations: new Map<string, number[]>(),
    };
    
    private async execWithMetrics(command: string) {
        const start = Date.now();
        try {
            const result = await this.exec(command);
            const elapsed = Date.now() - start;
            
            this.recordMetric(command, elapsed);
            return result;
        } catch (error) {
            const elapsed = Date.now() - start;
            this.recordMetric(`${command} (failed)`, elapsed);
            throw error;
        }
    }
    
    recordMetric(command: string, elapsed: number) {
        const history = this.metrics.operations.get(command) || [];
        history.push(elapsed);
        this.metrics.operations.set(command, history);
    }
    
    getMetrics() {
        const stats = {};
        for (const [cmd, times] of this.metrics.operations) {
            stats[cmd] = {
                count: times.length,
                avg: times.reduce((a, b) => a + b) / times.length,
                max: Math.max(...times),
            };
        }
        return stats;
    }
}
```

#### 弱项6: 缺少Git钩子集成
**问题**: 无法利用Git hooks自动化流程

**优化建议**:
```typescript
// GitHooksManager.ts
class GitHooksManager {
    async installHook(hookName: string, script: string) {
        const hooksDir = path.join('.git', 'hooks');
        const hookPath = path.join(hooksDir, hookName);
        
        await fs.promises.writeFile(hookPath, script, { mode: 0o755 });
    }
    
    async installPreCommitHook() {
        const script = `#!/bin/bash
# 自动执行代码审查
yuangs git review -l quick
if [ $? -ne 0 ]; then
    echo "代码审查未通过，提交被阻止"
    exit 1
fi
`;
        await this.installHook('pre-commit', script);
    }
    
    async installCommitMsgHook() {
        const script = `#!/bin/bash
# 使用AI生成commit message
MESSAGE_FILE=$1
COMMIT_MSG=$(cat $MESSAGE_FILE)
NEW_MSG=$(yuangs git commit --no-ai "$COMMIT_MSG" --output-only)
echo "$NEW_MSG" > $MESSAGE_FILE
`;
        await this.installHook('commit-msg', script);
    }
}
```

#### 弱项7: 缺少远程仓库操作
**问题**: 目前只有本地Git操作，缺少pull/push/fetch

**优化建议**:
```typescript
class GitService {
    async push(remote: string = 'origin', branch?: string) {
        const current = await this.getBranchInfo();
        const targetBranch = branch || current.current;
        
        return await this.execArgs(['push', remote, targetBranch]);
    }
    
    async pull(remote: string = 'origin', branch?: string) {
        const current = await this.getBranchInfo();
        const targetBranch = branch || current.current;
        
        return await this.execArgs(['pull', remote, targetBranch]);
    }
    
    async fetch(remote: string = 'origin', prune: boolean = true) {
        const args = ['fetch', remote];
        if (prune) args.push('--prune');
        return await this.execArgs(args);
    }
    
    async clone(url: string, targetDir: string) {
        return await this.execArgs(['clone', url, targetDir]);
    }
}
```

#### 弱项8: TodoManager状态持久化
**问题**: 任务状态只在todo.md中，没有专门的持久化层

**优化建议**:
```typescript
// 使用SQLite持久化任务状态
import Database from 'better-sqlite3';

class TaskPersistence {
    private db: Database.Database;
    
    constructor(dbPath: string) {
        this.db = new Database(dbPath);
        this.initSchema();
    }
    
    private initSchema() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                completed BOOLEAN DEFAULT 0,
                exec_status TEXT DEFAULT 'pending',
                review_score INTEGER,
                attempts INTEGER DEFAULT 0,
                backup_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(exec_status);
            CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
        `);
    }
    
    async saveTask(task: TaskStatus) {
        const stmt = this.db.prepare(`
            INSERT INTO tasks (description, completed, exec_status, review_score, attempts, backup_id)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                completed = excluded.completed,
                exec_status = excluded.exec_status,
                review_score = excluded.review_score,
                attempts = excluded.attempts,
                backup_id = excluded.backup_id,
                updated_at = CURRENT_TIMESTAMP
        `);
        
        return stmt.run(
            task.description,
            task.completed ? 1 : 0,
            task.execStatus,
            task.reviewScore,
            task.attempts,
            task.backupId
        );
    }
    
    async getPendingTasks(): Promise<TaskStatus[]> {
        const stmt = this.db.prepare(`
            SELECT * FROM tasks 
            WHERE completed = 0 AND exec_status != 'failed'
            ORDER BY priority DESC, created_at ASC
        `);
        
        return stmt.all();
    }
}
```

#### 弱项9: 缺少冲突处理
**问题**: merge/rebase时没有冲突检测和自动处理

**优化建议**:
```typescript
class GitConflictResolver {
    async detectConflicts(): Promise<string[]> {
        const status = await git.exec('status --porcelain');
        const conflictMarkers = ['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU'];
        
        return status.split('\n')
            .filter(line => conflictMarkers.includes(line.substring(0, 2)))
            .map(line => line.substring(3));
    }
    
    async resolveWithAI(filePath: string): Promise<void> {
        const fileContent = await fs.promises.readFile(filePath, 'utf8');
        
        // 提取冲突标记
        const conflictRegex = /<<<<<<<.*?=======(.*?)=======.*?>>>>>>>/gs;
        const conflicts = [...fileContent.matchAll(conflictRegex)];
        
        // 使用AI解决冲突
        for (const conflict of conflicts) {
            const resolved = await this.askAIResolve(conflict[0]);
            // 替换冲突为解决方案
        }
    }
}
```

#### 弱项10: 缺少Git LFS支持
**问题**: 大文件处理能力不足

**优化建议**:
```typescript
class GitLFSService {
    async track(pattern: string): Promise<void> {
        await git.exec(`lfs track "${pattern}"`);
    }
    
    async install(): Promise<void> {
        await git.exec('lfs install');
    }
    
    async getStatus(): Promise<{ tracked: string[]; pointer: string[] }> {
        const tracked = await this.execSafe('lfs track');
        const pointer = await this.execSafe('lfs ls-files');
        
        return {
            tracked: tracked.split('\n').filter(Boolean),
            pointer: pointer.split('\n').filter(Boolean),
        };
    }
}
```

---

## 七、优化路线图

### 短期优化 (1-2周)
1. ✅ 引入isomorphic-git替代部分Shell调用
2. ✅ 扩展错误类型体系
3. ✅ 添加单元测试（目标覆盖率70%）
4. ✅ 添加性能监控
5. ✅ 实现远程仓库操作

### 中期优化 (1-2月)
1. ✅ 并发执行引擎
2. ✅ 任务状态持久化
3. ✅ Git钩子集成
4. ✅ 冲突检测和AI辅助解决
5. ✅ Git LFS支持

### 长期优化 (3-6月)
1. ✅ 完整的GUI界面（基于Electron）
2. ✅ 分布式任务执行
3. ✅ AI模型本地化（Ollama集成）
4. ✅ 多仓库管理
5. ✅ GitOps集成

---

## 八、总结

**整体评价**: ⭐⭐⭐⭐☆ (4/5)

Yuangs的Git功能展现了卓越的工程能力和前瞻性设计。它成功地将AI能力与Git工作流深度融合，既保持了人类控制权，又充分利用了AI的智能性。

**核心优势**:
- 理念先进：AI+人类的协作模式
- 架构合理：清晰的分层和模块化
- 鲁棒性强：多层fallback和错误处理
- 用户体验好：交互友好、反馈及时

**改进空间**:
- 技术债务：过于依赖Shell调用
- 功能缺口：缺少远程操作、冲突处理等
- 工程实践：测试覆盖、性能监控需加强
- 并发能力：单线程执行限制了效率

**建议**:
优先解决技术债务（引入isomorphic-git），然后补充功能缺口（远程操作、冲突处理），最后完善工程实践（测试、监控）。这样可以在保持现有优势的同时，大幅提升系统的稳定性和性能。

---

