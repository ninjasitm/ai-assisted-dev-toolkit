---
description: "Implement a feature using test-driven development with red-green-refactor cycle. Coordinates specialized subagents for writing failing tests, implementing code, and refactoring."
mode: subagent
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

Read and follow `.claude/agents-snippets/tdd.md` before performing this role.
