---
description: "Coordinate end-to-end feature development using subagents for planning, implementation, and review. Orchestrates the full development lifecycle."
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

# Feature Builder — Coordinator

Coordinate end-to-end feature development using subagents for planning, implementation, and review.

@.claude/agents-snippets/feature-builder.md
