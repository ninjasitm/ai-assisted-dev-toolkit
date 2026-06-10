---
description: "Execute implementation tasks from a task list or specification"
agent: build
---

You are helping to implement features based on a task list or specification.

## Orchestrator Checkpoint

> **🛑 Before starting**: If the task list contains 2+ tasks across different domains or files,
> use the **orchestrator-first** flow. Dispatch a fresh subagent per task using the
> `subagent-driven-development` skill. For 3+ independent `[P]` tasks, use the
> `dispatching-parallel-agents` skill to run them concurrently.
> See `.github/instructions/subagent-workflow.instructions.md` for full patterns.

## Your Task

1. **Load context**:

   - Read the specification or task list provided
   - Review `AGENTS.md` for coding patterns
   - Check relevant documentation in `docs/`

2. **Analyze implementation requirements**:

   - Identify files to create or modify
   - Understand dependencies between tasks
   - Note testing requirements
   - **Parallelization check**: Identify `[P]` tasks and group independent work by domain
   - Tasks touching different files with no shared state → dispatch in parallel

3. **Execute implementation**:

   - For sequential tasks: implement in dependency order
   - For parallel `[P]` tasks: dispatch domain specialist subagents concurrently
   - Follow TDD approach when appropriate
   - Follow project coding standards
   - Add appropriate comments and documentation

4. **Review gate**:
   - Dispatch **Reviewer** agent after implementation, before marking work complete
   - Use `verification-before-completion` skill for final quality check

5. **Validate implementation**:

   - Run linting: `{{PACKAGE_MANAGER}} run lint`
   - Run tests: `{{PACKAGE_MANAGER}} run test`
   - Build project: `{{PACKAGE_MANAGER}} run build`

6. **Track progress**:
   - Mark completed tasks
   - Report any blockers or issues
   - Summarize changes made

## Guidelines

- Follow patterns from `AGENTS.md`
- Keep changes focused and atomic
- Write tests for new functionality
- Update documentation as needed
- Use conventional commit messages
