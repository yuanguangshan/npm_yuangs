# Yuangs CLI Cheatsheet

> 苑广山的个人命令行工具 | Version: 5.60.0

## Quick Reference

```bash
# AI Chat
yuangs ai "Explain this code"
yuangs ai -e "Find large files"      # Generate & execute command
yuangs ai -p "Complex question"      # Use Pro model
yuangs                               # Enter interactive mode

# Git Commands
yuangs git commit                    # Smart commit message
yuangs git review                    # AI code review
yuangs git plan                      # Generate todo.md
yuangs git exec                      # Execute from todo.md
yuangs git auto                      # Auto-execute tasks

# Config
yuangs config model list             # List available models
yuangs config model set gpt-4o       # Set default model

# Context Management (in interactive mode)
@src/index.ts                        # Reference file
#src/components                     # Reference directory
$ ls -la                            # Execute command
:ls                                 # List context items
```

---

## Table of Contents

- [Core Commands](#core-commands)
- [AI Command Options](#ai-command-options)
- [Git Commands](#git-commands)
- [Config Commands](#config-commands)
- [Interactive Chat Syntax](#interactive-chat-syntax)
- [Context Management](#context-management)
- [Pipeline Syntax](#pipeline-syntax)
- [Capability Commands](#capability-commands)
- [Skills Commands](#skills-commands)
- [Router Commands](#router-commands)
- [SSH Commands](#ssh-commands)

---

## Core Commands

### `yuangs ai [question]` / `yuangs [question]`

Enter AI chat mode or ask a single question.

```bash
yuangs ai "How do I create a React component?"
yuangs "List all TypeScript files"
yuangs ai                              # Interactive mode
```

### `yuangs list`

List all configured applications.

```bash
yuangs list
# Output:
# 📱 应用列表
#   ● shici      https://poetry-db.cn
#   ● dict        https://dictionary.com
```

### `yuangs history`

View and execute command history.

```bash
yuangs history              # List all history
yuangs history -l           # Execute last command
```

### `yuangs macros` / `yuangs save` / `yuangs run`

Macro management.

```bash
yuangs macros               # List all macros
yuangs save deploy          # Save a new macro
yuangs save last-task -l    # Save last executed command
yuangs run deploy           # Run a macro
```

### `yuangs completion [shell]`

Install shell completion (bash/zsh).

```bash
yuangs completion zsh
yuangs completion bash
```

---

## AI Command Options

| Option | Description |
|--------|-------------|
| `-e, --exec` | Generate and execute Linux commands |
| `-m, --model <model>` | Specify AI model |
| `-p` | Use Pro model |
| `-f` | Use Flash model |
| `-l` | Use Lite model |
| `-w, --with-content` | Read file content from stdin |
| `--verbose` | Show capability matching details |
| `--planner` | Enable dual-agent mode (Planner + Executor) |
| `--no-planner` | Disable dual-agent mode |
| `--show-context-relevance` | Show context relevance scores |
| `--context-strategy <strategy>` | Context strategy: smart/minimal/full |

```bash
yuangs ai -e "Find all node processes"
yuangs ai --model gemini-2.5-flash "Explain recursion"
yuangs ai --context-strategy minimal "Quick question"
yuangs ai --show-context-relevance "@src/index.ts What does this do?"
```

---

## Git Commands

### `yuangs git commit` / `yuangs git c`

Smart commit message generation.

| Option | Description |
|--------|-------------|
| `-a, --all` | Stage all changes |
| `-d, --detailed` | Generate detailed commit message |
| `-t, --type <type>` | Commit type (feat/fix/docs/refactor/etc) |
| `-s, --scope <scope>` | Commit scope |
| `--dry-run` | Generate message without committing |
| `--no-ai` | Use rule-based generation (no AI) |

```bash
yuangs git commit
yuangs git commit --all
yuangs git commit --type feat --scope auth
yuangs git commit --dry-run          # Preview message
```

### `yuangs git review`

AI-powered code review.

| Option | Description |
|--------|-------------|
| `-l, --level <level>` | Review level: quick/standard/deep |
| `-f, --file <file>` | Review specific file |
| `-u, --unstaged` | Review unstaged changes |
| `-c, --commit <commit>` | Review specific commit (hash or HEAD~1) |
| `--no-ai` | Disable AI, show diff summary only |
| `--no-save` | Don't save to git_reviews.md |
| `--force` | Ignore security warnings |
| `--no-security` | Skip security scan |

```bash
yuangs git review
yuangs git review --level deep
yuangs git review --commit HEAD~1
yuangs git review --file src/index.ts
yuangs git review --unstaged
```

### `yuangs git status`

Enhanced Git status display.

```bash
yuangs git status
# Shows:
# - Current branch with upstream info
# - File changes (modified/added/deleted/untracked)
# - Recent commits
```

### `yuangs git branch [subcommand]`

Smart branch management.

```bash
yuangs git branch              # List branches with context
yuangs git branch switch feature/new-auth
yuangs git branch suggest       # Get AI suggestions
```

### `yuangs git plan [prompt...]`

Auto-read recent commits and generate todo.md with AI collaboration.

| Option | Description |
|--------|-------------|
| `-r, --rounds <number>` | Conversation rounds (default: 2) |
| `-m, --model <model>` | Architect model (default: Assistant) |
| `--reviewer-model <model>` | Reviewer model (default: gemini-2.5-flash) |

```bash
yuangs git plan
yuangs git plan "Add user authentication"
yuangs git plan --rounds 3 --model gpt-4o
```

### `yuangs git exec`

Generate code from todo.md tasks.

| Option | Description |
|--------|-------------|
| `-f, --fromfile <file>` | Specify todo file (default: todo.md) |
| `-t, --task <number>` | Execute specific task number |
| `-m, --model <model>` | AI model to use (default: Assistant) |

```bash
yuangs git exec
yuangs git exec --task 3
yuangs git exec --fromfile features.md
```

### `yuangs git auto`

Auto-execute tasks from todo.md.

| Option | Description |
|--------|-------------|
| `-n, --max-tasks <number>` | Max tasks to execute (default: 5) |
| `-m, --model <model>` | AI model to use |
| `-s, --min-score <number>` | Min passing score (default: 70) |
| `-l, --review-level <level>` | Code review level (default: standard) |
| `--skip-review` | Skip code review |
| `-o, --save-only` | Save code only, don't write files |
| `-c, --commit` | Auto-commit after all tasks |
| `--commit-message <msg>` | Custom commit message |

```bash
yuangs git auto
yuangs git auto --max-tasks 10 --min-score 80
yuangs git auto --commit --commit-message "feat: implementation"
```

### `yuangs git diff-semantic` / `yuangs git sd`

Semantic-level diff analysis (functions/classes/interfaces).

```bash
yuangs git diff-semantic
yuangs git sd --unstaged
```

### `yuangs git resolve`

AI-powered merge conflict resolution.

| Option | Description |
|--------|-------------|
| `-m, --model <model>` | AI model to use |
| `-a, --auto-add` | Auto git add after resolution |
| `--dry-run` | Preview without modifying |
| `--no-backup` | Don't create .bak files |
| `-c, --concurrency <number>` | Concurrent processing (default: 2) |

```bash
yuangs git resolve
yuangs git resolve --auto-add --dry-run
yuangs git resolve --model gpt-4o --concurrency 4
```

### `yuangs git history-semantic` / `yuangs git hs`

Semantic analysis of Git commit history.

```bash
yuangs git history-semantic
yuangs git hs --count 10
```

### `yuangs git smart-commit` / `yuangs git sc`

Smart logical grouping and step-by-step commits.

```bash
yuangs git smart-commit
yuangs git sc --yes
```

---

## Config Commands

### `yuangs config model [action] [name]`

Manage default AI model.

```bash
yuangs config model get              # Show current model
yuangs config model list             # List all models
yuangs config model set gpt-4o       # Set default model
yuangs config model reset            # Reset to default
```

### `yuangs config get <key>`

Read a configuration value.

```bash
yuangs config get defaultModel
yuangs config get aiProxyUrl
yuangs config get contextWindow
```

### `yuangs config set <key> <value>`

Set a configuration value.

```bash
yuangs config set defaultModel gpt-4o
yuangs config set contextWindow 8000
```

### `yuangs config list`

List all configuration items.

```bash
yuangs config list
```

---

## Preferences Commands

### `yuangs preferences list`

List all current preferences.

**Available Preferences:**
| Key | Values | Description |
|-----|--------|-------------|
| `verbosity` | concise/normal/detailed | Output verbosity |
| `language` | zh-CN/en-US/auto | Language |
| `codeStyle` | functional/imperative/any | Code style preference |
| `explanation` | technical/beginner/adaptive | Explanation level |
| `outputFormat` | markdown/plain/structured | Output format |
| `contextStrategy` | smart/minimal/full | Context strategy |
| `autoConfirm` | true/false | Auto-confirm actions |

```bash
yuangs preferences list
yuangs preferences set verbosity detailed
yuangs preferences set language zh-CN
yuangs preferences set autoConfirm false
yuangs preferences reset
```

### Other Preferences Commands

```bash
yuangs preferences show-prompt         # Show current personalized prompt
yuangs preferences setup               # Interactive setup wizard
```

---

## Interactive Chat Syntax

### File References

```bash
@src/index.ts                          # Reference a file
@src/index.ts "Explain the main function"
@src/components/*.tsx                   # Wildcard pattern
```

### Directory References

```bash
#src/components                       # Reference directory
#src/components "Review all components"
```

### Command Execution

```bash
$ ls -la                               # Execute with display
! npm test                             # Execute with display
:exec npm test                          # Execute without display
```

### Context Management

```bash
:ls                                    # List context items
:cat                                   # Show all context
:cat 1                                 # Show item 1
:cat 1 --lines 50                      # Show first 50 lines
:clear                                 # Clear all context
```

### Conversation Control

```bash
:ai                                    # Enter AI mode with context
/clear                                 # Clear conversation history
/history                               # Show conversation history
/exit                                  # Exit chat mode
```

### Plugins

```bash
:plugins                               # List loaded plugins
```

---

## Context Management

### Context Items

Context items are stored in `.ai/context.json` and include:
- Referenced files (`@file`)
- Referenced directories (`#dir`)
- Command outputs (`$ command`)

### Persistence

Context is automatically persisted and loaded between sessions.

### Smart Context

The system uses:
- **Relevance Scoring**: Ranks context by query relevance
- **Intent Detection**: Adjusts weights based on user intent (debug/refactor/feature/docs)
- **Time Decay**: Older context items get lower scores
- **Access Tracking**: Frequently used items get boosted

### Cleanup

```bash
# Programmatic cleanup
import { cleanupStaleContext } from './commands/contextStorage';

await cleanupStaleContext({
  maxAge: 90,              // 90 days
  minImportance: 0.2,       // Min importance
  maxItems: 1000,           // Max items
  respectPinned: true       // Keep pinned items
});
```

---

## Pipeline Syntax

Commands can be piped with `|`:

```bash
"List all files" | $ grep ".ts" | "Count matches"
@src/index.ts | "Find bugs" | "Suggest fixes"
```

The output of each stage becomes the input for the next stage.

---

## Capability Commands

### `yuangs capabilities`

```bash
yuangs capabilities explain           # Explain current config
yuangs capabilities match text_generation reasoning
yuangs capabilities list              # List all capabilities
yuangs capabilities history           # Execution history
yuangs capabilities history -l 10     # Last 10 records
yuangs capabilities replay <id>       # Replay execution
yuangs capabilities replay abc123 -v  # Verbose replay
```

---

## Skills Commands

### `yuangs skills`

```bash
yuangs skills list                    # List all skills with stats
yuangs skills explain <name>          # Explain a skill
yuangs skills enable <name>           # Enable a skill
yuangs skills disable <name>          # Disable a skill
```

---

## Router Commands

### `yuangs router`

```bash
yuangs router list                    # List model adapters
yuangs router stats [model]           # Usage statistics
yuangs router test <adapter>          # Test adapter
yuangs router test openai --prompt "Explain recursion"

yuangs router policy list             # List routing policies
yuangs router policy set cost-saving

yuangs router exploration set epsilon_greedy --epsilon 0.2
yuangs router exploration show

yuangs router config show             # Show router config
yuangs router config enable openai
yuangs router config map conversation gpt-4o

yuangs router doctor                  # System health check
yuangs router doctor --chaos          # Stress testing

yuangs router exec "Write React component" --type coding
yuangs router exec "Summarize" --strategy cost-saving
```

---

## SSH Commands

### `yuangs ssh <connection>`

Connect to remote host with AI governance.

```bash
yuangs ssh user@server.com
yuangs ssh admin@192.168.1.1:2222 --identity ~/.ssh/id_rsa
yuangs ssh user@host --web            # Web-based terminal (Beta)
```

| Option | Description |
|--------|-------------|
| `-p, --port <port>` | SSH port (default: 22) |
| `-i, --identity <file>` | Private key file |
| `--password <password>` | Password (not recommended) |
| `--web` | Launch web-based terminal |

---

## Registry Commands

### `yuangs registry`

```bash
yuangs registry publish               # Publish new Macro (interactive)
yuangs registry get <id> [version]     # Get Macro info
yuangs registry list                  # List all Macros
yuangs registry approve <id> <version>
yuangs registry deprecate <id> [version]
yuangs registry risk <id> [version]    # Assess risk
yuangs registry explain <id|capability>
```

---

## Replay Commands

### `yuangs replay <id_or_file>`

Replay an execution or SSH session.

```bash
yuangs replay last                    # Replay last execution
yuangs replay abc123                  # Replay by ID
yuangs replay session.cast            # Replay .cast file
yuangs replay last --speed 2.0        # Playback speed
yuangs replay last --diff --dry       # Dry run with diff
```

| Option | Description |
|--------|-------------|
| `-s, --strict` | Strict replay (exact model) |
| `-c, --compatible` | Compatible replay (allow fallback) |
| `-r, --re-evaluate` | Re-evaluate with current config |
| `-v, --verbose` | Verbose output |
| `--dry` | Dry run |
| `--explain` | Show explanation before replay |
| `--diff` | Show config diff |
| `--speed <n>` | Playback speed (default: 1.0) |

---

## Explain Commands

### `yuangs explain [id]`

Explain an execution record.

```bash
yuangs explain                         # Explain last execution
yuangs explain last                  # Same as above
yuangs explain abc123                 # Explain by ID
```

---

## Application Shortcuts

```bash
yuangs shici                          # Open poetry app
yuangs dict                           # Open dictionary
yuangs pong                           # Open Pong game
yuangs <custom-app>                   # Open custom app from config
```

---

## Advanced Usage

### Zero-Mode

Enter AI mode directly with `??`:

```bash
??
# Then enter your question
```

### Pipeline Examples

```bash
# Complex workflow
"List all TS files" | $ grep "test" | "Count test files"

# Code review workflow
@src/index.ts | "Find bugs" | "Suggest fixes" | "Generate patch"

# Git workflow
yuangs git plan | "Review the plan" | yuangs git exec
```

### Context Strategies

```bash
yuangs ai --context-strategy smart "Complex question"   # Default
yuangs ai --context-strategy minimal "Quick question"  # Minimal context
yuangs ai --context-strategy full "Deep analysis"      # All context
```

### Intent-Based Query

The system automatically detects intent and adjusts weights:

| Intent | Keywords | Weights |
|--------|----------|--------|
| `debug` | debug, error, fix, bug | keywords: 0.5, path: 0.2 |
| `refactor` | refactor, clean, optimize | keywords: 0.2, path: 0.5 |
| `feature` | add, create, implement | keywords: 0.35, path: 0.35 |
| `docs` | doc, readme, explain | keywords: 0.25, path: 0.35 |

```bash
yuangs ai "debug the error in auth service"     # Uses debug weights
yuangs ai "refactor user module"               # Uses refactor weights
yuangs ai "add user authentication"            # Uses feature weights
```

---

## Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| `~/.yuangs.json` | User home | Main configuration |
| `.ai/context.json` | Project root | Context storage |
| `todo.md` | Project root | Task list for `git exec/auto` |
| `git_reviews.md` | Project root | Code review history |

---

## Tips & Tricks

1. **Use `-p` for complex tasks** - Pro model handles better reasoning
2. **Use `--context-strategy minimal`** for quick questions - Faster responses
3. **Chain commands with pipes** - Build complex workflows
4. **Use `:exec` for scripts** - Bypass AI for deterministic commands
5. **Review before committing** - Use `--dry-run` to preview
6. **Pin important files** - Add `pinned: true` to context items
7. **Clean up old context** - Run `cleanupStaleContext()` periodically

---

## Getting Help

```bash
yuangs help                            # General help
yuangs ai --help                       # AI command help
yuangs git --help                      # Git commands help
yuangs git commit --help               # Specific command help
```

---

## Version Info

```bash
yuangs --version                       # Show version
yuangs -V                              # Short version
```

**Current Version:** 5.60.0
