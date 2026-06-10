---
applyTo: "**/*"
description: "Deployment configuration and commands for {{PROJECT_NAME}}."
---

# Deployment

Follow the rules defined in [.claude/rules-snippets/deployment.md](../../.claude/rules-snippets/deployment.md).

Key points:
- Deploy to {{DEPLOY_PLATFORM}} using `{{DEPLOY_COMMAND}}`; build for production with `{{BUILD_COMMAND}}`.
- Configure required environment variables ({{ENV_VAR_1}}, {{ENV_VAR_2}}) before deployment.
- Pre-deployment: all tests pass, linting passes, build completes without errors, and database migrations applied.
