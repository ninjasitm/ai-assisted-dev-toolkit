---
description: Break down a plan into executable tasks
---

# Generate Task Breakdown

Break down the implementation plan into executable tasks. This is the third step in the development lifecycle.

## Usage

```
/tasks {{ISSUE_KEY}}-123
/tasks docs/plans/user-authentication.md
```

## Task Consolidation Rules (CRITICAL)

Before creating tasks, apply these consolidation principles:

### Target Task Counts

| Feature Complexity   | Total Tasks | Max Subtasks/Task |
| -------------------- | ----------- | ----------------- |
| Simple (< 4 hours)   | 2-3         | 0                 |
| Medium (4-16 hours)  | 3-5         | 2-4               |
| Complex (16-40 hrs)  | 5-8         | 3-6               |
| Large (40+ hours)    | 8-12        | 5-10              |

### Consolidation Principles

- **Group by deliverable**: Combine work that ships together
- **Merge related files**: Model + migration + factory = 1 task
- **Bundle by layer**: All service layer work = 1 task (if related)
- **Avoid micro-tasks**: Nothing under 1-2 hours as standalone
- **Limit phases**: Combine Foundation + Implementation when small

### Before Finalizing, Ask:

1. Can any adjacent phases be combined?
2. Are there tasks under 2 hours that should be merged?
3. Would a developer naturally complete these together?
4. Does each task represent meaningful progress?

## Process

1. **Load Context**:
   - Read specification from `docs/specs/{{FEATURE_NAME}}.md`
   - Read plan from `docs/plans/{{FEATURE_NAME}}.md`
   - Review `AGENTS.md` for project patterns

2. **Generate Consolidated Task Breakdown**:

   Create `docs/tasks/{{FEATURE_NAME}}.md` with phases (combine where appropriate):

   ### Phase 1: Foundation & Setup (combine into 1 task)
   - Database schema changes, migrations, seeders
   - Type definitions and interfaces
   - Base models and validators
   - Configuration and dependencies

   ### Phase 2: Core Implementation (group by feature area)
   - Core functionality grouped by component
   - API endpoints or components (CRUD together)
   - Business logic and services

   ### Phase 3: Testing (1 task per major component)
   - Unit tests for component
   - Integration tests for feature
   - E2E tests (if applicable)

   ### Phase 4: Polish & Documentation (combine into 1 task)
   - Error handling improvements
   - Performance optimization
   - Documentation updates

3. **Consolidated Task Format**:

   ```markdown
   ### T001: [Consolidated Task Name]

   **Phase**: [Foundation/Implementation/Testing/Polish]
   **Estimated Effort**: [Hours - aim for 2-8 hours per task]
   **Parallel**: [Yes/No]

   **Scope** (what this task covers):
   - [Component/feature 1]
   - [Component/feature 2]
   - [Related component 3]

   **Files to Create/Modify**:
   - `{{SRC_DIR}}/path/to/file.{{FILE_EXTENSION}}`
   - `{{SRC_DIR}}/path/to/related.{{FILE_EXTENSION}}`
   - `{{TEST_DIR}}/path/to/test.{{FILE_EXTENSION}}`

   **Acceptance Criteria**:
   - [ ] All components implemented
   - [ ] Tests passing
   - [ ] No type/lint errors

   **Subtasks** (only if task > 8 hours):
   - [ ] Subtask 1
   - [ ] Subtask 2
   ```

4. **Task Ordering Rules**:
   - Setup before implementation
   - Tests before or alongside code (TDD)
   - Core before integration
   - Everything before polish

5. **Parallel Execution**:
   - Mark parallelizable tasks with `[P]`
   - Different feature areas = can be parallel
   - Same files = sequential

6. **Report Completion**:
   - Tasks file path
   - **Consolidated task count** (should be 3-7)
   - Estimated total effort
   - **Consolidation note**: "Combined X items into Y tasks"
   - Ready for `/implement` command

## Anti-Patterns to Avoid

❌ **Don't create separate tasks for**:
- Each individual file
- "Create X" then "Configure X" then "Test X"
- Setup tasks under 1 hour
- Each CRUD operation separately

✅ **Do combine into single tasks**:
- All database work for an entity
- All API endpoints for a resource
- All configuration/setup work
- Related service layer methods
