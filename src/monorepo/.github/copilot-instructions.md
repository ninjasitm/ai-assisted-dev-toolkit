# Copilot Instructions — {{PROJECT_NAME}} Monorepo

## Project Overview

- **Type:** Monorepo
- **Package Manager:** {{PACKAGE_MANAGER}}
- **Apps:** `apps/{{APP_NAME_1}}/`, `apps/{{APP_NAME_2}}/`
- **Packages:** `packages/{{PACKAGE_NAME_1}}/`, `packages/{{PACKAGE_NAME_2}}/`, `packages/config/`

## Instruction Sources

Detailed standards are organized into focused instruction files. Copilot will automatically load these based on the `applyTo` patterns:

| Instruction File                   | Description                                       |
| ---------------------------------- | ------------------------------------------------- |
| `agent-conduct.instructions.md`    | Agent conduct rules, clarification protocols      |
| `project-context.instructions.md`  | Monorepo architecture and project context         |
| `coding-standards.instructions.md` | Coding standards and shared code conventions      |
| `patterns.instructions.md`         | Monorepo patterns, workspace conventions, imports |
| `workflows.instructions.md`        | Development commands and monorepo workflows       |
| `testing.instructions.md`          | Testing strategy across apps and packages         |
| `deployment.instructions.md`       | Deployment configuration per app                  |
| `logging.instructions.md`          | Monorepo logging standards and best practices     |
| `documentation.instructions.md`    | Distributed documentation strategy                |

## Context Sources

- [AGENTS.md](../AGENTS.md) - Monorepo architecture and agent conduct
- [apps/{{APP_NAME_1}}/AGENTS.md](../apps/{{APP_NAME_1}}/AGENTS.md) - App-specific patterns
- [apps/{{APP_NAME_2}}/AGENTS.md](../apps/{{APP_NAME_2}}/AGENTS.md) - App-specific patterns

## Skills References

For detailed standards on specific topics, refer to these skills:

| Topic             | Skill Location                                   | Description                                                  |
| ----------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| **Logging**       | `.agents/skills/logging/SKILL.md`                | Structured logging standards, log levels, message formatting |
| **Documentation** | `.agents/skills/project-documentation/SKILL.md`  | README standards, code comments, ADRs, changelogs            |
| **Writing Plans** | `.agents/skills/writing-plans/SKILL.md`          | Feature planning and specification                           |
| **Code Review**   | `.agents/skills/requesting-code-review/SKILL.md` | Code review process and checklists                           |
| **Debugging**     | `.agents/skills/systematic-debugging/SKILL.md`   | Systematic debugging workflows                               |

## Guidelines

- Follow monorepo conventions for task dependencies
- Use internal packages for shared code
- Run commands from monorepo root
- Reference app-specific AGENTS.md for detailed patterns
