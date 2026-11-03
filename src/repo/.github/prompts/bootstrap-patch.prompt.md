---
description: Patch AI instructions by fetching updates from the toolkit repo and applying new/updated/missing guidance
tools: ["read", "search", "edit", "terminal", "agent"]
argument-hint: "[--dry-run] [--category <category>]"
---

# Bootstrap Patch

## Agent Dispatch

| Agent | When to use |
|-------|-------------|
| `fixer` | Standard patch — incremental changes to existing config |
| `reviewer` | Independent read-only review before approval and after apply |

**CRITICAL: READ:** [.claude/prompt-snippets/bootstrap-patch.md](../../.claude/prompt-snippets/bootstrap-patch.md).
