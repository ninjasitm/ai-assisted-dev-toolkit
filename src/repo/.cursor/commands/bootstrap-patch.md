---
description: Patch AI instructions by fetching updates from the toolkit repo and applying new/updated/missing guidance
argument-hint: "optional patch options"
---

# Bootstrap Patch

## Agent Dispatch

| Agent | When to use |
|-------|-------------|
| `fixer` | Standard patch — incremental changes to existing config |
| `reviewer` | Independent read-only review before approval and after apply |

Patch AI instructions by comparing against the latest templates and applying updates.

**CRITICAL: READ:** [.claude/prompt-snippets/bootstrap-patch.md](../../.claude/prompt-snippets/bootstrap-patch.md)
