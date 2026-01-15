---
description: Generate an actionable task list from a specification or plan
---

You are helping to break down a feature into actionable tasks.

## Your Task

1. **Load context**:

   - Read the specification in `docs/specs/{{FEATURE_NAME}}.md`
   - Read the plan in `docs/plans/{{FEATURE_NAME}}.md` (if exists)
   - Review `AGENTS.md` for project patterns

2. **Break down into tasks**:

   - **Setup**: Dependencies, configuration, scaffolding
   - **Core**: Main implementation tasks
   - **Tests**: Unit and integration tests
   - **Polish**: Documentation, cleanup, optimization

3. **Task ordering rules**:

   - Setup before implementation
   - Tests before or alongside code (TDD)
   - Core features before integrations
   - Mark parallelizable tasks with [P]

4. **Create task list**:
   - Output to `docs/tasks/{{FEATURE_NAME}}.md`
   - Each task should be specific and actionable
   - Include file paths where relevant

## Task Template

```markdown
# Tasks: {{FEATURE_NAME}}

## Setup

- [ ] T001: Install dependencies
- [ ] T002: Create file structure

## Core Implementation

- [ ] T003: Implement [feature part] in `{{SRC_DIR}}/file.{{FILE_EXTENSION}}`
- [ ] T004 [P]: Implement [feature part] in `{{SRC_DIR}}/other.{{FILE_EXTENSION}}`

## Tests

- [ ] T005 [P]: Add unit tests for [component]
- [ ] T006 [P]: Add integration tests for [feature]

## Polish

- [ ] T007: Update documentation
- [ ] T008: Code review and cleanup
```

## Notes

- [P] indicates tasks that can run in parallel
- Tasks affecting the same file should be sequential
- Each task should be completable independently
