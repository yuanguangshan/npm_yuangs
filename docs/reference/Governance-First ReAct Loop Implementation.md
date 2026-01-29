# Governance-First ReAct Loop Implementation

## Overview

This document describes the implementation of the **Governance-First ReAct Loop**, a state machine-driven agent execution model that prioritizes human control and auditability over autonomous operation.

## Design Philosophy

> "yuangs is not trying to create a more intelligent 'autopilot', but a steering wheel with ABS, anti-skid, and active braking."

The Governance-First ReAct Loop enforces three core principles:

1. **Separation of Powers**: LLMs have reasoning rights only; execution rights belong to Runtime and User
2. **Explicit Context**: Resources must be explicitly declared and are granted as capabilities
3. **Mediated Execution**: All side effects must pass through the Governance Layer

## Architecture

### State Machine

The system implements a finite state machine (FSM) with the following states:

```
IDLE → THINKING → PROPOSING → GOVERNING → EXECUTING → OBSERVING → EVALUATING
                                  ↓                 ↓
                             [rejection]    [any result]
                                  ↓                 ↓
                            THINKING ←───────────┘
```

**States:**

1. **IDLE**: Waiting for user input / new task
2. **THINKING**: LLM reasoning zone (no side effects)
3. **PROPOSING**: Convert LLM intent to structured Action objects
4. **GOVERNING**: Critical interruption point - human/policy approval
5. **EXECUTING**: Runtime execution zone (side effects happen here)
6. **OBSERVING**: Result normalization and recording
7. **EVALUATING**: Non-LLM judge to determine next steps
8. **TERMINAL**: End state

### Key Modules

#### 1. `src/agent/state.ts` - The Constitution

Defines all immutable data structures:

- `AgentState`: Enum of all possible states
- `ProposedAction`: Frozen action object with risk level
- `GovernanceDecision`: Human/policy approval/rejection
- `EvaluationOutcome`: Runtime decision (not LLM decision)
- `ExecutionTurn`: Complete snapshot of each iteration

**Key Design Points:**
- Fixes Mine #1: Strict `EvaluationOutcome` prevents LLM from deciding completion
- Fixes Mine #2: Enhanced `contextSnapshot` includes versions for replay fidelity
- Fixes Mine #3: `GovernanceDecision` tracks modification lineage

#### 2. `src/agent/fsm.ts` - The Judge

Enforces legal state transitions:

```typescript
fsm.transitionTo(target, payload) // Throws on illegal transition
```

**Valid Transitions:**
- `IDLE → THINKING`: Task start
- `THINKING → PROPOSING | TERMINAL`: LLM finished reasoning
- `PROPOSING → GOVERNING`: Action must be reviewed
- `GOVERNING → EXECUTING`: Approved
- `GOVERNING → THINKING`: Rejected (with reason)
- `EXECUTING → OBSERVING`: Execution complete (success/fail)
- `OBSERVING → EVALUATING`: Results recorded
- `EVALUATING → THINKING`: Continue (with context)
- `EVALUATING → TERMINAL`: Task complete

#### 3. `src/agent/loop.ts` - The Engine

Drives the execution loop while respecting FSM:

```typescript
const loop = new GovernedAgentLoop(context, config);
const turns = await loop.run();
```

**Turn Execution:**

```typescript
while (turnCount < maxTurns && !fsm.isTerminal()) {
  // S1. THINKING: LLM reasons
  // S2. PROPOSING: Convert to Action, assess risk
  // S3. GOVERNING: Wait for human/policy approval
  // S4. EXECUTING: Execute approved action
  // S5. OBSERVING: Record results to context
  // S6. EVALUATING: Decide to continue or terminate
}
```

#### 4. `src/agent/llmAdapter.ts` - The Adapter

Adapts existing LLM infrastructure to return structured thoughts:

```typescript
const thought = await LLMAdapter.think(messages, mode);
// Returns: AgentThought with isDone, type, payload, reasoning
```

#### 5. `src/agent/governance.ts` - The Gatekeeper

Implements human/policy approval logic:

```typescript
const decision = await GovernanceService.adjudicate(action, {
  autoApproveLowRisk: true
});
```

**Features:**
- Auto-approves low-risk actions (configurable)
- Interactive prompt for medium/high-risk actions
- Risk evaluation based on command patterns
- Support for modification (advanced)

#### 6. `src/agent/executor.ts` - The Executor

Executes approved actions safely:

```typescript
const result = await ToolExecutor.execute(action);
// Returns: ToolExecutionResult with success, output, error, artifacts
```

**Supported Actions:**
- `tool_call`: Read file, write file, list files
- `shell_cmd`: Execute shell commands
- `code_diff`: Apply unified diff format patches
- `answer`: Final output (no side effects)

#### 7. `src/agent/contextManager.ts` - The Memory

Manages conversation history and context:

```typescript
const context = new ContextManager(initialContext);
context.addMessage('user', input);
context.addToolResult('read_file', output);
const hash = context.getHash();
```

## Usage Example

### Basic Loop

```typescript
import { GovernedAgentLoop } from './src/agent/loop';

const loop = new GovernedAgentLoop({
  input: 'Read package.json and list all dependencies',
  mode: 'command',
  history: []
}, {
  maxTurns: 20,
  autoApproveLowRisk: false,
  verbose: true
});

const turns = await loop.run();
console.log('Execution completed:', turns.length, 'turns');
```

### Direct FSM Usage

```typescript
import { GovernanceFSM } from './src/agent/fsm';

const fsm = new GovernanceFSM();
fsm.transitionTo('THINKING');
// ... continue transitions
```

## Testing

Run the unit tests:

```bash
npx tsx test_governance.ts
```

Tests cover:
- FSM state transitions
- Risk evaluation
- Tool execution
- Governance approval logic

## Integration with Existing Code

The Governance Loop is **non-breaking** to existing functionality:

- ✅ Existing `AgentPipeline` continues to work
- ✅ All existing CLI commands function normally
- ✅ Shared infrastructure (Context Buffer, LLM Client, etc.)

The new modules are exported from `src/agent/index.ts`:

```typescript
export { GovernedAgentLoop } from './loop';
export { GovernanceFSM } from './fsm';
export { GovernanceService } from './governance';
export { ToolExecutor } from './executor';
// ... etc
```

## Future Enhancements

Per the `todo.md` roadmap:

### Phase 1: Foundation (Current)
- ✅ FSM with governance enforcement
- ✅ Tool execution layer
- ✅ Basic LLM adapter

### Phase 2: Intelligent Enhancement
- [ ] ReAct loop with automatic retry
- [ ] Enhanced risk rules
- [ ] Diff application support

### Phase 3: Architecture Evolution
- [ ] Multi-agent separation (Planner/Executor/Critic)
- [ ] Timeline visualization
- [ ] Memory with vector search

## Key Differences from Traditional Agents

| Traditional Agent | Governed Agent (yuangs) |
|-------------------|-------------------------|
| LLM decides "I'm done" | Runtime decides based on evaluation |
| Auto-retry on failure | Failure becomes input for next iteration |
| Black-box execution | Every decision is auditable |
| Side effects anywhere | Side effects only in EXECUTING state |
| Opaque history | Full `ExecutionTurn` snapshots |

## Conclusion

The Governance-First ReAct Loop transforms yuangs from a linear command runner into a **governed runtime** where:

- ✅ AI never advances the state machine
- ✅ All irreversible actions require explicit state
- ✅ Every decision is replayable and auditable
- ✅ Risk is visible and controllable

This is Phase 1 of the "Interactive Programming Tool" evolution path.
