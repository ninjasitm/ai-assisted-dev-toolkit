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
> For this command, the artifact-only scope, source preservation, template and review gates below override that skill's execution handoff, worktree and commit procedures. Stop after reporting the accepted artifacts.
> See `.claude/rules-snippets/subagent-workflow.md` for full patterns.

## Process

> **📋 Standards**: Reference [Patterns](../rules-snippets/patterns.md) for architecture patterns.

1. **Load Feature Context**:
   - Use the supplied requirement as sufficient input. Ask targeted questions only when the request is unclear; do not require creating a specification first. When it is unclear, run a grill-me round: read and follow [grill-me](../../.agents/skills/grill-me/SKILL.md).
   - Conditional: offer a disposable prototype only when discussion and examples cannot settle one blocking behavior, UI, or state question and a runnable demo can. Get the user's permission; keep it isolated and synthetic, with no commits or external operations, and carry forward only the answer.
   - For UI work in the plan, follow the UI Work Routing section of [subagent-workflow](../rules-snippets/subagent-workflow.md).
   - Conditional: for a domain term that blocks requirements, resolve it from examples and the existing glossary or ADRs first; ask only about unresolved intent, with no automatic glossary or ADR edits.
   - If an existing specification is available at `docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/spec.md`, read it as optional context.
   - Without an existing specification, persist the original supplied requirements and acceptance criteria verbatim in `plan.md` under **Requirements Source** and **Acceptance Criteria**, including the source path or issue key when available. Preserve constraints; label any derived criteria or assumptions separately and ask the user about unclear or missing criteria rather than inventing approval. This plan is the durable requirements source for `/tasks` and `/assign-tasks`.
   - With an existing specification, link to its requirements and acceptance criteria instead of duplicating them. Surface conflicts with the supplied request to the user before proceeding. On re-entry from plan-only, remove copied **Requirements Source** and **Acceptance Criteria** text that the approved specification supersedes; keep the original source link and the goal-fit check and plan confirmation records.
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
   - The orchestrator runs the plan goal-fit check (B) with the original request, requirements/context, plan and any additional artifact paths. Use the brief (read and follow [fit-review](../rules-snippets/fit-review.md)). Use read-only Oracle for this goal-fit check; if Oracle is unavailable, use a fresh independent reviewer. Report BLOCKED only when neither can run. The author's self-review does not count. An explicit PASS allows the orchestrator to present the plan for human confirmation. Review the actual artifacts for completeness, dependencies/order, actionability, and coverage of the request, and trace goals and plan items both ways. Return `VERDICT: PASS` or `VERDICT: CHANGES` with blocking findings and section references. A finding that needs a user decision is blocking, marked `requires user decision; do not auto-repair`; stop and ask the user.
   - Repair blocking findings within the agreed scope, repeat affected artifact checks, and repeat the plan goal-fit check (B) on the changed artifacts independently. Repeat until PASS or blocked, or until the user decides. Stop as BLOCKED with the reason when a repair changes nothing or the same finding returns unchanged. A goal change from the check is a user decision, not a repair. Open decisions block PASS until the user resolves them.
   - Only the orchestrator presents the plan for human confirmation, and only after an explicit independent PASS and evidence for every requirement and applicable artifact check. If neither Oracle nor a fresh independent reviewer can run, report BLOCKED; self-review cannot substitute for independent acceptance.
   - This is a lightweight artifact check, not a code build loop: do not implement the plan, run runtime build/TDD/git procedures, or add commit, push, or apply steps. Keep any required human confirmation separate from the goal-fit PASS.

6. **Report Completion** (only after artifact acceptance):
   - Plan file path
   - Additional artifacts created
   - Ready for `/tasks` command

## Plan Template

```markdown
# Implementation Plan: {{FEATURE_NAME}}

## Overview
[Feature description and goals]

## Requirements Source
[Without a specification: original supplied requirements verbatim and source path/issue key. Otherwise: link to the specification's requirements.]

## Acceptance Criteria
[Without a specification: original supplied acceptance criteria verbatim; label derived criteria/assumptions separately. Otherwise: link to the specification's criteria.]

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
