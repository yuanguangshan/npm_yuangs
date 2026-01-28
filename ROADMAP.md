# Yuangs Project Roadmap 🚀

This roadmap outlines the planned improvements for the `yuangs` CLI, focusing on stability, developer experience, and intelligent Git integration.

## Phase 1: Infrastructure & Quality (1-2 Weeks) 🏗️
*Goal: Establish a solid foundation for the project.*

- [x] **Jest Setup**: Configure Jest and ts-jest for reliable TypeScript testing.
- [x] **Error Type Hierarchy**: Implement a centralized error system for better debugging and user feedback.
- [x] **Unit Testing**: Achieve 70% test coverage for core modules (`GitService`, `TodoManager`, `ContextGatherer`).
- [x] **Logging System**: Implement a structured logging system with different levels (debug, info, warn, error).
- [x] **Performance Monitoring**: Track and log durations of key operations to identify bottlenecks.

## Phase 2: User Experience & DX (2-3 Weeks) ✨
*Goal: Make the daily usage as smooth as possible.*

- [x] **Configuration System**: Implement `.yuangsrc` or `yuangs.config.json` support.
- [x] **Enhanced Error Feedback**: Provide friendly error messages with actionable suggestions (using the new Error Hierarchy).
- [x] **Short Command Aliases**: Support short flags for frequent commands (e.g., `git auto -l` instead of `--level`).
- [x] **Progress Visualization**: Implement better progress indicators and colorful terminal output.

## Phase 3: Advanced Intelligent Git (Next Milestone) 🧠
*Goal: Deeper AI integration for complex workflows.*

- [ ] **Semantic Commit Parsing**: Better understanding of commit history through AI analysis.
- [x] **AI-Assisted Conflict Resolution**: Use AI to help resolve Git conflicts during merges.
- [ ] **Capability-Aware Pipeline**: Implement capability levels and graceful degradation for AI agents.
- [x] **Semantic Diff Engine**: Move from text-based diffs to structural/semantic understanding of changes.
- [ ] **Smart Commit Management**: Improve commit message generation and multi-step commits.

## 🏆 Milestones
- **v6.0.0 (The Reliability Release)**: Complete Phase 1 & 2. Focused on becoming a stable tool for developers.
- **v7.0.0 (The Intelligence Release)**: Complete Phase 3. Full integration of advanced AI workflows.

## 📜 Changelog
### [2026-01-29]
- ✅ Completed Phase 1 Infrastructure.
- ✅ Completed Phase 2 UX/DX Enhancements.
- ✅ Integrated `GlobalErrorHandler` and standard `ConfigManager`.
- ✅ Standardized CLI flags and added short aliases (`-l`, `-m`).
- ✅ Implemented Premium Progress Visualization (ProgressBar & Task Panels).
- ✅ Refactored CLI UI with `CLIComponent` (Terminal-width aware).
- ✅ Fixed ProgressBar edge cases (Division by zero, TTY detection).
- ✅ Improved CapabilityLevel hierarchy and robust parsing.
- ✅ Implemented **Semantic Diff Engine (v0.1)** with structural analysis support.
- ✅ Added `yuangs git diff-semantic` (alias `sd`) command.
- ✅ Implemented **AI-Assisted Conflict Resolution** with `p-limit` concurrency, automated backups, and syntax safety checks.
- ✅ Added `yuangs git resolve` command with `--dry-run` and model whitelist validation.
- ✅ Improved repository hygiene (.gitignore updates).

> *Note: Roadmap status and Changelog are currently manually synced. Future enhancement: Implement CI check for consistency.*

---
*Last Updated: 2026-01-29 (Antigravity AI)*
