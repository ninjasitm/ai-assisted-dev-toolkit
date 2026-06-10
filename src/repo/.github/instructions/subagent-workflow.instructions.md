---
applyTo: "**/*"
description: "Subagent workflow patterns and orchestrator-first approach. Loaded when working with multi-step tasks, feature development, or agent delegation."
---

# Subagent Workflow

Follow the rules defined in [.claude/rules-snippets/subagent-workflow.md](../../.claude/rules-snippets/subagent-workflow.md).

Key points:
- Default to orchestrator-first for non-trivial work (2+ of research, planning, implementation, testing, review); use single agent only for focused single-file tasks.
- Run parallelization analysis before dispatching: build dependency graph, apply independence test, group by domain, and dispatch accordingly.
- Every implementation must pass Reviewer before proceeding; coordinators should not skip review even for "simple" changes.
