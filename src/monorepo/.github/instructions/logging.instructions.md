---
applyTo: "**/*"
description: "Monorepo logging standards and best practices"
---

# Monorepo Logging Standards

Follow the rules defined in [.claude/rules-snippets/logging.md](../../.claude/rules-snippets/logging.md).

Key points:
- **Always include app/package context**: Prefix every log with `[App:name]` or `[Pkg:name]`.
- **Use correlation IDs** to track requests across apps; log all cross-app communication.
- **Use appropriate log levels**: `error` for critical failures, `warn` for non-blocking issues, `info` for significant events, `debug` for diagnostics.
- **Never log sensitive data** (passwords, tokens, PII); sanitize before logging. Avoid logging in hot paths.
