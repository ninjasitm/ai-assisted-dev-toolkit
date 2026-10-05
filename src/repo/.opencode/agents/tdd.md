---
description: "Implement a feature using test-driven development with red-green-refactor cycle. Coordinates specialized subagents for writing failing tests, implementing code, and refactoring."
mode: subagent
request:
  body:
    temperature: 0.3
permissions:
  - action: edit
    resource: "*"
    effect: allow
  - action: shell
    resource: "*"
    effect: allow
  - action: subagent
    resource: "*"
    effect: allow
---

# TDD Coordinator Agent

Implement a feature using test-driven development with red-green-refactor cycle.

@.claude/agents-snippets/tdd.md
