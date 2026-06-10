---
applyTo: "src/**"
description: "Structured logging standards and best practices."
---

# Logging Standards

Follow the rules defined in [.claude/rules-snippets/logging.md](../rules-snippets/logging.md).

Key points:
- Use bracketed tags: `[Source] [Context]: Message | Details`.
- Use appropriate log levels: error, warn, info, debug.
- Never log passwords, API keys, tokens, or PII — sanitize before logging.
