---
applyTo: "**/*"
description: "Development workflows for monorepo."
---

# Workflows

Follow the rules defined in [.claude/rules-snippets/workflows.md](../../.claude/rules-snippets/workflows.md).

Key points:
- **Dev**: `{{PACKAGE_MANAGER}} dev` (all apps), `--filter={{APP_NAME_1}}` (specific), `--filter={{APP_NAME_1}}...` (with dependencies).
- **Build**: `{{PACKAGE_MANAGER}} build` (all), `--filter=[origin/main]` (only changed).
- **Adding features**: Determine app/package, check `AGENTS.md`, implement, lint, test, PR with conventional commits.
- **Adding shared code**: Add to `packages/{{PACKAGE_NAME}}/src/`, export from index, add dependency to consuming apps.
