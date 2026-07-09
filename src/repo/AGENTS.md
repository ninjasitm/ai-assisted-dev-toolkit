# AGENTS.md - {{PROJECT_NAME}}

**Language:** {{LANGUAGE}}
**Framework:** {{FRAMEWORK}}
**Package Manager:** {{PACKAGE_MANAGER}}
**Deploy:** {{DEPLOY_PLATFORM}} | **Dev:** localhost:{{DEV_PORT}}

## Overview

{{PROJECT_DESCRIPTION}}

## Orientation to recent work

The [orient-to-recent-work](../.agents/skills/orient-to-recent-work/SKILL.md) skill (auto-loaded) orients you to recent project activity before any non-trivial task: CHANGELOG Unreleased, recent commits, recent decisions. Skip for trivial fixes: typos, version bumps, isolated docs updates, mechanical refactors with a known target.

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

## Project Management

**Tracker:** {{ISSUE_TRACKER}}
**URL:** {{PM_URL}}
**Project Key:** {{PROJECT_KEY}}
**Issue Key Format:** `{{PM_ISSUE_KEY}}`

### Tool Access

See the `issue-tracker` skill (`.agents/skills/issue-tracker/SKILL.md`) for MCP tool prefixes, CLI fallback strategy, tracker configuration, and epic discovery workflow.
For CLI command reference, see the matching skill: `.agents/skills/{acli,gh-cli,glab-cli,bkt-cli,linear-cli}/SKILL.md`.

## Agent Conduct & Interaction Rules

### Clarification & Alignment Guidelines

#### 1. Proactive Clarification

- **Identify Ambiguity**: Stop and ask if a task lacks clear acceptance criteria, inputs, or expected outputs.
- **Resolve Conflicts**: Flag conflicting instructions between the user prompt, existing code, and documentation before writing code.
- **Expose Assumptions**: State your assumptions clearly and ask for validation before proceeding with high-impact changes.

#### 2. Technical Validation & Alternatives

- **Propose Better Paths**: Suggest a simpler, more performant, or more idiomatic alternative if you see a better way to solve the problem.
- **Flag Code Smells**: Alert the team if the requested changes introduce technical debt, anti-patterns, or break existing architectural rules.
- **Check Dependencies**: Ask for verification if a task requires adding new third-party libraries or upgrading existing versions.

#### 3. Scope & Edge Case Management

- **Surface Edge Cases**: List potential failures, null states, or security risks you discover, and ask how to handle them.
- **Prevent Scope Creep**: Ask for permission before modifying files or logic outside the explicit scope of the assigned task.
- **Clarify Breakages**: Warn the user immediately if a requested change will intentionally break backward compatibility or existing APIs.

#### 4. How to Ask Questions (Response Formatting)

When stopping to ask a question, do not just post an open-ended block of text. Format your query using one of these two structures:

- **Structured Multiple-Choice**: For architectural, design, or logic choices, provide a numbered list of distinct options. Include a brief pro/con or trade-off for each path so the user can quickly respond with just a number (e.g., "Go with Option 2").
- **Targeted Text Input**: For missing data, API endpoints, or environment variables, provide a clear, pre-formatted Markdown template or fill-in-the-blank block. The user should be able to copy, fill out, and return it with minimal friction.

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

