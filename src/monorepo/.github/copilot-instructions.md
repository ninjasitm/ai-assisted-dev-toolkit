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

## Custom Agents (Subagents)

Specialized agents for task delegation. Coordinators orchestrate workers via subagents:

| Agent               | Type        | File                              | Purpose                                      |
| ------------------- | ----------- | --------------------------------- | -------------------------------------------- |
| **Feature Builder** | Coordinator | `agents/feature-builder.agent.md` | End-to-end feature development orchestration |
| **TDD**             | Coordinator | `agents/tdd.agent.md`             | Red-green-refactor cycle coordination        |
| **Planner**         | Worker      | `agents/planner.agent.md`         | Implementation task breakdown                |
| **Implementer**     | Worker      | `agents/implementer.agent.md`     | Production code implementation               |
| **Reviewer**        | Worker      | `agents/reviewer.agent.md`        | Multi-perspective code review                |
| **Researcher**      | Worker      | `agents/researcher.agent.md`      | Read-only codebase analysis                  |

Worker agents (`user-invocable: false`) are only accessible as subagents — they don't appear in the agents dropdown.

> **Docs:** [VS Code Subagents](https://code.visualstudio.com/docs/copilot/agents/subagents) · [Cursor Subagents](https://cursor.com/docs/subagents)

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
