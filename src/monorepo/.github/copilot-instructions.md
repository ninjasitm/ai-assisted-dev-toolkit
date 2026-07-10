# Copilot Instructions — {{PROJECT_NAME}} Monorepo

## Project Overview

- **Type:** Monorepo
- **Package Manager:** {{PACKAGE_MANAGER}}
- **Apps:** `apps/{{APP_NAME_1}}/`, `apps/{{APP_NAME_2}}/`
- **Packages:** `packages/{{PACKAGE_NAME_1}}/`, `packages/{{PACKAGE_NAME_2}}/`, `packages/config/`

## Orientation to recent work

The [orient-to-recent-work](../.agents/skills/orient-to-recent-work/SKILL.md) skill (auto-loaded) orients you to recent project activity before any non-trivial task: CHANGELOG Unreleased, recent commits, recent decisions. Skip for trivial fixes: typos, version bumps, isolated docs updates, mechanical refactors with a known target.

## Instruction Sources

Detailed standards are organized into focused instruction files. Copilot will automatically load these based on the `applyTo` patterns:

| Instruction File                    | Description                                       |
| ----------------------------------- | ------------------------------------------------- |
| `agent-conduct.instructions.md`     | Agent conduct rules, clarification protocols      |
| `project-context.instructions.md`   | Monorepo architecture and project context         |
| `coding-standards.instructions.md`  | Coding standards and shared code conventions      |
| `patterns.instructions.md`          | Monorepo patterns, workspace conventions, imports |
| `workflows.instructions.md`         | Development commands and monorepo workflows       |
| `testing.instructions.md`           | Testing strategy across apps and packages         |
| `deployment.instructions.md`        | Deployment configuration per app                  |
| `logging.instructions.md`           | Monorepo logging standards and best practices     |
| `documentation.instructions.md`     | Distributed documentation strategy                |
| `subagent-workflow.instructions.md` | Orchestrator-first patterns and agent delegation  |

## Context Sources

- [AGENTS.md](../AGENTS.md) - Monorepo architecture and agent conduct
- [apps/{{APP_NAME_1}}/AGENTS.md](../apps/{{APP_NAME_1}}/AGENTS.md) - App-specific patterns
- [apps/{{APP_NAME_2}}/AGENTS.md](../apps/{{APP_NAME_2}}/AGENTS.md) - App-specific patterns

## Ponytail, lazy senior dev mode

See [.claude/rules-snippets/ponytail.md](../../.claude/rules-snippets/ponytail.md) for the full rule content.

## Preferred Workflow: Orchestrator + Subagents

**Default to using a coordinator agent for non-trivial work.** For details, see `subagent-workflow.instructions.md`.

### Coordinators

| Agent               | File                              | Purpose                                      |
| ------------------- | --------------------------------- | -------------------------------------------- |
| **Feature Builder** | `agents/feature-builder.agent.md` | End-to-end feature development orchestration |
| **TDD**             | `agents/tdd.agent.md`             | Red-green-refactor cycle coordination        |

### Domain Specialists (user-invocable)

| Agent                  | File                                 | Purpose                                 |
| ---------------------- | ------------------------------------ | --------------------------------------- |
| **Backend Architect**  | `agents/backend-architect.agent.md`  | API design, databases, system arch      |
| **Frontend Developer** | `agents/frontend-developer.agent.md` | UI components, state, responsive design |
| **API Specialist**     | `agents/api-specialist.agent.md`     | API contracts, docs, versioning         |
| **Admin Portal**       | `agents/admin-portal.agent.md`       | RBAC, dashboards, reporting, monitoring |
| **Documenter**         | `agents/documenter.agent.md`         | AGENTS.md, README, API docs             |
| **Reviewer**           | `agents/reviewer.agent.md`           | Multi-perspective code review           |

### Process Workers (subagent-only)

| Agent           | File                          | Purpose                                |
| --------------- | ----------------------------- | -------------------------------------- |
| **Planner**     | `agents/planner.agent.md`     | Implementation task breakdown          |
| **Implementer** | `agents/implementer.agent.md` | Production code implementation         |
| **Researcher**  | `agents/researcher.agent.md`  | Read-only codebase analysis            |
| **Red**         | `agents/red.agent.md`         | Write failing tests (TDD red phase)    |
| **Green**       | `agents/green.agent.md`       | Make tests pass (TDD green phase)      |
| **Refactor**    | `agents/refactor.agent.md`    | Improve code quality, keep tests green |

Process workers (`user-invocable: false`) are only accessible as subagents — they don't appear in the agents dropdown.

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
