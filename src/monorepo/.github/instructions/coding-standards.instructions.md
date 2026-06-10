---
applyTo: "**/*"
description: "Coding standards and conventions for the {{PROJECT_NAME}} monorepo."
---

# Coding Standards

Follow the rules defined in [.claude/rules-snippets/coding-standards.md](../../.claude/rules-snippets/coding-standards.md).

Key points:
- Follow {{LANGUAGE}} best practices across all apps and packages; run `{{LINT_COMMAND}}` and `{{CHECK_TYPES_COMMAND}}` before committing.
- **SRP and reuse-first principle** — Review existing shared packages before implementing new functionality; prefer extending over duplicating.
- Every shared package must have a clean public API with explicit exports.
