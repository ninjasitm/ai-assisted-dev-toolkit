---
applyTo: "**/*"
description: "Monorepo architecture and project context."
---

# Project Architecture

Follow the rules defined in [.claude/rules-snippets/project-context.md](../../.claude/rules-snippets/project-context.md).

Key points:
- This is a **monorepo** with `apps/` (deployable applications) and `packages/` (shared internal packages).
- Cross-package imports use the `@{{PROJECT_NAME}}/` scope; internal app imports use `@/` or `~/`.
- Context files: Root `AGENTS.md` for monorepo-level context, `apps/*/AGENTS.md` for app-specific patterns, `packages/*/README.md` for package docs.
