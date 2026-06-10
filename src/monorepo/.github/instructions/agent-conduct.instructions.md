---
applyTo: "**/*"
description: "Agent conduct rules, clarification protocols, and assumption handling."
---

# Agent Conduct & Interaction Rules

Follow the rules defined in [.claude/rules-snippets/agent-conduct.md](../../.claude/rules-snippets/agent-conduct.md).

Key points:
- **Orchestration checkpoint first** — Before ANY multi-step task (2+ of: research, planning, implementation, testing, review), read the orchestration checkpoint in AGENTS.md and use coordinator agents.
- **Ask before assuming** — Clarify ambiguous requirements, architecture decisions, data model changes, and breaking changes before proceeding.
- **Monorepo guardrails** — Never silently change database schemas, API contracts, or auth flows. Never modify shared packages without considering downstream consumers.
- **Prefer reversible changes** when acting without full clarity.
