# Generate Task Checklist

Break the implementation plan into a slim task checklist. This is the third step in the development lifecycle.

`tasks.md` is a checklist only. Acceptance criteria live in `spec.md`; approach, files, and effort live in `plan.md`. Do not repeat them here.

## Usage

```
/tasks {{ISSUE_KEY}}-123
/tasks docs/features/user-authentication/tasks.md
```

## When Not to Create tasks.md

Small work (1-2 steps) needs no `tasks.md`. Implement it directly.

## Consolidation Rules (CRITICAL)

### Target Task Counts

| Feature Complexity  | Total Tasks |
| ------------------- | ----------- |
| Simple (< 4 hours)  | 2-3         |
| Medium (4-16 hours) | 3-5         |
| Complex (16-40 hrs) | 5-8         |
| Large (40+ hours)   | 8-12        |

### Principles

- **Group by deliverable**: combine work that ships together (model + migration + factory = 1 task)
- **Bundle by layer or resource**: all service work for one area, all endpoints for one resource
- **Avoid micro-tasks**: nothing under 1-2 hours standalone
- **Limit phases**: combine Foundation + Implementation when small

Before finalizing, ask: Can adjacent tasks merge? Would one developer naturally finish these together? Does each task show meaningful progress?

## Process

1. **Load context**: `docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/spec.md`, `plan.md`, and `AGENTS.md` (project patterns).

2. **Write `docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/tasks.md`** in the format below.

3. **Report**: tasks file path, task count, number of `[P]` tasks, and the consolidation note ("Combined X items into Y tasks"). Next step: `/implement-feature`, or `/assign-tasks` to create tickets.

## Task Line Format

```markdown
# Tasks: {{ISSUE_ID}}-{{FEATURE_NAME}}

- [ ] T1 Schema + migration for sessions — PROJ-124
- [ ] T2 Login/logout endpoints [P]
- [ ] T3 Login form + error states [P]
```

Each task is one line:

- **Checkbox** `- [ ]`. Tick to `- [x]` once the task is implemented and reviewed.
- **ID** `T<n>`, sequential, in dependency order.
- **Description**: short and deliverable-focused (what ships, not how). No file lists, effort, or acceptance criteria.
- **`[P]`** only when the task can run in parallel (different files, no shared state). Omit otherwise.
- **` — <ticket key>`** appended after an em dash once a ticket exists. Written by `/assign-tasks`; never added before the ticket is created.
- **Sub-bullets** only when a task truly needs them (rare).

Ordering: setup before implementation; tests before or alongside code (TDD); core before integration; polish last. Tasks that touch the same files run sequentially and are never `[P]`.

## Anti-Patterns

❌ One task per file, per CRUD operation, or split into "Create X" / "Configure X" / "Test X"
❌ Standalone setup tasks under 1 hour

✅ All database work for an entity
✅ All API endpoints for a resource
✅ All configuration and setup for the feature

## Orchestrator Dispatch Guide

When this list is used by `/implement-feature` or `/implement`:

- **`[P]` tasks**: dispatch one subagent per task concurrently, using `dispatching-parallel-agents`
- **Other tasks**: execute in dependency order, one subagent per task, using `subagent-driven-development`
- **Domain routing**: match each task to a specialist (Backend Architect, Frontend Developer, API Specialist, etc.)
- **Review gate**: every task passes a Reviewer before it is ticked `[x]`
