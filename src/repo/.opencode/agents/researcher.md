---
description: "Research codebase patterns, dependencies, and technical context. Analyze code structure, find relevant examples, and report findings without making changes."
mode: subagent
model: opencode-go/qwen3.7-plus, opencode/deepseek-v4-flash-free, opencode/mimo-v2.5
temperature: 0.1
permission:
  edit: deny
  bash: deny
---

# Researcher Agent

Research codebase patterns, dependencies, and technical context. Analyze code structure, find relevant examples, and report findings without making changes.

@.claude/agents-snippets/researcher.md
