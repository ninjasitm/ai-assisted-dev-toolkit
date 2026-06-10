---
applyTo: "**/*"
description: "Subagent workflow and orchestration patterns."
---

# Subagent Workflow

Follow the rules defined in [.claude/rules-snippets/subagent-workflow.md](../rules-snippets/subagent-workflow.md).

Key points:
- Use orchestrator-first flow for tasks involving 2+ of research, planning, implementation, testing, or review.
- Default to coordinator agents (Feature Builder or TDD) as entry points for non-trivial work.
- Match task domain to the right specialist before defaulting to Implementer.
- Always run Reviewer after implementation, before marking work complete.
