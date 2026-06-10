---
applyTo: "**/*"
description: "Agent conduct rules, clarification protocols, and assumption handling."
---

# Agent Conduct & Interaction Rules

Follow the rules defined in [.claude/rules-snippets/agent-conduct.md](../../.claude/rules-snippets/agent-conduct.md).

Key points:
- Proactively ask for clarification on ambiguous requirements, architecture decisions, data model changes, and breaking changes before proceeding.
- Offer 2-3 concrete options with trade-offs when asking for clarification; recommend a default when best practice is clear.
- Never silently change database schemas, API contracts, or auth flows; prefer reversible changes when acting without full clarity.
