---
description: Patch AI instructions by fetching updates from the toolkit repo and applying new/updated/missing guidance
allowed-tools: "Read, Write, Edit, Bash(*)"
argument-hint: "optional patch options"
---

# Patch AI Instructions

## Agent Dispatch
| Agent | When to use |
|-------|-------------|
| `fixer` | Standard patch — incremental changes to existing config |
| `planner` | Complex patch — cross-cutting changes needing analysis first |

Follow the prompt defined in [.claude/prompt-snippets/bootstrap-patch.md](../prompt-snippets/bootstrap-patch.md).
