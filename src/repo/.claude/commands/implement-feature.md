---
description: Implement a feature by completing tasks sequentially
allowed-tools: "Read, Write, Edit, Bash(*), Task"
argument-hint: "feature specification or task list"
---

# Implement Feature

## Agent Dispatch
| Agent | When to use |
|-------|-------------|
| `fixer` | Bounded feature work — spec is clear, files are known |
| `feature-builder` | Complex feature build — builder only; the orchestrator still runs the review |

Follow the prompt defined in [.claude/prompt-snippets/implement-feature.md](../prompt-snippets/implement-feature.md).
