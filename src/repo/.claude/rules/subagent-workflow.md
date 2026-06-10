---
applyTo: "**/*"
description: "Subagent workflow and orchestration patterns."
---

# Subagent Workflow

Follow the rules defined in [.claude/rules-snippets/subagent-workflow.md](../rules-snippets/subagent-workflow.md).

Key points:
- Default to orchestrator + subagents for non-trivial work (features, refactors, multi-file fixes).
- Use a coordinator agent (Feature Builder or TDD) as the entry point.
- Match task domain to the right specialist before defaulting to Implementer.
