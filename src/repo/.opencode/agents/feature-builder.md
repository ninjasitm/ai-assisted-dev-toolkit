---
description: "Coordinate end-to-end feature development using subagents for planning, implementation, and review. Orchestrates the full development lifecycle."
mode: subagent
model: opencode-go/mimo-v2.5-pro, opencode/deepseek-v4-flash-free, opencode-go/qwen3.7-max
temperature: 0.3
permission:
  edit: allow
  bash: allow
  task: allow
---

# Feature Builder — Coordinator

Coordinate end-to-end feature development using subagents for planning, implementation, and review.

@.claude/agents-snippets/feature-builder.md
