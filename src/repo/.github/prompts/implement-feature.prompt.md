---
description: Implement a feature by completing tasks sequentially
tools: ["read", "search", "edit", "terminal", "agent"]
argument-hint: "issue key or task file path"
---

# Implement Feature

## Agent Dispatch

| Agent | When to use |
|-------|-------------|
| `fixer` | Bounded feature work — spec is clear, files are known |
| `feature-builder` | Complex feature build — builder only; the orchestrator still runs the review |

**CRITICAL: READ:** [.claude/prompt-snippets/implement-feature.md](../../.claude/prompt-snippets/implement-feature.md).
