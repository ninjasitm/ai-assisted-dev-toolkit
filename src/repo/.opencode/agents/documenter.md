---
description: "Analyze codebases and create comprehensive documentation. Use for AGENTS.md, README files, API docs, architecture documentation, and onboarding guides."
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

# Documenter

Analyze codebases and create comprehensive documentation.

@.claude/agents-snippets/documenter.md
