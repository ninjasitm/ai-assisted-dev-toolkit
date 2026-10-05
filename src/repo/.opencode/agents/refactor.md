---
description: "Improve code quality and structure while keeping all tests passing. Part of the TDD red-green-refactor cycle."
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

# Refactor Agent (TDD — Improve Code Quality)

Improve code quality and structure while keeping all tests passing. Part of the TDD red-green-refactor cycle.

@.claude/agents-snippets/refactor.md
