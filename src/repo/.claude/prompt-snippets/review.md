# Code Review

Comprehensive code review checklist for quality, security, and maintainability.

> **📋 This is the base review prompt.** [/review-pr](review-pr.md) and [/review-staged](review-staged.md) build on this with scenario-specific guidance. All three share the same review categories and report format defined here.

## Usage

```
/review {{SRC_DIR}}/feature/component.{{FILE_EXTENSION}}
/review feature-name
/review
```

## Orchestrator Checkpoint

> **🛑 For large PRs** (10+ files or 3+ domains): Dispatch specialist reviewers in parallel:
>
> - **Backend Architect** → architecture, API design, database
> - **Frontend Developer** → UI, components, accessibility
> - **Reviewer** → code quality, SOLID, DRY
> - **Documenter** → documentation completeness
>   Each reviewer returns findings independently; the orchestrator merges results.
>   See `.claude/rules-snippets/subagent-workflow.md` for patterns.

> **🛑 Subagent isolation**: For independent quality reviews (especially after implementation), dispatch the Reviewer as a fresh subagent with NO shared conversation context. Shared context creates anchoring bias and causes reviewers to rubber-stamp work they watched being built.

## Process

> **📋 Standards**: Review against [Coding Standards](../rules-snippets/coding-standards.md) and [Testing](../rules-snippets/testing.md).

1. **Determine Context**:
   - If file path provided, review that file
   - If feature name provided, review related files
   - If no argument, use chat history for context

2. **Load Context**:
   - Retrieve file contents and changes
   - Load `AGENTS.md` for project patterns
   - Check linked issues if available
   - **Git context** (when reviewing changes): note the base SHA (before changes) and head SHA (after changes) to scope the diff

3. **Conduct Review**:
   Apply review checklist and report findings

## Review Categories

### Architecture & Patterns

- [ ] Controllers/handlers are thin (business logic in services/models)
- [ ] Proper separation of concerns
- [ ] Appropriate use of design patterns
- [ ] Follows project architecture from `AGENTS.md`

### Functionality

- [ ] Code does what it's supposed to do
- [ ] Edge cases are handled
- [ ] No obvious bugs or logic errors

### Code Quality

- [ ] Code is readable and well-structured
- [ ] Functions are small and focused
- [ ] Variable names are descriptive
- [ ] No code duplication
- [ ] Follows project conventions from `AGENTS.md`

### Error Handling

- [ ] Errors are handled gracefully
- [ ] User-facing errors are friendly
- [ ] Errors are logged appropriately

### Security

- [ ] No security vulnerabilities
- [ ] Input validation is present
- [ ] Authorization checks in place
- [ ] Sensitive data handled properly
- [ ] No hardcoded secrets or credentials

### Performance

- [ ] No obvious performance issues
- [ ] Database queries optimized (no N+1)
- [ ] Appropriate caching where needed
- [ ] No unnecessary loops or operations

### Testing

- [ ] Tests verify actual behavior (not mocked behavior)
- [ ] Edge cases covered
- [ ] Tests are readable and maintainable
- [ ] No brittle or over-specified tests

### Documentation

- [ ] Complex logic is commented
- [ ] Public APIs are documented
- [ ] README updated if needed

## Report Format

```markdown
## Code Review: [file/feature]

### Strengths

[What was done well — call out good patterns, clean code, solid testing]

### Findings

#### Critical 🔴

- [Must fix before merge — security issues, data loss risks, broken functionality]

#### Important 🟡

- [Should address — performance problems, maintainability concerns, missing error handling]

#### Minor 🟢

- [Optional improvements — style inconsistencies, naming suggestions, documentation gaps]

### Assessment

[✅ Approved | ⚠️ Approved with suggestions | ❌ Changes required]
```

## Review Loop

After findings are reported:

1. **Critical issues**: MUST be fixed before proceeding. Re-review after fixes.
2. **Important issues**: SHOULD be fixed. Reviewer re-reviews after fixes.
3. **Minor issues**: Can be deferred or fixed at implementer's discretion.

If fixes are applied, verify them before marking the review complete.
