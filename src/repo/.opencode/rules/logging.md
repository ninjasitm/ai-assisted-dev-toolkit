# Logging Standards

Structured logging standards and best practices.

Read and follow `.claude/rules-snippets/logging.md` when these standards apply.

## Key points

- Use bracketed tags: `[Source] [Context]: Message | Details`.
- Use appropriate log levels: error, warn, info, debug.
- Never log passwords, API keys, tokens, or PII — sanitize before logging.