| Skill                | File                                      | Purpose                                                    |
| -------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| **Atlassian CLI**    | `acli/SKILL.md`                           | Atlassian CLI (ACLI) command reference                     |
| **Bitbucket CLI**    | `bkt-cli/SKILL.md`                        | Bitbucket PRs, issues, repos CLI reference                 |
| **Brainstorming**    | `brainstorming/SKILL.md`                  | Structured ideation sessions                               |
| **Branch Finish**    | `finishing-a-development-branch/SKILL.md` | Completing and merging branches                            |
| **Code Review**      | `requesting-code-review/SKILL.md`         | Review process and checklists                              |
| **Code Simplifier**  | `code-simplifier/SKILL.md`                | Analyze recently modified code for simplification opportunities |
| **Debugging**        | `systematic-debugging/SKILL.md`           | Structured debugging methodology                           |
| **Debugger**         | `debugger/SKILL.md`                       | Systematic debugging dispatch with mandatory root cause investigation |
| **Documentation**    | `project-documentation/SKILL.md`          | README, comments, ADRs, changelogs                         |
| **Executing Plans**  | `executing-plans/SKILL.md`                | Following through on implementation plans                  |
| **Git Worktrees**    | `using-git-worktrees/SKILL.md`            | Parallel development branches                              |
| **GitHub CLI**       | `gh-cli/SKILL.md`                         | GitHub Issues CLI command reference                        |
| **GitLab CLI**       | `glab-cli/SKILL.md`                       | GitLab MRs, issues, pipelines CLI reference                |
| **Issue Tracker**    | `issue-tracker/SKILL.md`                  | MCP tools reference, CLI fallback strategy, epic discovery |
| **Linear CLI**       | `linear-cli/SKILL.md`                     | Linear CLI command reference                               |
| **Logging**          | `logging/SKILL.md`                        | Structured logging standards, log levels, observability    |
| **Orient to Recent Work** | `orient-to-recent-work/SKILL.md`     | Build context from recent project activity                 |
| **Parallel Agents**  | `dispatching-parallel-agents/SKILL.md`    | Coordinating multiple AI agents                            |
| **Ponytail**         | `ponytail/SKILL.md`                       | YAGNI/stdlib/native/minimum-discipline coding mode        |
| **Ponytail Audit**   | `ponytail-audit/SKILL.md`                 | Whole-repo audit for over-engineering                      |
| **Ponytail Debt**    | `ponytail-debt/SKILL.md`                  | Track ponytail shortcuts and deferrals                     |
| **Ponytail Gain**    | `ponytail-gain/SKILL.md`                  | Show ponytail's measured impact                            |
| **Ponytail Help**    | `ponytail-help/SKILL.md`                  | Quick-reference for ponytail modes and commands            |
| **Ponytail Review**  | `ponytail-review/SKILL.md`                | Code review focused on over-engineering                    |
| **Review Feedback**  | `receiving-code-review/SKILL.md`          | Responding constructively to review feedback               |
| **Security Reviewer** | `security-reviewer/SKILL.md`             | Security-focused code review                               |
| **Subagent Dev**     | `subagent-driven-development/SKILL.md`    | Breaking tasks into subagent chunks                        |
| **Superpowers**      | `using-superpowers/SKILL.md`              | Leveraging the full skill system                           |
| **TDD**              | `test-driven-development/SKILL.md`        | Test-driven development with red-green-refactor            |
| **Verification**     | `verification-before-completion/SKILL.md` | Quality checks before claiming work done                   |
| **Writing Plans**    | `writing-plans/SKILL.md`                  | Feature planning and specifications                        |
| **Writing Skills**   | `writing-skills/SKILL.md`                 | Creating effective SKILL.md files                          |

## ⚠️ CRITICAL: Orchestration Checkpoint (READ FIRST)

**BEFORE starting ANY multi-step task, MUST read this section:**

If your work involves **2+ of these activities**, you MUST use orchestrator-first flow:

- Research / exploration
- Planning / specification
- Implementation / code changes
- Testing / validation
- Review / quality gate

**Common patterns requiring orchestration:**

- Feature development (research + build + test + review)
- Bug fix analysis (diagnose + plan + implement + validate)
- API design (spec + implement + integrate + test)
- Multi-file refactoring (plan + change multiple files + validate)

**Quick decision tree:**

- Single file edit? → Direct implementation OK
- 2+ independent fixes? → Use subagent flow (dispatch parallel agents)
- Feature with planning + implementation + review? → Use Feature Builder coordinator
- Behavior-driven development? → Use TDD coordinator
- Uncertain? → Read "Recommended Flow" below

