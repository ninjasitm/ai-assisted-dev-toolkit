# Implement Feature

Implement a feature by completing tasks sequentially with proper tracking.

## Usage

```

/implement-feature {{ISSUE_KEY}}-123
/implement-feature apps/{{APP_NAME}}/docs/features/{{FEATURE_NAME}}/tasks.md

````

## Orchestrator Checkpoint

> **🛑 Before starting**: This command involves planning, implementation, testing, and review.
> Use the **orchestrator-first** flow. Delegate to the **Feature Builder** coordinator or use
> the `subagent-driven-development` skill to dispatch a fresh subagent per task.
> See `.claude/rules-snippets/subagent-workflow.md` for full patterns.

## Process

1. **Load Feature Context**:
   - Read specification from `apps/{{APP_NAME}}/docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/spec.md`
   - Read implementation plan from `apps/{{APP_NAME}}/docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/plan.md`
   - Read task list from `apps/{{APP_NAME}}/docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/tasks.md`
   - Review `AGENTS.md` for project patterns

2. **Parallelization Analysis**:
   - Scan task list for `[P]` markers and independent tasks
   - Group tasks by domain (backend, frontend, docs, tests)
   - Tasks that touch **different files with no shared state** → dispatch in parallel
   - Tasks with dependencies or shared files → keep sequential
   - Use `dispatching-parallel-agents` skill when 3+ independent tasks exist

3. **Create Feature Branch**:
   ```bash
   git checkout -b feature/{{FEATURE_NAME}}
   git pull origin {{DEFAULT_BRANCH}}
````

4. **Task Implementation** (sequential or parallel per analysis):

   For tasks with dependencies, execute in order.
   For `[P]` tasks with no shared state, **dispatch parallel subagents** — one per task domain:

   For each task:

   a. **Mark Task In Progress**

   b. **Research & Understand**:

   - Search codebase for similar patterns
   - Review referenced files
   - Understand dependencies

   c. **Implement (TDD required)**:

   - Follow acceptance criteria exactly
   - Use patterns from `AGENTS.md`
   - **Write a failing test first** — one behavior per test, clear name, real code
   - **Verify it fails** — watch it fail for the right reason (feature missing, not error)
   - **Write minimal code to pass** — simplest implementation, no over-engineering
   - **Verify it passes** — all tests green, no regressions
   - **Refactor** — clean up only after green (remove duplication, improve names)
   - Ensure type safety
   - See `test-driven-development/SKILL.md` for the full cycle

   d. **Validate**:

   - Run type checking: `{{PACKAGE_MANAGER}} run check-types`
   - Run linter: `{{PACKAGE_MANAGER}} run lint`
   - Run tests: `{{PACKAGE_MANAGER}} run test`
   - Build: `{{PACKAGE_MANAGER}} run build`

   e. **Commit Changes**:

   ```bash
   git commit -m "feat({{SCOPE}}): {{DESCRIPTION}}"
   ```

   f. **Mark Task Complete**

5. **Post-Implementation Review**:
   - Dispatch **Reviewer** agent on all changes before proceeding
   - If reviewer requests changes, route back to the original domain specialist
   - Use `verification-before-completion` skill for final quality gate

6. **Create Pull Request**:

   After all tasks complete:

   a. **Final Validation**:

   - All tests passing
   - No type errors
   - No linter errors
   - Build successful

   b. **Push and Create PR**:

   ```bash
   git push -u origin feature/{{FEATURE_NAME}}
   ```

   - Create PR targeting `{{DEFAULT_BRANCH}}`
   - Include feature summary and testing notes

7. **Report Status**:
   - Completed tasks count
   - PR URL
   - Ready for code review

## Guidelines

- **No Placeholders**: Never implement "Coming Soon" or placeholder functionality
- **Complete Features**: Each task should result in working functionality
- **Test-Driven (mandatory)**: Write failing tests before implementation. Follow red-green-refactor. No production code without a failing test first.
- **Atomic Commits**: One logical change per commit
