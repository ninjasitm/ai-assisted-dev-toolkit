---
applyTo: "**/*"
description: "Deployment configuration and commands for {{PROJECT_NAME}}."
---

# Deployment

## Target Platform

- **Platform:** {{DEPLOY_PLATFORM}}
- **Environment:** {{ENVIRONMENT}}

## Deploy Commands

```bash
# Deploy to {{DEPLOY_PLATFORM}}
{{DEPLOY_COMMAND}}

# Build for production
{{BUILD_COMMAND}}
```

## Environment Variables

| Variable        | Description        | Required |
| --------------- | ------------------ | -------- |
| `{{ENV_VAR_1}}` | {{ENV_VAR_1_DESC}} | Yes      |
| `{{ENV_VAR_2}}` | {{ENV_VAR_2_DESC}} | No       |

## CI/CD

```yaml
# .github/workflows/deploy.yml (or equivalent)
{ { CI_WORKFLOW_EXAMPLE } }
```

## Pre-Deployment Checklist

- [ ] All tests pass
- [ ] Linting passes
- [ ] Build completes without errors
- [ ] Environment variables configured
- [ ] Database migrations applied (if applicable)
