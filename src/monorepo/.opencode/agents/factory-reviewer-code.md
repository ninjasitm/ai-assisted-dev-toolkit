---
description: "Review a factory job's branch for correctness, simplicity, reuse, conventions, and docs, and run the project's checks. Dispatched by the factory orchestrator."
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

# Factory Reviewer (Code) Agent

Review a factory job's branch for correctness, simplicity, reuse, conventions, and docs, and run the project's checks.

@.claude/agents-snippets/factory-reviewer-code.md
