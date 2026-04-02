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

- ✅ Multiple files across different app directories
- ✅ Planning phase + implementation phase
- ✅ Multiple independent reviewable chunks
- ✅ Different domain areas (backend + frontend + docs)
- ✅ Cross-app impacts or shared package changes
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

- Features spanning multiple files, modules, or apps
- Tasks requiring planning → implementation → review cycles
- Work that benefits from domain specialization (backend, frontend, API)
- Any task with 2+ independent subtasks
- Cross-app changes in the monorepo

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

### Monorepo Cross-App

When features span multiple apps:

1. Research each app's patterns independently with Researcher subagents
2. Plan shared package changes before app-specific changes
3. Implement shared packages first
4. Implement app-specific changes (can be parallel across apps)
5. Review cross-app impact after implementation

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
