# AGENTS.md - {{PROJECT_NAME}}

**Language:** {{LANGUAGE}}
**Framework:** {{FRAMEWORK}}
**Package Manager:** {{PACKAGE_MANAGER}}
**Deploy:** {{DEPLOY_PLATFORM}} | **Dev:** localhost:{{DEV_PORT}}

## Overview

{{PROJECT_DESCRIPTION}}

## Structure

```
{{PROJECT_NAME}}/
{{PROJECT_STRUCTURE}}
```

## Tech Stack

**Core:** {{LANGUAGE}}, {{FRAMEWORK}}
**Database:** {{DATABASE}}
**Testing:** {{TEST_FRAMEWORK}}
**Build:** {{BUILD_TOOL}}

## Agent Conduct & Interaction Rules

### Clarification & Assumption Handling

**CRITICAL**: Before making assumptions or proceeding with ambiguous requirements, agents MUST proactively ask the user for clarification. This applies to:

- **Ambiguous requirements**: If a task description is vague, incomplete, or could be interpreted multiple ways, ask the user to clarify before proceeding.
- **Architecture decisions**: When multiple valid approaches exist (e.g., adding a new service vs. extending an existing one), present options and ask for the user's preference.
- **Data model changes**: Before adding/modifying database columns, relationships, or entities, confirm the intended schema with the user.
- **Breaking changes**: If an implementation could break existing functionality, API contracts, or database compatibility, flag it and ask before proceeding.
- **Scope uncertainty**: If unsure whether a feature should be minimal (MVP) or comprehensive, ask about the desired scope.
- **External dependencies**: When a task requires secrets, third-party services, or infrastructure not yet configured, ask the user before assuming.
- **Domain-specific decisions**: Sensitive UX choices or domain-specific behavior should be confirmed with the user first.

### How to Ask for Clarification

- Be specific about what is unclear and why it matters
- Offer 2-3 concrete options when possible (with a recommended default)
- Explain the trade-offs of each option briefly
- If there is a clearly best practice, recommend it but still confirm

**Example:**

> "This endpoint could return paginated results or the full list. Given the expected data volume, I'd recommend pagination with a default page size of 20. Should I proceed with that approach, or do you prefer returning all results?"

### Guardrails

- **Never silently change** database schemas, API contracts, or auth flows without confirmation
- **Never assume scope** — if a task says "add search," ask whether it means basic text search, full-text search, or filter/facet search
- **Never skip tests** for assumed-correct behavior — confirm expectations first
- **Prefer reversible changes** when acting without full clarity

> **Full details:** See `.github/instructions/agent-conduct.instructions.md`

## Detailed Instructions

Detailed standards are split into focused instruction files in `.github/instructions/`:

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

## Skills

For detailed standards on specific topics, refer to these skills in `.agents/skills/`:

| Skill               | File                                      | Purpose                                                 |
| ------------------- | ----------------------------------------- | ------------------------------------------------------- |
| **TDD**             | `test-driven-development/SKILL.md`        | Test-driven development with red-green-refactor         |
| **Debugging**       | `systematic-debugging/SKILL.md`           | Structured debugging methodology                        |
| **Verification**    | `verification-before-completion/SKILL.md` | Quality checks before claiming work done                |
| **Writing Plans**   | `writing-plans/SKILL.md`                  | Feature planning and specifications                     |
| **Executing Plans** | `executing-plans/SKILL.md`                | Following through on implementation plans               |
| **Code Review**     | `requesting-code-review/SKILL.md`         | Review process and checklists                           |
| **Review Feedback** | `receiving-code-review/SKILL.md`          | Responding constructively to review feedback            |
| **Brainstorming**   | `brainstorming/SKILL.md`                  | Structured ideation sessions                            |
| **Writing Skills**  | `writing-skills/SKILL.md`                 | Creating effective SKILL.md files                       |
| **Superpowers**     | `using-superpowers/SKILL.md`              | Leveraging the full skill system                        |
| **Git Worktrees**   | `using-git-worktrees/SKILL.md`            | Parallel development branches                           |
| **Parallel Agents** | `dispatching-parallel-agents/SKILL.md`    | Coordinating multiple AI agents                         |
| **Subagent Dev**    | `subagent-driven-development/SKILL.md`    | Breaking tasks into subagent chunks                     |
| **Branch Finish**   | `finishing-a-development-branch/SKILL.md` | Completing and merging branches                         |
| **Logging**         | `logging/SKILL.md`                        | Structured logging standards, log levels, observability |
| **Documentation**   | `project-documentation/SKILL.md`          | README, comments, ADRs, changelogs                      |

## Preferred Workflow: Orchestrator + Subagents

**Use a coordinator agent (orchestrator) as the default approach for non-trivial work.** Coordinators break complex tasks into focused subtasks and dispatch specialized subagents, each with context isolation and domain expertise.

### When to use orchestrator + subagents

