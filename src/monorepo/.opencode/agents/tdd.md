---
description: "Implement a feature using test-driven development with red-green-refactor cycle. Coordinates specialized subagents for writing failing tests, implementing code, and refactoring."
mode: subagent
model: opencode-go/mimo-v2.5-pro, opencode/deepseek-v4-flash-free, opencode-go/qwen3.7-max
temperature: 0.3
permission:
  edit: allow
  bash: allow
  task: allow
---

# TDD Coordinator Agent

Implement a feature using test-driven development with red-green-refactor cycle.

@.claude/agents-snippets/tdd.md
