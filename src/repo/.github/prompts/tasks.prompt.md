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

## Process

1. **Load Context**:
   - Read specification from `docs/specs/{{FEATURE_NAME}}.md`
   - Read plan from `docs/plans/{{FEATURE_NAME}}.md`
   - Review `AGENTS.md` for project patterns

2. **Generate Task Breakdown**:

   Create `docs/tasks/{{FEATURE_NAME}}.md` with phases:

   ### Phase 1: Foundation
   - Database schema changes
   - Type definitions and interfaces
   - Base models and validators

   ### Phase 2: Implementation
   - Core functionality
   - API endpoints or components
   - Business logic

   ### Phase 3: Integration
   - Connect components/services
   - Wire up data flow
   - External integrations

   ### Phase 4: Testing
   - Unit tests
   - Integration tests
   - E2E tests

   ### Phase 5: Polish
   - Error handling improvements
   - Performance optimization
   - Documentation

3. **Task Format**:

   ```markdown
   ### Task: [Task Name]

   **ID**: T001
   **Phase**: [Foundation/Implementation/Integration/Testing/Polish]
   **Dependencies**: [Previous task IDs]
   **Estimated Effort**: [Hours or story points]
   **Parallel**: [Yes/No] - Can run alongside other tasks

   **Description**:
   [Clear, actionable description]

   **Files to Create/Modify**:
   - `{{SRC_DIR}}/path/to/file.{{FILE_EXTENSION}}` - Purpose
   - `{{TEST_DIR}}/path/to/test.{{FILE_EXTENSION}}` - Test coverage

   **Acceptance Criteria**:
   - [ ] Implementation complete
   - [ ] Tests passing
   - [ ] No type errors
   - [ ] No linter errors
   ```

4. **Task Ordering Rules**:
   - Setup before implementation
   - Tests before or alongside code (TDD)
   - Models before services
   - Services before endpoints
   - Core before integration
   - Everything before polish

5. **Parallel Execution**:
   - Mark parallelizable tasks with `[P]`
   - Different files = can be parallel
   - Same file = sequential

6. **Report Completion**:
   - Tasks file path
   - Total task count
   - Estimated total effort
   - Ready for `/implement` command
