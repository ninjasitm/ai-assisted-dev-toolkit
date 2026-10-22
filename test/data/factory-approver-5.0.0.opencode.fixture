---
description: "Decide whether a factory job is approved for merge or escalated to a human, checking history, final diff, a spot-checked criterion, a dry-run merge, and escalation triggers. Dispatched by the factory orchestrator."
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

# Factory Approver Agent

Decide whether a factory job is approved for merge or escalated to a human.

@.claude/agents-snippets/factory-approver.md
