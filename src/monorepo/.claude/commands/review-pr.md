---
description: Conduct comprehensive pull request code review
allowed-tools: "Read, Grep"
argument-hint: PR number or branch
---

# Review Pull Request

## Agent Dispatch
| Agent | When to use |
|-------|-------------|
| `reviewer` | Standard PR review — correctness, test coverage, patterns |
| `oracle` | Complex PR review — architecture, security, cross-system impact |

Follow the prompt defined in [.claude/prompt-snippets/review-pr.md](../prompt-snippets/review-pr.md).
