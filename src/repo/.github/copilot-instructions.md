# Copilot Instructions — {{PROJECT_NAME}}

## Project overview

- **Framework:** {{FRAMEWORK}}
- **Language:** {{LANGUAGE}}
- **Styling:** {{STYLING}}
- Entry point: {{ENTRY_POINT}}

## Architecture

- {{ARCHITECTURE_DESCRIPTION}}

## Data flow

- {{DATA_FLOW_DESCRIPTION}}

## Key directories

| Directory         | Purpose                |
| ----------------- | ---------------------- |
| `src/components/` | UI components          |
| `src/pages/`      | Page components/routes |
| `src/services/`   | API and business logic |
| `src/stores/`     | State management       |
| `src/types/`      | TypeScript definitions |

## Workflows (package.json)

- **Dev:** `{{PACKAGE_MANAGER}} run dev` (starts on port {{DEV_PORT}})
- **Build:** `{{PACKAGE_MANAGER}} run build`
- **Test:** `{{PACKAGE_MANAGER}} run test`
- **Lint:** `{{PACKAGE_MANAGER}} run lint`

## Environment variables

| Variable        | Purpose            |
| --------------- | ------------------ |
| `{{ENV_VAR_1}}` | {{ENV_VAR_1_DESC}} |
| `{{ENV_VAR_2}}` | {{ENV_VAR_2_DESC}} |

## Other instruction sources

- [AGENTS.md](../AGENTS.md) - AI agent context
- [README.md](../README.md) - Project documentation
- [.cursor/rules/](../.cursor/rules/) - Cursor IDE rules
