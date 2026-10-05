---
description: "Break down feature requests into implementation tasks. Read specifications, analyze codebase patterns, and produce structured plans with dependencies."
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

# Planner Agent

Break down feature requests into implementation tasks. Read specifications, analyze codebase patterns, and produce structured plans with dependencies.

@.claude/agents-snippets/planner.md
