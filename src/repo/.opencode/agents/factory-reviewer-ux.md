---
description: "Review a factory job's feature at its build location for flows, states, copy, accessibility, and mobile, without signing in or writing to real services. Dispatched by the factory orchestrator."
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

# Factory Reviewer (UX) Agent

Review a factory job's feature at its build location for flows, states, copy, accessibility, and mobile, without signing in or writing to real services.

@.claude/agents-snippets/factory-reviewer-ux.md
