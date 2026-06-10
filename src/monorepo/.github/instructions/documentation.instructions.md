---
applyTo: "**/*"
description: "Monorepo documentation standards for features and fixes"
---

# Monorepo Documentation Guidelines

Follow the rules defined in [.claude/rules-snippets/documentation.md](../../.claude/rules-snippets/documentation.md).

Key points:
- **Distributed strategy** — App-specific docs live in `apps/{app}/docs/`; root `docs/` is only for monorepo-wide concerns (ADRs, CI/CD, cross-app integration).
- **Docs app sync required** — Every commit that changes user-facing behavior must update `apps/{{DOCS_APP}}/content/` before committing.
- **Pre-commit gate** — Documentation MUST be written or updated BEFORE committing code. Features need spec + plan; fixes go in monthly logs; breaking changes update CHANGELOG.md.
- **No individual fix files for simple bugs** — Use `apps/{app}/docs/fixes/{YYYY-MM}.md` monthly logs instead.
