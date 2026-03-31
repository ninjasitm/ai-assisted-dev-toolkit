# AGENTS.md - {{PROJECT_NAME}} Monorepo

**Type:** Monorepo
**Language:** {{LANGUAGE}}
**Build System:** {{BUILD_SYSTEM}}
**Package Manager:** {{PACKAGE_MANAGER}}

## Overview

{{PROJECT_DESCRIPTION}}

## Structure

```
{{PROJECT_STRUCTURE}}
```

## Tech Stack

### Shared

- **Build System:** {{BUILD_SYSTEM}}
- **Package Manager:** {{PACKAGE_MANAGER}}
- **Language:** {{LANGUAGE}}
- **Linting:** {{LINTER}}
- **Testing:** {{TEST_FRAMEWORK}}

### Apps

| App              | Framework           | Purpose               |
| ---------------- | ------------------- | --------------------- |
| `{{APP_NAME_1}}` | {{APP_1_FRAMEWORK}} | {{APP_1_DESCRIPTION}} |
| `{{APP_NAME_2}}` | {{APP_2_FRAMEWORK}} | {{APP_2_DESCRIPTION}} |

### Packages/Libraries

| Package                                | Purpose                   |
| -------------------------------------- | ------------------------- |
| `{{PACKAGE_SCOPE}}/{{PACKAGE_NAME_1}}` | {{PACKAGE_1_DESCRIPTION}} |
| `{{PACKAGE_SCOPE}}/{{PACKAGE_NAME_2}}` | {{PACKAGE_2_DESCRIPTION}} |
| `{{PACKAGE_SCOPE}}/config`             | Shared configuration      |

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
- **Cross-app impact**: When changes in one app or shared package could affect other apps in the monorepo, flag the potential impact and confirm.

### How to Ask for Clarification

- Be specific about what is unclear and why it matters
- Offer 2-3 concrete options when possible (with a recommended default)
- Explain the trade-offs of each option briefly
- If there is a clearly best practice, recommend it but still confirm

**Example:**

> "This endpoint could return paginated results or the full list. Given the expected data volume, I'd recommend pagination with a default page size of 20. Should I proceed with that approach, or do you prefer returning all results?"

**Monorepo-Specific Example:**

> "This utility function could live in the existing `@{{PROJECT_NAME}}/utils` package or in a new dedicated package. Since it's only used by {{APP_NAME_1}} right now, I'd recommend adding it to utils and extracting later if needed. Should I proceed, or would you prefer a new package?"

### Guardrails

- **Never silently change** database schemas, API contracts, or auth flows without confirmation
- **Never assume scope** — if a task says "add search," ask whether it means basic text search, full-text search, or filter/facet search
- **Never skip tests** for assumed-correct behavior — confirm expectations first
- **Prefer reversible changes** when acting without full clarity
- **Never modify shared packages** without considering downstream consumers

> **Full details:** See `.github/instructions/agent-conduct.instructions.md`

## App-Specific Context

Each app has its own `AGENTS.md` with detailed patterns:

- `{{APP_DIR}}/{{APP_NAME_1}}/AGENTS.md` - {{APP_1_DESCRIPTION}} patterns
- `{{APP_DIR}}/{{APP_NAME_2}}/AGENTS.md` - {{APP_2_DESCRIPTION}} patterns

## Detailed Instructions

Detailed standards are split into focused instruction files in `.github/instructions/`:

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

## Skills

For detailed standards on specific topics, refer to these skills in `.agents/skills/`:

| Skill             | File                               | Purpose                                                 |
| ----------------- | ---------------------------------- | ------------------------------------------------------- |
| **Logging**       | `logging/SKILL.md`                 | Structured logging standards, log levels, observability |
| **Documentation** | `project-documentation/SKILL.md`   | README, comments, ADRs, changelogs                      |
| **Writing Plans** | `writing-plans/SKILL.md`           | Feature planning and specifications                     |
| **Code Review**   | `requesting-code-review/SKILL.md`  | Review process and checklists                           |
| **Debugging**     | `systematic-debugging/SKILL.md`    | Debugging workflows                                     |
| **TDD**           | `test-driven-development/SKILL.md` | Test-driven development                                 |
| **Git Worktrees** | `using-git-worktrees/SKILL.md`     | Parallel development branches                           |

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
**Parallel**: Independent tasks (e.g., changes in different apps) can be dispatched to multiple subagents simultaneously.

**Monorepo-specific**: When implementing features that span multiple apps, coordinate carefully:

- Research each app's patterns independently with Researcher subagents
- Plan shared package changes before app-specific changes
- Review cross-app impact after implementation

### Invoking Subagents

Subagents are typically **agent-initiated** — the coordinator decides when to delegate. You can also hint:

- "Use the Feature Builder agent to implement this feature"
- "Run the TDD agent for this requirement"
- "Use the Backend Architect to design the database schema"
- "Use the Documenter to update the project documentation"
- "Use a subagent to research how authentication works across apps"

> **Docs:** [VS Code Subagents](https://code.visualstudio.com/docs/copilot/agents/subagents) · [Cursor Subagents](https://cursor.com/docs/subagents)

## Related Documentation

- [README.md](README.md) - Project overview
- [{{APP_DIR}}/{{APP_NAME_1}}/AGENTS.md]({{APP_DIR}}/{{APP_NAME_1}}/AGENTS.md) - App context
- [{{PACKAGES_DIR}}/{{PACKAGE_NAME_1}}/README.md]({{PACKAGES_DIR}}/{{PACKAGE_NAME_1}}/README.md) - Package docs
- [.cursor/agents/](.cursor/agents/) - Cursor custom agents
- [.github/instructions/](.github/instructions/) - Copilot instruction files
- [.github/agents/](.github/agents/) - Copilot custom agents
