---
applyTo: "**/*"
description: "Deployment configuration for the {{PROJECT_NAME}} monorepo."
---

# Deployment

Follow the rules defined in [.claude/rules-snippets/deployment.md](../../.claude/rules-snippets/deployment.md).

Key points:
- Each app has its own deploy platform and command; environment variables are configured per-app and at root level.
- CI/CD workflows must install, build, test, and lint across the full workspace.
- **Pre-deployment checklist**: All tests pass, linting passes, builds complete, env vars configured, migrations applied, shared package changes tested in all consuming apps.
