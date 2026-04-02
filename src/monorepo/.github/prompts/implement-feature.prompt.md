---
description: Implement a feature by completing tasks sequentially
---

# Implement Feature

Implement a feature by completing tasks sequentially with proper tracking.

## Usage

```
/implement-feature {{ISSUE_KEY}}-123
/implement-feature docs/tasks/feature-name.md
```

## Orchestrator Checkpoint

> **🛑 Before starting**: This command involves planning, implementation, testing, and review.
> Use the **orchestrator-first** flow. Delegate to the **Feature Builder** coordinator or use
> the `subagent-driven-development` skill to dispatch a fresh subagent per task.
> See `.github/instructions/subagent-workflow.instructions.md` for full patterns.

## Process

1. **Load Feature Context**:
   - Read specification from `docs/specs/{{FEATURE_NAME}}.md`
   - Read implementation plan from `docs/plans/{{FEATURE_NAME}}.md`
   - Read task list from `docs/tasks/{{FEATURE_NAME}}.md`
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
   ```

4. **Task Implementation** (sequential or parallel per analysis):

   For tasks with dependencies, execute in order.
   For `[P]` tasks with no shared state, **dispatch parallel subagents** — one per task domain:

   For each task:

   a. **Mark Task In Progress**

   b. **Research & Understand**:
      - Search codebase for similar patterns
      - Review referenced files
      - Understand dependencies

   c. **Implement**:
      - Follow acceptance criteria exactly
      - Use patterns from `AGENTS.md`
      - Write tests alongside implementation
      - Ensure type safety

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
- **Test-Driven**: Write tests before or alongside implementation
- **Atomic Commits**: One logical change per commit
