# Create Feature Specification

Start a new feature by creating a specification. This is the first step in the development lifecycle.

## Usage

```
/specify Add user authentication with OAuth2 support
/specify Create a REST API for product catalog
```

## Process

> **📋 Context**: Reference [Project Context](../rules-snippets/project-context.md) for architecture and patterns.

1. **Parse Feature Description**:
   - Extract core functionality
   - Identify user stories
   - Note constraints and requirements

2. **Determine Context**:
   - Check `AGENTS.md` for project architecture
   - Review existing features in `docs/features/`
   - Understand tech stack and patterns

3. **Create Feature Directory**:
   ```
   docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/
   ```

4. **Generate Specification**:

   Create `docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/spec.md` using template:

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
   - Scalability: [requirements]

   ## Acceptance Criteria
   - [ ] Criterion 1
   - [ ] Criterion 2

   ## Technical Constraints
   - [Framework/library requirements]
   - [Integration requirements]

   ## Out of Scope
   - [What this feature does NOT include]

   ## Open Questions
   - [ ] [Questions needing clarification]
   ```

5. **Review and Accept the Specification**:
   - Dispatch an independent, read-only reviewer with the original request (verbatim, with any later user amendments), the feature description, any intake answers, and `spec.md`. Use the goal-fit brief (read and follow [fit-review](../rules-snippets/fit-review.md)): Oracle when available read-only, otherwise a separate reviewer; the author's self-review does not count.
   - The reviewer traces requirements and acceptance criteria both ways against the original request, checks that each criterion is testable, and returns `VERDICT: PASS` or `VERDICT: CHANGES` with blocking findings and section references. A finding that needs a user decision is blocking, marked `requires user decision; do not auto-repair`; stop and ask the user.
   - Repair blocking findings within the agreed scope, repeat the affected checks, and re-review the changed spec independently. Repeat until PASS or blocked, or until the user decides. Stop as BLOCKED with the reason when a repair changes nothing or the same finding returns unchanged. A goal change from the review is a user decision, not a repair. Open decisions block PASS until the user resolves them.
   - Only the orchestrator accepts, after an independent PASS. If an independent reviewer is unavailable, report BLOCKED; self-review cannot substitute for independent acceptance.
   - Acceptance is separate from human approval: the human still confirms the spec.

6. **Create Git Branch** (optional):
   ```bash
   git checkout -b feature/{{FEATURE_NAME}}
   ```

7. **Report Completion** only after artifact acceptance:
   - Feature directory path
   - Spec file path
   - Branch name (if created)
   - Ready for `/plan` command

## Guidelines

- Be specific and actionable
- Mark ambiguities with `[NEEDS CLARIFICATION: question]`
- Include acceptance criteria for testability
- Reference existing patterns from `AGENTS.md`
