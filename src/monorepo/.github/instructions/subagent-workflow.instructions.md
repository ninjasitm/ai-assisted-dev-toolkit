---
applyTo: "**/*"
description: "Subagent workflow patterns and orchestrator-first approach. Loaded when working with multi-step tasks, feature development, or agent delegation."
---

# Subagent Workflow

Follow the rules defined in [.claude/rules-snippets/subagent-workflow.md](../../.claude/rules-snippets/subagent-workflow.md).

Key points:
- **Orchestration checkpoint** — If your work involves 2+ of: research, planning, implementation, testing, review, use a coordinator agent (Feature Builder, TDD) instead of single-agent execution.
- **Domain specialist selection**: Backend → Backend Architect, UI → Frontend Developer, API → API Specialist, Admin → Admin Portal, Docs → Documenter, General → Implementer.
- **Quality gates**: Every implementation must pass Reviewer before proceeding; if a reviewer requests changes, the original specialist fixes them and re-review occurs.
- **Parallelization analysis required** before dispatching: Tasks writing to different files with no shared state are parallel-safe.
