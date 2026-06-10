---
description: "Analyze codebases and create comprehensive documentation. Use for AGENTS.md, README files, API docs, architecture documentation, and onboarding guides."
mode: subagent
model: opencode-go/qwen3.7-plus, opencode/deepseek-v4-flash-free, opencode/mimo-v2.5
temperature: 0.1
permission:
  edit: deny
  bash: deny
---

# Documenter

Analyze codebases and create comprehensive documentation.

@.claude/agents-snippets/documenter.md