- Features spanning multiple files or domains
- Tasks requiring planning → implementation → review cycles
- Work that benefits from domain specialization (backend, frontend, API)
- Any task with 2+ independent subtasks

### When to use a single agent directly

- Quick one-file fixes or small edits
- Research questions that don't require code changes
- Ad-hoc code reviews (invoke Reviewer directly)
- Simple documentation updates

### How to invoke

- "Use the Feature Builder agent to implement this feature" → Coordinator orchestrates full lifecycle
- "Run the TDD agent for this requirement" → TDD coordinator manages red-green-refactor
- "Use the Backend Architect to design the database schema" → Domain specialist works directly
- "Review my recent changes" → Reviewer works directly on git diff

## Custom Agents (Subagents)

Custom agents enable **context-isolated delegation** — a coordinator agent breaks complex tasks into subtasks and dispatches specialized subagents, each with their own tools and focus.

### Available Agents

Agent definitions live in `.github/agents/` (GitHub Copilot) and `.cursor/agents/` (Cursor):

#### Coordinators

Coordinators orchestrate workflows by dispatching worker and specialist agents.

| Agent               | Tools                     | Agents                                                                                                                      | Purpose                                      |
| ------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **Feature Builder** | agent, edit, search, read | Planner, Implementer, Reviewer, Researcher, Backend Architect, Frontend Developer, API Specialist, Admin Portal, Documenter | End-to-end feature development orchestration |
| **TDD**             | agent, edit, search, read | Red, Green, Refactor                                                                                                        | Red-green-refactor cycle coordination        |

#### Domain Specialists

Specialists have deep expertise in a specific domain. They can be invoked directly or dispatched by coordinators.

| Agent                  | Tools                        | Purpose                                                 |
| ---------------------- | ---------------------------- | ------------------------------------------------------- |
| **Backend Architect**  | read, search, edit, terminal | API design, databases, system architecture, security    |
| **Frontend Developer** | read, search, edit, terminal | UI components, state management, responsive design      |
| **API Specialist**     | read, search, edit, terminal | API contracts, documentation, versioning, integration   |
| **Admin Portal**       | read, search, edit, terminal | RBAC, dashboards, reporting, analytics, monitoring      |
| **Documenter**         | read, search, edit, terminal | AGENTS.md, README, API docs, architecture documentation |
| **Reviewer**           | read, search, terminal       | Multi-perspective code review (also usable directly)    |

#### Process Workers

Workers are dispatched by coordinators and are not directly user-invocable.

| Agent           | Tools                        | Purpose                                       |
| --------------- | ---------------------------- | --------------------------------------------- |
| **Planner**     | read, search                 | Break down features into implementation tasks |
| **Implementer** | read, search, edit, terminal | Write production code following TDD           |
| **Researcher**  | read, search                 | Codebase analysis without changes             |
| **Red**         | read, search, edit, terminal | Write failing tests (TDD red phase)           |
| **Green**       | read, search, edit, terminal | Write minimal code to pass tests (TDD green)  |
| **Refactor**    | read, search, edit, terminal | Improve code quality, keep tests green        |

### Orchestration Patterns

**Coordinator → Specialist/Worker**: Feature Builder dispatches domain specialists (Backend Architect, Frontend Developer, etc.) based on the task domain, and process workers (Planner, Reviewer, Researcher) for workflow stages.

**Domain Matching**: Choose the specialist whose expertise matches the task:

- Backend changes → Backend Architect
- UI changes → Frontend Developer
- API contracts/docs → API Specialist
- Admin dashboards, RBAC, reporting, monitoring → Admin Portal
- General implementation → Implementer

**Sequential**: Tasks with dependencies are implemented one at a time.
**Parallel**: Independent tasks can be dispatched to multiple subagents simultaneously.

### Invoking Subagents

Subagents are typically **agent-initiated** — the coordinator decides when to delegate. You can also hint:

- "Use the Feature Builder agent to implement this feature"
- "Run the TDD agent for this requirement"
- "Use the Backend Architect to design the database schema"
- "Use the Documenter to update the project documentation"
- "Use a subagent to research how authentication works in this codebase"

> **Docs:** [VS Code Subagents](https://code.visualstudio.com/docs/copilot/agents/subagents) · [Cursor Subagents](https://cursor.com/docs/subagents)

## Contributing

**Standards:** Follow {{FRAMEWORK}} and {{LANGUAGE}} best practices
**Process:** Feature branch → tests → lint → build → PR

## Related Documentation

- [README.md](README.md) - Project overview
- [docs/](docs/) - Detailed documentation
- [.cursor/rules/](.cursor/rules/) - Cursor IDE rules
- [.cursor/agents/](.cursor/agents/) - Cursor custom agents
- [.github/instructions/](.github/instructions/) - Copilot instruction files
- [.github/agents/](.github/agents/) - Copilot custom agents
