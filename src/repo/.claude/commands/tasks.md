---
description: Generate an actionable task list from a specification or plan
---

You are helping to break down a feature into actionable tasks.

## Your Task

1. **Load context**:
   - Read the specification in `docs/specs/{{FEATURE_NAME}}.md`
   - Read the plan in `docs/plans/{{FEATURE_NAME}}.md` (if exists)
   - Review `AGENTS.md` for project patterns

2. **Break down into tasks** (aim for 3-7 total tasks):
   - **Setup**: Dependencies, configuration, scaffolding (combine into 1 task)
   - **Core**: Main implementation tasks (group by component/feature area)
   - **Tests**: Unit and integration tests (1 task per component)
   - **Polish**: Documentation, cleanup, optimization (combine into 1 task)

3. **Task Consolidation Rules** (CRITICAL):
   - **Group related work**: Combine tasks that touch the same files or feature area
   - **Merge small tasks**: Tasks under 2 hours should be combined with related work
   - **Limit total tasks**: Target 3-7 tasks total; never exceed 10 for any feature
   - **Avoid over-granularity**: "Create model + migration + factory" = 1 task, not 3
   - **Bundle by outcome**: Group by what gets delivered, not individual steps

4. **Complexity-Based Task Sizing**:

   | Complexity          | Task Count | Subtask Limit     |
   | ------------------- | ---------- | ----------------- |
   | Simple (< 4 hours)  | 2-3 tasks  | 0 subtasks        |
   | Medium (4-16 hours) | 3-5 tasks  | 2-4 per task max  |
   | Complex (16-40 hrs) | 5-8 tasks  | 3-6 per task max  |
   | Large (40+ hours)   | 8-12 tasks | 5-10 per task max |

5. **Task ordering rules**:
   - Setup before implementation
   - Tests before or alongside code (TDD)
   - Core features before integrations
   - Mark parallelizable tasks with [P]

6. **Create task list**:
   - Output to `docs/tasks/{{FEATURE_NAME}}.md`
   - Each task should be specific and actionable
   - Include file paths where relevant

## Task Template

```markdown
# Tasks: {{FEATURE_NAME}}

**Complexity**: Simple | Medium | Complex
**Estimated Total**: X hours
**Task Count**: X tasks

## T001: Setup & Configuration

- Install dependencies and configure environment
- Create file structure and scaffolding
- **Files**: `package.json`, `{{CONFIG_DIR}}/*`

## T002: Core Implementation - [Feature Area]

- Implement [feature part] including models, services, and controllers
- **Files**: `{{SRC_DIR}}/models/*`, `{{SRC_DIR}}/services/*`
- **Subtasks** (only if complex):
  - Model and database layer
  - Business logic and services
  - API/Controller layer

## T003 [P]: Testing

- Add unit and integration tests for all components
- **Files**: `{{TEST_DIR}}/*`

## T004: Polish & Documentation

- Update documentation, error handling, and cleanup
- **Files**: `README.md`, `docs/*`
```

## Anti-Patterns to Avoid

❌ **Don't create separate tasks for**:

- Each individual file in a feature
- "Create X" then "Configure X" then "Test X" (combine them)
- Minor changes that take < 30 minutes
- Obvious steps like "commit code" or "run linter"

✅ **Do combine into single tasks**:

- All model/migration/factory work for an entity
- Related API endpoints that share logic
- All configuration and environment setup
- Documentation updates across multiple files

## Notes

- [P] indicates tasks that can run in parallel
- Tasks affecting the same file should be sequential
- Each task should be completable independently
- **Quality over quantity**: Fewer, well-defined tasks beat many granular ones
