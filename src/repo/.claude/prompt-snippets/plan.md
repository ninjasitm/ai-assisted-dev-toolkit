# Plan Feature Implementation

Plan how to implement the supplied feature or requirement; a prior specification is not required.

## Usage

```
/plan {{ISSUE_KEY}}-123
/plan docs/features/user-authentication/spec.md
```

## Orchestrator Checkpoint

> **🛑 Before starting**: For complex features spanning multiple domains (backend + frontend + API + docs),
> dispatch **Researcher** subagents in parallel to analyze each domain simultaneously.
> Use the `writing-plans` skill for structured plan creation.
> See `.claude/rules-snippets/subagent-workflow.md` for full patterns.

## Process

> **📋 Standards**: Reference [Patterns](../rules-snippets/patterns.md) for architecture patterns.

1. **Load Feature Context**:
   - Use the supplied requirement as sufficient input. Ask targeted questions only when the request is unclear; do not require creating a specification first.
   - If an existing specification is available at `docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/spec.md`, read it as optional context.
   - Review `AGENTS.md` for architecture patterns
   - Check `docs/constitution.md` for project principles

2. **Analyze Requirements**:
   - Functional requirements
   - Non-functional requirements
   - Dependencies on existing code
   - External service integrations

3. **Generate Implementation Plan**:

   Create `docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/plan.md` with:

   - **Architecture Overview**: Component structure, data flow
   - **Tech Stack**: Libraries and frameworks to use
   - **File Structure**: Exact paths following project conventions
   - **API Design**: Input/output schemas (if applicable)
   - **Database Changes**: Schema modifications (if needed)
   - **Security Considerations**: Auth, validation, data protection
   - **Testing Strategy**: Unit, integration, E2E approach
   - **Integration Points**: Dependencies on other features
   - **Parallelization Map**: Identify independent tasks that can be dispatched to parallel subagents during implementation (mark with `[P]`)

4. **Generate Additional Artifacts** (if needed, place in the same feature folder):
   - `docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/research.md` - Technical research
   - `docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/data-model.md` - Data model details
   - `docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/api-contract.md` - API specifications

5. **Review and Accept Planning Artifacts**:
   - The orchestrator dispatches an independent, read-only reviewer with the original request, requirements/context, plan and any additional artifact paths. Review the actual artifacts for completeness, dependencies/order, actionability, and coverage of the request; return `VERDICT: PASS` or `VERDICT: CHANGES` with blocking findings and section references.
   - Repair blocking findings within the agreed scope, repeat affected artifact checks, and re-review the changed artifacts independently. Repeat until PASS or blocked; unresolved decisions go to the user.
   - Only the orchestrator accepts, after an independent PASS and evidence for every requirement and applicable artifact check. If an independent reviewer is unavailable, report BLOCKED; self-review cannot substitute for independent acceptance.
   - This is a lightweight artifact review, not a code build loop: do not implement the plan, run runtime build/TDD/git procedures, or add commit, push, or apply steps. Keep any required human approval separate from artifact acceptance.

6. **Report Completion** (only after artifact acceptance):
   - Plan file path
   - Additional artifacts created
   - Ready for `/tasks` command

## Plan Template

```markdown
# Implementation Plan: {{FEATURE_NAME}}

## Overview
[Feature description and goals]

## Architecture
[Component structure and relationships]

## Tech Stack
- {{FRAMEWORK}}: [usage]
- {{DATABASE}}: [usage]

## File Structure
- `{{SRC_DIR}}/{{FEATURE_NAME}}/`
  - `index.{{FILE_EXTENSION}}` - Entry point
  - `types.{{FILE_EXTENSION}}` - Type definitions

## API Design
[Endpoints, inputs, outputs]

## Database Changes
[Schema modifications]

## Testing Strategy
- Unit tests for [components]
- Integration tests for [flows]
- E2E tests for [scenarios]

## Security
[Authentication, authorization, validation]

## Open Questions
- [ ] Question 1
```
