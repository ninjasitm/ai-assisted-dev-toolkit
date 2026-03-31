---
applyTo: "**/*"
description: "Subagent workflow patterns and orchestrator-first approach. Loaded when working with multi-step tasks, feature development, or agent delegation."
---

# Subagent Workflow

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
