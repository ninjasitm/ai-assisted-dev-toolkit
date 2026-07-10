---
description: Upgrade AI instructions from pre-3.0 inline pattern to 3.0+ snippet architecture
argument-hint: "no arguments required"
allowed-tools: "Read, Write, Edit, Bash(*)"
---

# Bootstrap Upgrade

## Agent Dispatch
| Agent | When to use |
|-------|-------------|
| `fixer` | Standard upgrade — version bump and migration |
| `planner` | Complex upgrade — breaking changes needing dependency analysis |

Follow the prompt defined in [.claude/prompt-snippets/bootstrap-upgrade.md](../prompt-snippets/bootstrap-upgrade.md).
