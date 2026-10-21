# Subagent Workflow

Subagent workflow and orchestration patterns.

Read and follow `.claude/rules-snippets/subagent-workflow.md` when these standards apply.

## Key points

- Default to orchestrator + subagents for non-trivial work (features, refactors, multi-file fixes).
- Use a coordinator agent (Feature Builder or TDD) as the entry point.
- Match task domain to the right specialist before defaulting to Implementer.