**Cost of skipping this:**

- Wastes tokens on sequential work that could parallelize
- Breaks established workflow expectations
- Loses benefits of specialist domain routing
- Reduces code review quality (less context isolation)
- Single-agent work accumulates cognitive load

---

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

### Subagent Guidance

Use custom agents when you want explicit coordinator and worker roles. Use workflow skills when you want tighter manual control over the same process.

#### When to Delegate

- Use `Feature Builder` for feature work that needs research, planning, implementation, and review in one coordinated flow.
- Use `TDD` when requirements are behavior-driven and you want explicit red-green-refactor execution.
- Prefer orchestrator-first execution for multi-step work and route tasks to domain specialists when possible.
- Use `Researcher` directly for read-only exploration.
- Use `Backend Architect`, `Frontend Developer`, `API Specialist`, `Admin Portal`, and `Documenter` for focused domain tasks.
- Use `subagent-driven-development` after `writing-plans` when you have a written implementation plan and want to stay in the current session.
- Use `dispatching-parallel-agents` only when tasks are independent, do not share state, and are unlikely to touch the same files.
- Use `requesting-code-review` after each task in subagent-driven development, after each major task in ad-hoc work, and before merge so issues do not cascade.
- Use `executing-plans` instead of `subagent-driven-development` when you want a separate execution session rather than same-session orchestration.

#### Operating Rules

- Give each subagent a narrow scope, the exact task text, and the context it needs to act safely.
- Treat `Planner`, `Implementer`, `Reviewer`, `Red`, `Green`, and `Refactor` as worker agents intended for coordinator-led handoff.
- Do not make an implementation subagent read the plan file on its own; pass the relevant task directly.
- In `subagent-driven-development`, keep the review order strict: spec compliance first, then code quality.
- If a reviewer finds issues, fix them and re-run the same review before moving on.
- Do not run multiple implementation subagents in parallel when they could touch shared packages, shared docs, or the same app surface.

#### Recommended Flow

1. Use `brainstorming` if requirements or scope are still fuzzy.
2. Use `writing-plans` to produce a concrete implementation plan.
3. Use `subagent-driven-development` for same-session execution or `executing-plans` for a separate execution session.
4. Use `dispatching-parallel-agents` only for independent investigations or non-overlapping tasks.
5. Use `requesting-code-review` and `verification-before-completion` before claiming the work is done.

> **Delegation patterns:** See `.github/instructions/subagent-workflow.instructions.md`.

### How to invoke

- "Use the Feature Builder agent to implement this feature" → Coordinator orchestrates full lifecycle
- "Run the TDD agent for this requirement" → TDD coordinator manages red-green-refactor
- "Use the Backend Architect to design the database schema" → Domain specialist works directly
- "Review my recent changes" → Reviewer works directly on git diff

## Sub-Agent Patterns

Use the appropriate sub-agents when the task benefits from specialized expertise or parallel execution.

### When to use sub-agents

| Context                                  | Recommended Agent                                            | Why                                   |
| ---------------------------------------- | ------------------------------------------------------------ | ------------------------------------- |
| Orchestration and coordination           | `orchestrator` or `coordinator` or `delegator` or equivalent | Strategic planning and task breakdown |
| Code base exploration and analysis       | `explorer` or equivalent                                     | Focused on understanding codebases    |
| Codebase understanding and documentation | `documenter` or equivalent                                   | Focused on generating documentation   |
| Reviewing templates for quality          | `reviewer` or equivalent                                     | Read-only, focused on standards       |
| Implementing template changes            | `developer` or `fixer` or equivalent                         | Needs write access, follows workflows |
| Planning architecture decisions          | `planner` or `consul` or equivalent                          | Read-only, strategic thinking         |
| PR code review                           | `reviewer` or equivalent                                     | Structured review process             |
| Commit and push                          | `build` or `deployer` or equivalent                          | Execution-focused                     |
| UI design and prototyping                | `designer` or equivalent                                     | Visual and UX expertise               |

