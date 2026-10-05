---
description: "Write failing tests that define expected behavior. Part of the TDD red-green-refactor cycle."
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

# Red Agent (TDD — Write Failing Tests)

Write failing tests that define expected behavior. Part of the TDD red-green-refactor cycle.

@.claude/agents-snippets/red.md
