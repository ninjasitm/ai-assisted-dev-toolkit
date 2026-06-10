---
applyTo: "**/*"
description: "Logging standards and best practices for {{PROJECT_NAME}}"
---

# Logging Standards

Follow the rules defined in [.claude/rules-snippets/logging.md](../../.claude/rules-snippets/logging.md).

Key points:
- Use bracketed structured tags: `[ComponentName] [operationContext]: action | details`; match severity to log levels (error, warn, info, debug).
- Never log sensitive data (passwords, tokens, PII, credit cards); sanitize before logging and use conditional logging in hot paths.
- Include full error context (stack traces, request IDs, user IDs) and use correlation IDs for request tracing in production.