### Sub-agent invocation patterns

**Claude Code** (via `.claude/agents/` or plugins in target projects):

```
@reviewer Review the coding standards template
@developer Implement the new placeholder syntax
@planner Design the monorepo structure
```

**GitHub Copilot** (via `.github/agents/` or plugins in target projects):

```
@reviewer Review the coding standards template
@developer Implement the new placeholder syntax
```

**OpenCode** (via `.opencode/agents/` or plugins in target projects):

```
@reviewer Review the coding standards template
@developer Implement the new placeholder syntax
@planner Design the monorepo structure
```

### Sub-agent guidelines

1. **Choose the right agent** — Match the agent's role to the task
2. **Provide context** — Reference the relevant rules-snippets or prompt-snippets
3. **Set constraints** — Use tool restrictions for read-only agents (reviewer, planner)
4. **Chain when needed** — Planner → Developer → Reviewer for complex changes

## Custom Agents (Subagents)

Custom agents enable **context-isolated delegation** — a coordinator agent breaks complex tasks into subtasks and dispatches specialized subagents, each with their own tools and focus.

### Available Agents

Agent definitions live in `.github/agents/` (GitHub Copilot), `.cursor/agents/` (Cursor), and `.opencode/` (OpenCode):

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

## Documentation Requirements

Documentation updates are **mandatory before committing** any feature or fix. See [`.github/instructions/documentation.instructions.md`](.github/instructions/documentation.instructions.md) for the full pre-commit checklist, templates, and AI agent directives.

**Quick summary:**

- Create or update `docs/features/{{ISSUE_ID}}-FEATURE-NAME/` (spec + plan) for every feature
- Add fixes to the monthly log in `docs/fixes/{YYYY-MM}.md` (or a dedicated folder for complex fixes)
- Update `docs/api/`, `docs/integration/`, `docs/guides/`, `README.md`, and `CHANGELOG.md` when applicable
- Reference `docs/constitution.md` for project principles and governance
- Include all doc changes in the same commit/PR as the code

## Contributing

**Standards:** Follow {{FRAMEWORK}} and {{LANGUAGE}} best practices
**Process:** Feature branch → spec/plan docs → tests → implementation → update docs → lint → build → PR

## Related Documentation

- [README.md](README.md) - Project overview
- [docs/](docs/) - Detailed documentation
- [.claude/rules/](.claude/rules/) - Claude Code rules (thin wrappers → rules-snippets)
- [.claude/commands/](.claude/commands/) - Claude Code commands (thin wrappers → prompt-snippets)
- [.claude/rules-snippets/](.claude/rules-snippets/) - Rules content (source of truth)
- [.claude/prompt-snippets/](.claude/prompt-snippets/) - Prompt content (source of truth)
- [.claude/agents-snippets/](.claude/agents-snippets/) - Agent definitions (source of truth)
- [.github/instructions/](.github/instructions/) - Copilot instructions (thin wrappers → rules-snippets)
- [.github/prompts/](.github/prompts/) - Copilot prompts (thin wrappers → prompt-snippets)
- [.github/agents/](.github/agents/) - Copilot agents (thin wrappers → agents-snippets)
- [.cursor/rules/](.cursor/rules/) - Cursor IDE rules (thin wrappers → rules-snippets)
- [.cursor/commands/](.cursor/commands/) - Cursor commands (thin wrappers → prompt-snippets)
- [.cursor/agents/](.cursor/agents/) - Cursor agents (thin wrappers → agents-snippets)
- [.opencode/rules/](.opencode/rules/) - OpenCode rules (thin wrappers → rules-snippets)
- [.opencode/commands/](.opencode/commands/) - OpenCode commands (thin wrappers → prompt-snippets)
- [.opencode/agents/](.opencode/agents/) - OpenCode agents (thin wrappers → agents-snippets)
- [.opencode/opencode.json](.opencode/opencode.json) - OpenCode configuration
