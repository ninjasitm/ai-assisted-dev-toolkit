---
paths:
  - "src/**"
  - "apps/**"
  - "packages/**"
description: "Code comments and basic logging conventions."
---

# Logging Comments

Follow the rules defined in [.claude/rules-snippets/logging-comments.md](../rules-snippets/logging-comments.md).

Key points:
- Comment complex logic and non-obvious implementations.
- Use bracketed identifiers for logs: `[ModuleName]: message`.
- Use appropriate log levels: error, warn, info, debug.
- Remove debug logs before committing to main branch.
