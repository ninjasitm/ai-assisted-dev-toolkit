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

## Related Documentation

- [README.md](README.md) - Project overview
- [{{APP_DIR}}/{{APP_NAME_1}}/AGENTS.md]({{APP_DIR}}/{{APP_NAME_1}}/AGENTS.md) - App context
- [{{PACKAGES_DIR}}/{{PACKAGE_NAME_1}}/README.md]({{PACKAGES_DIR}}/{{PACKAGE_NAME_1}}/README.md) - Package docs
- [.github/instructions/](.github/instructions/) - Copilot instruction files
