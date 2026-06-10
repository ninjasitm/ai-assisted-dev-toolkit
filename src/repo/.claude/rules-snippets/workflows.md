---
applyTo: "**/*"
description: "Developer workflows and environment settings for {{PROJECT_NAME}}."
---

# Workflows

## Development

- **Start dev server:** `{{PACKAGE_MANAGER}} run dev` (port {{DEV_PORT}})
- **Build:** `{{PACKAGE_MANAGER}} run build`
- **Type check:** `{{PACKAGE_MANAGER}} run type-check`

## Testing

- **Unit tests:** `{{PACKAGE_MANAGER}} run test`
- **Coverage:** `{{PACKAGE_MANAGER}} run test:coverage`
- **E2E tests:** `{{PACKAGE_MANAGER}} run test:e2e`

## Code quality

- **Lint:** `{{PACKAGE_MANAGER}} run lint`
- **Format:** `{{PACKAGE_MANAGER}} run format`

## Environment variables

| Variable        | Purpose            | Required |
| --------------- | ------------------ | -------- |
| `{{ENV_VAR_1}}` | {{ENV_VAR_1_DESC}} | Yes      |
| `{{ENV_VAR_2}}` | {{ENV_VAR_2_DESC}} | No       |
