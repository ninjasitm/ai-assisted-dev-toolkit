---
description: "Write a testable spec.md for a factory job from a feature request, after inspecting the real code. Dispatched by the factory orchestrator."
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

# Factory Spec Writer Agent

Write a testable spec.md for a factory job from a feature request, after inspecting the real code.

@.claude/agents-snippets/factory-spec-writer.md
