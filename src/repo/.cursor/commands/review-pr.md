```mdc
---
description: Conduct comprehensive pull request code review
---

# Review Pull Request

Conduct comprehensive code review for pull requests.

## Usage

```

/review-pr 42
/review-pr https://github.com/{{REPO_OWNER}}/{{PROJECT_NAME}}/pull/42

````

## Process

1. **Load PR Context**:
   - Get PR details (title, description, changed files)
   - Extract issue reference if available
   - Get PR diff and file changes
   - Identify unresolved review comments

2. **Verify Requirements**:
   - Read specification if linked
   - Check task completion
   - Verify acceptance criteria met

3. **Code Review Analysis**:

   ### Architecture & Patterns
   - [ ] Follows project architecture from `AGENTS.md`
   - [ ] Uses established patterns
   - [ ] Proper separation of concerns
   - [ ] No code duplication

   ### Code Quality
   - [ ] Properly typed (no `any` in TypeScript)
   - [ ] Consistent naming conventions
   - [ ] Appropriate error handling
   - [ ] No debug code in production
   - [ ] Comments for complex logic

   ### Testing & Quality
   - [ ] Unit tests for new functionality
   - [ ] Integration tests updated
   - [ ] E2E tests for user-facing features
   - [ ] All tests passing

   ### Security & Performance
   - [ ] Input validation implemented
   - [ ] No security vulnerabilities
   - [ ] Performance impact assessed
   - [ ] Database queries optimized

   ### Documentation
   - [ ] Code documentation present
   - [ ] README updated if needed
   - [ ] API documentation current

4. **Review Decision**:

   - **✅ Approve**: All criteria met, ready for merge
   - **❌ Request Changes**: Blocking issues found
   - **💬 Comment**: Non-blocking suggestions only

5. **Add Review Comments**:

   ```markdown
   ## Review Summary

   [Decision] - [Brief summary]

   ## Findings

   ### Critical
   - [Issue requiring fix before merge]

   ### Suggestions
   - [Optional improvements]

   ## Testing Notes
   - [Verification performed]
````

6. **Report Review Status**:
   - Review decision
   - Key findings summary
   - Action items if any

```

```
