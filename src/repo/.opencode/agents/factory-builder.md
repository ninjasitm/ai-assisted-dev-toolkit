---
description: "Build a factory job's feature inside its git worktree, following TDD, and log results in build.md. Runs in build, repair, or rework mode. Dispatched by the factory orchestrator."
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

# Factory Builder Agent

Build a factory job's feature inside its git worktree, following TDD, and log results in build.md.

@.claude/agents-snippets/factory-builder.md
