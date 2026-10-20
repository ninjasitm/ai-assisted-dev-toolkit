---
description: "Audit a factory job's branch diff for security problems in a fresh context. Dispatched by the factory orchestrator."
mode: subagent
request:
  body:
    temperature: 0.1
permissions:
  - action: edit
    resource: "*"
    effect: allow
  - action: shell
    resource: "*"
    effect: allow
---

# Factory Reviewer (Security) Agent

Audit a factory job's branch diff for security problems in a fresh context.

@.claude/agents-snippets/factory-reviewer-security.md
