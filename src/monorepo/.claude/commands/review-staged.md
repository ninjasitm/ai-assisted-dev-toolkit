---
description: Review currently staged files before committing
allowed-tools: "Read, Grep, Bash(git:*)"
argument-hint: "no arguments required"
---

# Review Staged Files

## Agent Dispatch
| Agent | When to use |
|-------|-------------|
| `reviewer` | Standard pre-commit review — correctness, style, patterns |
| `oracle` | Complex staged change — trade-offs, security, scalability |

Follow the prompt defined in [.claude/prompt-snippets/review-staged.md](../prompt-snippets/review-staged.md).
