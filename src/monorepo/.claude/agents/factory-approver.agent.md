---
name: "factory-approver"
description: "Decide whether a factory job is approved for merge or escalated to a human, checking history, final diff, a spot-checked criterion, a dry-run merge, and escalation triggers. Dispatched by the factory orchestrator."
tools: ["Read", "Grep", "Glob", "Write", "Bash(*)"]
user-invocable: true
---

# Factory Approver Agent

Decide whether a factory job is approved for merge or escalated to a human.

**CRITICAL: READ:** [.claude/agents-snippets/factory-approver.md](../agents-snippets/factory-approver.md)
