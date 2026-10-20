---
description: "Review a factory job's feature at its build location for design-system consistency, spacing, typography, contrast, and responsive layout, without signing in or writing to real services. Dispatched by the factory orchestrator."
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

# Factory Reviewer (UI) Agent

Review a factory job's feature at its build location for design-system consistency, spacing, typography, contrast, and responsive layout, without signing in or writing to real services.

@.claude/agents-snippets/factory-reviewer-ui.md
