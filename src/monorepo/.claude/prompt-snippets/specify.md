You are helping to create a feature specification based on the user's description.

## Your Task

1. **Parse the feature description**:
   - Extract the core functionality being requested
   - Identify user stories or use cases
   - Note any constraints or requirements mentioned

2. **Load context**:
   - Read `AGENTS.md` for project architecture
   - Review existing features in `apps/*/docs/features/` for format consistency
   - Check related code for context

3. **Create the specification**:
   - Determine the target app directory (e.g., `apps/{{APP_NAME}}/`)
   - Create `apps/{{APP_NAME}}/docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/spec.md`
   - Use the template structure below
   - Be specific and actionable

4. **Review and Accept the Specification**:
   - Dispatch an independent, read-only reviewer with the original request (verbatim, with any later user amendments), the feature description, and `spec.md`. Use the goal-fit brief (read and follow [fit-review](../rules-snippets/fit-review.md)): Oracle when available read-only, otherwise a separate reviewer; the author's self-review does not count.
   - The reviewer traces requirements and acceptance criteria both ways against the original request, checks that each criterion is testable, and returns `VERDICT: PASS` or `VERDICT: CHANGES` with blocking findings and section references. A finding that needs a user decision is blocking, marked `requires user decision; do not auto-repair`; stop and ask the user.
   - Repair blocking findings within the agreed scope, repeat the affected checks, and re-review the changed spec independently. Repeat until PASS or blocked, or until the user decides. Stop as BLOCKED with the reason when a repair changes nothing or the same finding returns unchanged. A goal change from the review is a user decision, not a repair. Open decisions block PASS until the user resolves them.
   - Only the orchestrator accepts, after an independent PASS. If an independent reviewer is unavailable, report BLOCKED; self-review cannot substitute for independent acceptance.
   - Acceptance is separate from human approval: the human still confirms the spec.

5. **Output** (only after artifact acceptance):
   - Confirm specification created and accepted
   - Summarize key requirements
   - Suggest next step: `/plan` to create implementation plan

## Specification Template

```markdown
# Feature: {{FEATURE_NAME}}

## Overview
[What this feature does and why it's needed]

## User Stories
- As a [user type], I want [goal] so that [benefit]

## Functional Requirements
1. [Requirement 1]
2. [Requirement 2]

## Non-Functional Requirements
- Performance: [expectations]
- Security: [considerations]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Out of Scope
- [What this feature does NOT include]
```
