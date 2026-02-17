# Copilot Instructions — {{PROJECT_NAME}}

## Project Overview

- **Framework:** {{FRAMEWORK}}
- **Language:** {{LANGUAGE}}
- **Styling:** {{STYLING}}
- Entry point: {{ENTRY_POINT}}

## Instruction Sources

Detailed standards are organized into focused instruction files. Copilot will automatically load these based on the `applyTo` patterns:

| Instruction File                   | Description                                     |
| ---------------------------------- | ----------------------------------------------- |
| `agent-conduct.instructions.md`    | Agent conduct rules, clarification protocols    |
| `project-context.instructions.md`  | Project architecture and data flow              |
| `coding-standards.instructions.md` | Coding standards, patterns, and conventions     |
| `patterns.instructions.md`         | State management, API, and component patterns   |
| `workflows.instructions.md`        | Development commands and environment setup      |
| `testing.instructions.md`          | Testing standards, commands, and conventions    |
| `deployment.instructions.md`       | Deployment configuration and commands           |
| `logging.instructions.md`          | Structured logging standards and best practices |
| `documentation.instructions.md`    | Feature and fix documentation standards         |

## Context Sources

- [AGENTS.md](../AGENTS.md) - AI agent context and project overview
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
