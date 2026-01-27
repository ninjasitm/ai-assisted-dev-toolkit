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

## Skills References

For detailed standards on specific topics, refer to these skills:

| Topic             | Skill Location                                    | Description                                                  |
| ----------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| **Logging**       | `.agents/skills/logging/SKILL.md`                 | Structured logging standards, log levels, message formatting |
| **Documentation** | `.agents/skills/project-documentation/SKILL.md`   | README standards, code comments, ADRs, changelogs            |
| **Writing Plans** | `.agents/skills/writing-plans/SKILL.md`           | Feature planning and specification                           |
| **Code Review**   | `.agents/skills/requesting-code-review/SKILL.md`  | Code review process and checklists                           |
| **Debugging**     | `.agents/skills/systematic-debugging/SKILL.md`    | Systematic debugging workflows                               |
| **TDD**           | `.agents/skills/test-driven-development/SKILL.md` | Test-driven development practices                            |
