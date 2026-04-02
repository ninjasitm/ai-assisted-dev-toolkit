---
applyTo: "**/*"
description: "Subagent workflow patterns and orchestrator-first approach. Loaded when working with multi-step tasks, feature development, or agent delegation."
---

# Subagent Workflow

## 🛑 BEFORE STARTING: Orchestration Checkpoint

**READ THIS SECTION FIRST if you are about to start work.** This instruction file is loaded automatically for multi-step tasks, meaning:

1. **You are likely handling 2+ of:** research, planning, implementation, testing, review, validation
2. **You MUST answer:** Does this task involve independent subtasks or multiple domains?
3. **If YES:** Use a coordinator agent (Feature Builder, TDD, or other) instead of single-agent execution
4. **If NO (single focused task):** Document why you're using a single agent, then proceed

### Signs You Should Use Orchestrator-First

- ✅ Multiple files across different directories
- ✅ Planning phase + implementation phase
- ✅ Multiple independent reviewable chunks
- ✅ Different domain areas (backend + frontend + docs)
- ✅ Test coverage needed alongside changes
- ✅ Architecture decisions before coding

### Signs Single Agent Is OK

- ✅ Single file edit
- ✅ Quick typo/syntax fix
- ✅ Research-only task (no code changes)
- ✅ Small documentation update
- ✅ Direct code review feedback (no implementation)

**When in doubt, use orchestrator-first.** It is lower-cost than sequential agent work and provides better code review isolation.

---

## Orchestrator-First Principle

**Default to using a coordinator agent for non-trivial work.** Coordinators break complex tasks into focused subtasks and dispatch specialized subagents with context isolation.

## When to Use Orchestrator + Subagents

- Features spanning multiple files or domains
- Tasks requiring planning → implementation → review cycles
- Work that benefits from domain specialization (backend, frontend, API)
- Any task with 2+ independent subtasks

## When to Use a Single Agent Directly

- Quick one-file fixes or small edits
- Research questions that don't require code changes
- Ad-hoc code reviews (invoke Reviewer directly)
- Simple documentation updates
- Domain-specific advice without implementation

## Available Coordinators

| Coordinator         | Purpose                                      | Dispatches                                                                                                                  |
| ------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Feature Builder** | End-to-end feature development orchestration | Planner, Implementer, Reviewer, Researcher, Backend Architect, Frontend Developer, API Specialist, Admin Portal, Documenter |
| **TDD**             | Red-green-refactor cycle coordination        | Red, Green, Refactor                                                                                                        |

## Domain Specialist Selection

When dispatching implementation tasks, match the specialist to the domain:

| Domain                             | Specialist             |
| ---------------------------------- | ---------------------- |
| API design, databases, system arch | **Backend Architect**  |
| UI components, state, responsive   | **Frontend Developer** |
| API contracts, docs, versioning    | **API Specialist**     |
| Admin dashboards, RBAC, reporting  | **Admin Portal**       |
| Project documentation              | **Documenter**         |
| General / cross-cutting            | **Implementer**        |

## Orchestration Patterns

### Sequential (default)

Tasks with dependencies are implemented one at a time in dependency order. Each must pass review before the next begins.

### Parallel

Independent tasks can be dispatched to multiple specialist subagents simultaneously. Use when tasks don't share files or state.

### Parallelization Analysis (REQUIRED before dispatching)

Before executing any task list, the orchestrator MUST run this analysis:

1. **Scan for `[P]` markers** in the task list — these are pre-identified parallel candidates
   - If no `[P]` markers exist, do **not** assume sequential-only work. Treat all tasks as candidates and infer parallel-safe groups via the independence test.
2. **Build a dependency graph**: For each task, list which files it reads and writes
3. **Apply the independence test**:
   - Tasks that write to **different files** with **no shared state** → parallel-safe
   - Tasks that share any writable file → sequential (dependency edge)
   - Tasks where one reads what another writes → sequential (data dependency)
4. **Group by domain** for specialist routing:
   - Backend tasks → Backend Architect
   - Frontend tasks → Frontend Developer
   - API contract tasks → API Specialist
   - Documentation tasks → Documenter
   - Cross-cutting → Implementer
5. **Dispatch decision**:
   - **3+ independent tasks** → Use `dispatching-parallel-agents` skill, one agent per task
   - **2 independent tasks** → Parallel dispatch (simpler coordination)
   - **All tasks dependent** → Sequential with `subagent-driven-development` skill
   - **Mixed** → Dispatch independent group in parallel, then continue sequential chain

```
Example: 5 tasks → T001 (setup) → T002 [P] (backend API) + T003 [P] (frontend UI) + T004 [P] (docs) → T005 (integration tests)
         Dispatch: T001 sequential → T002+T003+T004 parallel → T005 sequential
```

## Quality Gates

- Every implementation must pass **Reviewer** before proceeding
- Coordinators should not skip review even for "simple" changes
- If a reviewer requests changes, the original specialist fixes them and re-review occurs

## Skills Integration

These skills complement subagent workflows:

| Skill                            | When to Use                                     |
| -------------------------------- | ----------------------------------------------- |
| `subagent-driven-development`    | Executing plans with fresh subagent per task    |
| `dispatching-parallel-agents`    | Multiple independent problems to solve          |
| `writing-plans`                  | Creating implementation plans before execution  |
| `requesting-code-review`         | Structured review between implementation stages |
| `finishing-a-development-branch` | Completing work after all tasks pass review     |
