---
description: "Write minimal code to make failing tests pass. Part of the TDD red-green-refactor cycle."
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

# Green Agent (TDD — Make Tests Pass)

Write minimal code to make failing tests pass. Part of the TDD red-green-refactor cycle.

@.claude/agents-snippets/green.md
