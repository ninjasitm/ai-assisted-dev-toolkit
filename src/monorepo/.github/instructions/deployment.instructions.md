---
applyTo: "**/*"
description: "Deployment configuration for the {{PROJECT_NAME}} monorepo."
---

# Deployment

## Apps

| App              | Platform                  | Command                    |
| ---------------- | ------------------------- | -------------------------- |
| `{{APP_NAME_1}}` | {{APP_1_DEPLOY_PLATFORM}} | `{{APP_1_DEPLOY_COMMAND}}` |
| `{{APP_NAME_2}}` | {{APP_2_DEPLOY_PLATFORM}} | `{{APP_2_DEPLOY_COMMAND}}` |

## Environment Variables

### Root Level

```bash
# .env (shared)
{{ENVIRONMENT}}={{ENVIRONMENT_VALUE}}
```

### Per-App

```bash
# {{APP_DIR}}/{{APP_NAME_1}}/.env.local
{{APP_1_ENV_EXAMPLE}}

# {{APP_DIR}}/{{APP_NAME_2}}/.env.local
{{APP_2_ENV_EXAMPLE}}
```

## CI/CD

```yaml
# .github/workflows/ci.yml (or equivalent)
{ { CI_WORKFLOW_EXAMPLE } }
```

## Pre-Deployment Checklist

- [ ] All tests pass across workspace
- [ ] Linting passes
- [ ] Build completes for all affected apps
- [ ] Environment variables configured per app
- [ ] Database migrations applied (if applicable)
- [ ] Shared package changes tested in all consuming apps
