You are helping to break down a feature into actionable tasks.

`tasks.md` is a checklist only. Acceptance criteria live in `spec.md`; approach, files, and effort live in `plan.md`. Do not repeat them here.

## Your Task

1. **Load context**:
   - Read the specification in `apps/{{APP_NAME}}/docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/spec.md`
   - Read the plan in `apps/{{APP_NAME}}/docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/plan.md` (if exists)
   - Review `AGENTS.md` for project patterns

2. **Break down into tasks** (aim for 3-7 total; never exceed 10):
   - **Setup**: dependencies, configuration, scaffolding (combine into 1 task)
   - **Core**: main implementation, grouped by component or feature area
   - **Tests**: unit and integration tests (1 task per component)
   - **Polish**: documentation, cleanup, optimization (combine into 1 task)

3. **Consolidation rules** (CRITICAL):
   - **Group related work**: combine tasks that touch the same files or feature area
   - **Merge small tasks**: anything under 2 hours folds into related work
   - **Bundle by outcome**: group by what gets delivered, not individual steps
   - **Keep each task inside one app**. Cross-app work: shared package task first, then app tasks

4. **Create the task list** at `apps/{{APP_NAME}}/docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/tasks.md`:

   ```markdown
   # Tasks: {{ISSUE_ID}}-{{FEATURE_NAME}}

   - [ ] T1 Setup: dependencies and configuration
   - [ ] T2 Models, services, and endpoints for sessions
   - [ ] T3 Session tests [P]
   - [ ] T4 Docs and cleanup
   ```

   Each task is one line:
   - **Checkbox** `- [ ]`. Tick to `- [x]` once the task is implemented and reviewed.
   - **ID** `T<n>`, sequential, in dependency order.
   - **Description**: short and deliverable-focused (what ships, not how). No file lists, effort, or acceptance criteria.
   - **`[P]`** only when the task can run in parallel (different files, no shared state). Omit otherwise.
   - **` — <ticket key>`** appended after an em dash once a ticket exists. Written by `/assign-tasks`; never added before the ticket is created.
   - **Sub-bullets** only when a task truly needs them (rare).

5. **Task ordering**:
   - Setup before implementation
   - Tests before or alongside code (TDD)
   - Core features before integrations
   - Polish last
   - Tasks touching the same files run sequentially and are never `[P]`

6. **Report**: tasks file path, task count, number of `[P]` tasks, and the consolidation note ("Combined X items into Y tasks"). Next step: `/implement-feature`, or `/assign-tasks` to create tickets.

## Anti-Patterns to Avoid

❌ One task per file in a feature
❌ "Create X" then "Configure X" then "Test X"
❌ Minor changes under 30 minutes, or obvious steps like "commit code" or "run linter"

✅ All model, migration, and factory work for an entity
✅ Related API endpoints that share logic
✅ All configuration and environment setup
✅ Documentation updates across multiple files

## Orchestrator Dispatch Guide

When this list is used by `/implement-feature` or `/implement`:

- **`[P]` tasks**: dispatch one subagent per task concurrently, using `dispatching-parallel-agents`
- **Other tasks**: execute in dependency order, one subagent per task, using `subagent-driven-development`
- **Domain routing**: match each task to a specialist (Backend Architect, Frontend Developer, API Specialist, etc.)
- **Review gate**: every task passes a Reviewer before it is ticked `[x]`
