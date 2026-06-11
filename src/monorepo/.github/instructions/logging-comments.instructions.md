---
applyTo: "**/*"
description: "Logging and code comment standards for the {{PROJECT_NAME}} monorepo."
---

# Logging & Comments

Follow the rules defined in [.claude/rules-snippets/logging-comments.md](../../.claude/rules-snippets/logging-comments.md).

Key points:
- Comment complex logic and non-obvious implementations.
- Use bracketed identifiers for logs: `[ModuleName]: message`; include app/package context in monorepo logs.
- Use appropriate log levels: error, warn, info, debug.
- Remove debug logs before committing to main branch.
