---
description: "Implement code changes for a specific task. Follow TDD, write tests alongside code, and self-review before reporting completion."
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

# Implementer Agent

Implement code changes for a specific task. Follow TDD, write tests alongside code, and self-review before reporting completion.

@.claude/agents-snippets/implementer.md
