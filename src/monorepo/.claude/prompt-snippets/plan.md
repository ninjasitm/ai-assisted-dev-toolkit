You are helping to create an implementation plan for a feature or requirement.

## Orchestrator Checkpoint

> **🛑 Before starting**: For complex features spanning multiple domains (backend + frontend + API + docs),
> dispatch **Researcher** subagents in parallel to analyze each domain simultaneously.
> Use the `writing-plans` skill for structured plan creation.
> For this command, the artifact-only scope, source preservation, template and review gates below override that skill's execution handoff, worktree and commit procedures. Stop after reporting the accepted artifacts.
> See `.claude/rules-snippets/subagent-workflow.md` for full patterns.

## Your Task

1. **Load context**:

   - Use the supplied requirement as sufficient input. Ask targeted questions only when the request is unclear; do not require creating a specification first.
   - Read `AGENTS.md` for project architecture and patterns
   - Review `docs/constitution.md` for project principles (if exists)
   - If an existing specification is available at `apps/{{APP_NAME}}/docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/spec.md`, read it as optional context.
   - Without an existing specification, persist the original supplied requirements and acceptance criteria verbatim in `plan.md` under **Requirements Source** and **Acceptance Criteria**, including the source path or issue key when available. Preserve constraints; label any derived criteria or assumptions separately and ask the user about unclear or missing criteria rather than inventing approval. This plan is the durable requirements source for `/tasks` and `/assign-tasks`.
   - With an existing specification, link to its requirements and acceptance criteria instead of duplicating them. Surface conflicts with the supplied request to the user before proceeding.
   - Check relevant existing code for patterns to follow

2. **Analyze the requirement**:

   - Identify functional requirements
   - Identify non-functional requirements (performance, security, etc.)
   - Note dependencies on existing code or external services
   - List acceptance criteria

3. **Create the implementation plan**:

   - **Technical approach**: How will this be implemented?
   - **File changes**: What files need to be created or modified?
   - **Data model changes**: Any database or schema changes?
   - **API changes**: Any endpoints to add or modify?
   - **Dependencies**: External packages or services needed?
   - **Testing strategy**: How will this be tested?
   - **Parallelization map**: Identify which tasks are independent and can be dispatched to parallel subagents during implementation (mark with `[P]`)

4. **Output the plan**:
   - Determine the target app directory (e.g., `apps/{{APP_NAME}}/`)
   - Create `apps/{{APP_NAME}}/docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/plan.md` with the plan
   - Include estimated complexity and effort
   - List any open questions or decisions needed

5. **Review and Accept Planning Artifacts**:
   - The orchestrator dispatches an independent, read-only reviewer with the original request, requirements/context, plan and any additional artifact paths. Review the actual artifacts for completeness, dependencies/order, actionability, and coverage of the request; return `VERDICT: PASS` or `VERDICT: CHANGES` with blocking findings and section references.
   - Repair blocking findings within the agreed scope, repeat affected artifact checks, and re-review the changed artifacts independently. Repeat until PASS or blocked; unresolved decisions go to the user.
   - Only the orchestrator accepts, after an independent PASS and evidence for every requirement and applicable artifact check. If an independent reviewer is unavailable, report BLOCKED; self-review cannot substitute for independent acceptance.
   - This is a lightweight artifact review, not a code build loop: do not implement the plan, run runtime build/TDD/git procedures, or add commit, push, or apply steps. Keep any required human approval separate from artifact acceptance.

6. **Report completion** only after artifact acceptance, with the plan path, artifact check evidence, and any remaining questions for human approval.

## Plan Template

```markdown
# Implementation Plan: {{FEATURE_NAME}}

## Overview

[Brief description of the feature]

## Requirements Source
[Without a specification: original supplied requirements verbatim and source path/issue key. Otherwise: link to the specification's requirements.]

## Acceptance Criteria
[Without a specification: original supplied acceptance criteria verbatim; label derived criteria/assumptions separately. Otherwise: link to the specification's criteria.]

## Technical Approach

[How this will be implemented]

## File Changes

- [ ] `path/to/file.{{FILE_EXTENSION}}` - Description of changes

## Testing Strategy

- Unit tests for...
- Integration tests for...

## Open Questions

- [ ] Question 1
```
