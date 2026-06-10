# Logging Standards

Structured logging standards and best practices.

@.claude/rules-snippets/logging.md

## Key points

- Include app or package context in all log messages: `[App:Name]` or `[Pkg:Name]`.
- Use appropriate log levels: error, warn, info, debug.
- Never log passwords, API keys, tokens, or PII — sanitize before logging.
